import os
import sys
import time
import subprocess
import platform

import psutil

IS_WINDOWS = platform.system() == "Windows"
BOOT_TIME = psutil.boot_time()


def get_system_stats():
    cpu = psutil.cpu_percent(interval=None)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.abspath(os.sep))
    uptime_seconds = int(time.time() - BOOT_TIME)

    return {
        "cpu_percent": cpu,
        "ram_percent": mem.percent,
        "ram_used_gb": round(mem.used / (1024 ** 3), 2),
        "ram_total_gb": round(mem.total / (1024 ** 3), 2),
        "disk_percent": disk.percent,
        "disk_used_gb": round(disk.used / (1024 ** 3), 2),
        "disk_total_gb": round(disk.total / (1024 ** 3), 2),
        "uptime_seconds": uptime_seconds,
        "platform": platform.platform(),
    }


def get_top_processes(limit=10):
    procs = []
    for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_percent"]):
        try:
            info = p.info
            procs.append({
                "pid": info["pid"],
                "name": info["name"],
                "cpu_percent": round(info["cpu_percent"] or 0, 1),
                "memory_percent": round(info["memory_percent"] or 0, 1),
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    procs.sort(key=lambda x: x["cpu_percent"], reverse=True)
    return procs[:limit]


def kill_process(pid):
    try:
        p = psutil.Process(pid)
        p.terminate()
        return True, f"Process {pid} terminated"
    except Exception as e:
        return False, str(e)


# ---------------- Windows power / control actions ----------------


def shutdown(delay_seconds=5):
    if not IS_WINDOWS:
        return False, "Shutdown is only supported on Windows"
    subprocess.run(["shutdown", "/s", "/t", str(delay_seconds)], shell=False)
    return True, f"Shutdown scheduled in {delay_seconds}s"


def restart(delay_seconds=5):
    if not IS_WINDOWS:
        return False, "Restart is only supported on Windows"
    subprocess.run(["shutdown", "/r", "/t", str(delay_seconds)], shell=False)
    return True, f"Restart scheduled in {delay_seconds}s"


def cancel_shutdown():
    if not IS_WINDOWS:
        return False, "Only supported on Windows"
    subprocess.run(["shutdown", "/a"], shell=False)
    return True, "Pending shutdown/restart cancelled"


def sleep():
    if not IS_WINDOWS:
        return False, "Sleep is only supported on Windows"
    subprocess.run(
        ["rundll32.exe", "powrprof.dll,SetSuspendState", "0", "1", "0"], shell=False
    )
    return True, "Sleep triggered"


def lock():
    if not IS_WINDOWS:
        return False, "Lock is only supported on Windows"
    subprocess.run(["rundll32.exe", "user32.dll,LockWorkStation"], shell=False)
    return True, "Workstation locked"


def take_screenshot(save_dir):
    try:
        from PIL import ImageGrab 
    except ImportError:
        return False, "Pillow is not installed (pip install Pillow)"

    os.makedirs(save_dir, exist_ok=True)
    filename = f"screenshot_{int(time.time())}.png"
    full_path = os.path.join(save_dir, filename)
    img = ImageGrab.grab()
    img.save(full_path, "PNG")
    return True, full_path


def run_shell_command(command, timeout=15):
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        return True, {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return False, {"stdout": "", "stderr": "Command timed out", "returncode": -1}
    except Exception as e:
        return False, {"stdout": "", "stderr": str(e), "returncode": -1}
