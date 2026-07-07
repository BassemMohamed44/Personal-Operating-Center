import os
import subprocess
import platform
import shlex

import psutil

IS_WINDOWS = platform.system() == "Windows"

# Keep track of running project subprocess handles in memory: {project_id: Popen}
_RUNNING = {}


def start_project(project, log_dir):
    """Start a project's run_command in its own folder. Returns (success, pid_or_error)."""
    if project.id in _RUNNING and _RUNNING[project.id].poll() is None:
        return False, "Project is already running"

    os.makedirs(log_dir, exist_ok=True)
    log_path = os.path.join(log_dir, f"project_{project.id}.log")

    try:
        log_file = open(log_path, "a", encoding="utf-8")
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if IS_WINDOWS else 0
        proc = subprocess.Popen(
            project.run_command,
            cwd=project.path,
            shell=True,
            stdout=log_file,
            stderr=log_file,
            creationflags=creationflags,
        )
        _RUNNING[project.id] = proc
        return True, proc.pid
    except Exception as e:
        return False, str(e)


def stop_project(project):
    proc = _RUNNING.get(project.id)
    if proc is None:
        # Fall back to killing by stored pid
        if project.pid:
            try:
                psutil.Process(project.pid).terminate()
                return True, "Stopped by PID"
            except Exception as e:
                return False, str(e)
        return False, "Project is not tracked as running"

    try:
        proc.terminate()
        del _RUNNING[project.id]
        return True, "Stopped"
    except Exception as e:
        return False, str(e)


def project_status(project):
    proc = _RUNNING.get(project.id)
    if proc is not None and proc.poll() is None:
        return "running"
    if project.pid:
        try:
            if psutil.pid_exists(project.pid):
                return "running"
        except Exception:
            pass
    return "stopped"


def read_log_tail(log_dir, project_id, lines=200):
    log_path = os.path.join(log_dir, f"project_{project_id}.log")
    if not os.path.exists(log_path):
        return ""
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.readlines()
    return "".join(content[-lines:])


def open_folder(path):
    try:
        if IS_WINDOWS:
            os.startfile(path)
        elif platform.system() == "Darwin":
            subprocess.run(["open", path])
        else:
            subprocess.run(["xdg-open", path])
        return True, "Opened"
    except Exception as e:
        return False, str(e)


def open_vscode(path):
    try:
        subprocess.run(["code", path], shell=IS_WINDOWS)
        return True, "Opened in VS Code"
    except FileNotFoundError:
        return False, "VS Code 'code' command not found in PATH"
    except Exception as e:
        return False, str(e)