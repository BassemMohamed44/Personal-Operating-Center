from flask import Blueprint, request, current_app
from models import log
from services import system_service
from utils.helpers import json_ok, json_error, require_pin

import os
import sys
import time
import threading

api_system_bp = Blueprint("api_system", __name__, url_prefix="/api/system")


@api_system_bp.route("/stats", methods=["GET"])
def stats():
    return json_ok(system_service.get_system_stats())


@api_system_bp.route("/processes", methods=["GET"])
def processes():
    limit = int(request.args.get("limit", 10))
    return json_ok(system_service.get_top_processes(limit))


@api_system_bp.route("/processes/<int:pid>/kill", methods=["POST"])
@require_pin
def kill(pid):
    ok, msg = system_service.kill_process(pid)
    log("warn" if ok else "error", "system_control", f"kill pid={pid}: {msg}")
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/shutdown", methods=["POST"])
@require_pin
def shutdown():
    delay = int((request.get_json(silent=True) or {}).get("delay", 5))
    ok, msg = system_service.shutdown(delay)
    log("warn", "system_control", msg)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/restart", methods=["POST"])
@require_pin
def restart():
    delay = int((request.get_json(silent=True) or {}).get("delay", 5))
    ok, msg = system_service.restart(delay)
    log("warn", "system_control", msg)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/cancel-shutdown", methods=["POST"])
@require_pin
def cancel_shutdown():
    ok, msg = system_service.cancel_shutdown()
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/sleep", methods=["POST"])
@require_pin
def sleep():
    ok, msg = system_service.sleep()
    log("warn", "system_control", msg)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/lock", methods=["POST"])
@require_pin
def lock():
    ok, msg = system_service.lock()
    log("info", "system_control", msg)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_system_bp.route("/screenshot", methods=["POST"])
@require_pin
def screenshot():
    ok, result = system_service.take_screenshot(current_app.config["SCREENSHOT_DIR"])
    if ok:
        log("info", "system_control", f"Screenshot saved: {result}")
        return json_ok({"path": result})
    return json_error(result)


@api_system_bp.route("/run-command", methods=["POST"])
@require_pin
def run_command():
    body = request.get_json(force=True) or {}
    command = body.get("command", "").strip()
    if not command:
        return json_error("command is required")
    ok, result = system_service.run_shell_command(command)
    log("warn", "remote_terminal", f"$ {command}")
    return json_ok(result)


@api_system_bp.route("/restart-app", methods=["POST"])
@require_pin
def restart_app():
    def _delayed_restart():
        time.sleep(1)
        python = sys.executable
        os.execv(python, [python] + sys.argv)

    log("warn", "app_control", "Restart requested via API (self re-exec)")
    threading.Thread(target=_delayed_restart, daemon=True).start()
    return json_ok({"message": "Application will restart in 1 second..."})
