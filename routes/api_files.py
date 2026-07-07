import os
from flask import Blueprint, request, current_app, send_file, abort
from services import file_service as fs
from utils.helpers import json_ok, json_error, require_pin

api_files_bp = Blueprint("api_files", __name__, url_prefix="/api/files")


@api_files_bp.route("/root", methods=["GET"])
def get_root():
    return json_ok({
        "default_path": current_app.config["FILE_MANAGER_ROOT"],
        "drives": fs.get_drives(),
    })


@api_files_bp.route("/list", methods=["GET"])
def list_dir():
    path = request.args.get("path") or current_app.config["FILE_MANAGER_ROOT"]
    ok, data = fs.list_dir(path)
    return json_ok(data) if ok else json_error(data)


@api_files_bp.route("/mkdir", methods=["POST"])
@require_pin
def mkdir():
    body = request.get_json(force=True) or {}
    path = body.get("path")
    name = (body.get("name") or "").strip()
    if not path or not name:
        return json_error("path and name required")
    ok, result = fs.create_folder(path, name)
    return json_ok({"path": result}) if ok else json_error(result)


@api_files_bp.route("/delete", methods=["POST"])
@require_pin
def delete():
    body = request.get_json(force=True) or {}
    path = body.get("path")
    if not path:
        return json_error("path required")
    ok, msg = fs.delete_path(path)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_files_bp.route("/rename", methods=["POST"])
@require_pin
def rename():
    body = request.get_json(force=True) or {}
    path = body.get("path")
    new_name = (body.get("new_name") or "").strip()
    if not path or not new_name:
        return json_error("path and new_name required")
    ok, result = fs.rename_path(path, new_name)
    return json_ok({"path": result}) if ok else json_error(result)


@api_files_bp.route("/upload", methods=["POST"])
@require_pin
def upload():
    target_dir = request.form.get("path")
    if not target_dir:
        return json_error("path required")
    if "file" not in request.files:
        return json_error("No file attached")
    file = request.files["file"]
    ok, result = fs.save_upload(target_dir, file)
    return json_ok({"path": result}) if ok else json_error(result)


@api_files_bp.route("/download", methods=["GET"])
def download():
    path = request.args.get("path")
    if not path or not os.path.isfile(path):
        return json_error("File not found", 404)
    return send_file(path, as_attachment=True)


@api_files_bp.route("/preview", methods=["GET"])
def preview():
    path = request.args.get("path")
    if not path or not os.path.isfile(path):
        abort(404)
    return send_file(path, as_attachment=False)


@api_files_bp.route("/open", methods=["POST"])
@require_pin
def open_folder():
    body = request.get_json(force=True) or {}
    path = body.get("path")
    if not path:
        return json_error("path required")
    ok, msg = fs.open_in_explorer(path)
    return json_ok({"message": msg}) if ok else json_error(msg)
