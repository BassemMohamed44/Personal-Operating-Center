import json
import os
import platform
import subprocess
import sys
import threading
import time
import urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, HTTPServer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IS_WINDOWS = platform.system() == "Windows"

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, ".env"))
except ImportError:
    pass

APP_SCRIPT = os.path.join(BASE_DIR, "app.py")
HEALTH_URL = "http://127.0.0.1:5000/api/system/stats"
CHECK_INTERVAL = int(os.environ.get("POC_WD_CHECK_INTERVAL", "15"))        
FAIL_THRESHOLD = int(os.environ.get("POC_WD_FAIL_THRESHOLD", "3"))        
STARTUP_GRACE_SECONDS = int(os.environ.get("POC_WD_STARTUP_GRACE", "20")) 
WATCHDOG_PORT = 5001
CONTROL_PIN = os.environ.get("POC_CONTROL_PIN", "1234")

LOG_DIR = os.path.join(BASE_DIR, "logs")
os.makedirs(LOG_DIR, exist_ok=True)
LOG_PATH = os.path.join(LOG_DIR, "watchdog.log")

state = {
    "process": None,
    "started_at": None,
    "restart_count": 0,
    "last_restart_reason": None,
    "consecutive_failures": 0,
}
state_lock = threading.Lock()


def log(msg):
    line = f"[{datetime.now().isoformat(timespec='seconds')}] {msg}"
    print(line, flush=True)
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def start_app():
    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0
    proc = subprocess.Popen([sys.executable, APP_SCRIPT], cwd=BASE_DIR, creationflags=creationflags)
    with state_lock:
        state["process"] = proc
        state["started_at"] = datetime.now()
        state["consecutive_failures"] = 0
    log(f"App started (pid={proc.pid})")


def kill_app():
    proc = state["process"]
    if not proc:
        return
    try:
        if IS_WINDOWS:
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True)
        else:
            proc.kill()
        proc.wait(timeout=5)
    except Exception as e:
        log(f"Error while killing process: {e}")


def restart_app(reason="unknown"):
    with state_lock:
        state["restart_count"] += 1
        state["last_restart_reason"] = reason
    log(f"Restarting app... reason: {reason}")
    kill_app()
    start_app()


def is_process_alive():
    proc = state["process"]
    return proc is not None and proc.poll() is None


def health_check_ok():
    try:
        with urllib.request.urlopen(HEALTH_URL, timeout=5) as resp:
            return resp.status == 200
    except Exception:
        return False


def monitor_loop():
    start_app()
    time.sleep(STARTUP_GRACE_SECONDS)
    while True:
        time.sleep(CHECK_INTERVAL)

        if not is_process_alive():
            restart_app(reason="process exited unexpectedly")
            time.sleep(STARTUP_GRACE_SECONDS)
            continue

        if health_check_ok():
            with state_lock:
                state["consecutive_failures"] = 0
        else:
            with state_lock:
                state["consecutive_failures"] += 1
                failures = state["consecutive_failures"]
            log(f"Health check failed ({failures}/{FAIL_THRESHOLD})")
            if failures >= FAIL_THRESHOLD:
                restart_app(reason="health check failed repeatedly (app appears frozen)")
                time.sleep(STARTUP_GRACE_SECONDS)


# ---------------------------------------------------------------- Control server
class ControlHandler(BaseHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Control-Pin")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json(200, {"ok": True})

    def do_GET(self):
        if self.path == "/status":
            with state_lock:
                started_at = state["started_at"]
                uptime = (datetime.now() - started_at).total_seconds() if started_at else 0
                payload = {
                    "app_alive": is_process_alive(),
                    "pid": state["process"].pid if state["process"] else None,
                    "started_at": started_at.isoformat() if started_at else None,
                    "uptime_seconds": int(uptime),
                    "restart_count": state["restart_count"],
                    "last_restart_reason": state["last_restart_reason"],
                }
            self._send_json(200, {"success": True, "data": payload})
        else:
            self._send_json(404, {"success": False, "error": "not found"})

    def do_POST(self):
        pin = self.headers.get("X-Control-Pin", "")
        if pin != CONTROL_PIN:
            self._send_json(403, {"success": False, "error": "Invalid control PIN"})
            return
        if self.path == "/restart":
            threading.Thread(target=restart_app, kwargs={"reason": "manual remote restart"}, daemon=True).start()
            self._send_json(200, {"success": True, "data": {"message": "Force Restarting..."}})
        else:
            self._send_json(404, {"success": False, "error": "not found"})

    def log_message(self, format, *args):
        pass


def run_control_server():
    server = HTTPServer(("0.0.0.0", WATCHDOG_PORT), ControlHandler)
    log(f"Watchdog control server listening on port {WATCHDOG_PORT}")
    server.serve_forever()


if __name__ == "__main__":
    log("=== POC Watchdog starting ===")
    threading.Thread(target=run_control_server, daemon=True).start()
    try:
        monitor_loop()
    except KeyboardInterrupt:
        log("Watchdog stopped by user (Ctrl+C)")
        kill_app()
