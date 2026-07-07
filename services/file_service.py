import os
import platform
import shutil
import string
from datetime import datetime

IS_WINDOWS = platform.system() == "Windows"

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"}
TEXT_EXTS = {".txt", ".md", ".py", ".js", ".json", ".css", ".html", ".log", ".yml", ".yaml", ".ini", ".cfg"}


def get_drives():
    if not IS_WINDOWS:
        return ["/"]
    drives = []
    for letter in string.ascii_uppercase:
        drive = f"{letter}:\\"
        if os.path.exists(drive):
            drives.append(drive)
    return drives


def _safe_normalize(path):
    return os.path.realpath(os.path.normpath(path))


def _file_info(full_path):
    try:
        stat = os.stat(full_path)
        is_dir = os.path.isdir(full_path)
        ext = os.path.splitext(full_path)[1].lower()
        return {
            "name": os.path.basename(full_path) or full_path,
            "path": full_path,
            "is_dir": is_dir,
            "size": stat.st_size if not is_dir else None,
            "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "is_image": (not is_dir) and ext in IMAGE_EXTS,
            "is_text": (not is_dir) and ext in TEXT_EXTS,
            "ext": ext,
        }
    except (OSError, PermissionError):
        return None


def list_dir(path):
    path = _safe_normalize(path)
    if not os.path.isdir(path):
        return False, "Path does not exist or is not a directory"

    entries = []
    try:
        with os.scandir(path) as it:
            for entry in it:
                info = _file_info(entry.path)
                if info:
                    entries.append(info)
    except PermissionError:
        return False, "No permission to access this folder"

    entries.sort(key=lambda e: (not e["is_dir"], e["name"].lower()))
    parent = os.path.dirname(path) if os.path.dirname(path) != path else None
    return True, {"path": path, "parent": parent, "entries": entries}


def create_folder(path, name):
    try:
        new_path = os.path.join(_safe_normalize(path), name)
        os.makedirs(new_path, exist_ok=False)
        return True, new_path
    except FileExistsError:
        return False, "Folder already exists"
    except Exception as e:
        return False, str(e)


def delete_path(path):
    path = _safe_normalize(path)
    try:
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
        return True, "Deleted"
    except Exception as e:
        return False, str(e)


def rename_path(path, new_name):
    path = _safe_normalize(path)
    try:
        new_path = os.path.join(os.path.dirname(path), new_name)
        os.rename(path, new_path)
        return True, new_path
    except Exception as e:
        return False, str(e)


def save_upload(target_dir, file_storage):
    try:
        target_dir = _safe_normalize(target_dir)
        filename = os.path.basename(file_storage.filename)
        if not filename:
            return False, "Invalid filename"
        dest = os.path.join(target_dir, filename)
        file_storage.save(dest)
        return True, dest
    except Exception as e:
        return False, str(e)


def open_in_explorer(path):
    try:
        path = _safe_normalize(path)
        if IS_WINDOWS:
            os.startfile(path)
        elif platform.system() == "Darwin":
            import subprocess
            subprocess.run(["open", path])
        else:
            import subprocess
            subprocess.run(["xdg-open", path])
        return True, "Opened"
    except Exception as e:
        return False, str(e)
