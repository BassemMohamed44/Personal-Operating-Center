from datetime import datetime
from flask import Blueprint, request, current_app
from models import db, Project, log
from services import project_service
from utils.helpers import json_ok, json_error

api_projects_bp = Blueprint("api_projects", __name__, url_prefix="/api/projects")


@api_projects_bp.route("", methods=["GET"])
def list_projects():
    projects = Project.query.all()
    data = []
    for p in projects:
        p.status = project_service.project_status(p)
        data.append(p.to_dict())
    db.session.commit()
    return json_ok(data)


@api_projects_bp.route("", methods=["POST"])
def create_project():
    body = request.get_json(force=True) or {}
    name = (body.get("name") or "").strip()
    path = (body.get("path") or "").strip()
    if not name or not path:
        return json_error("name and path are required")
    project = Project(
        name=name, path=path,
        run_command=body.get("run_command", "python app.py"),
    )
    db.session.add(project)
    db.session.commit()
    return json_ok(project.to_dict())


@api_projects_bp.route("/<int:project_id>/run", methods=["POST"])
def run_project(project_id):
    project = Project.query.get_or_404(project_id)
    ok, result = project_service.start_project(project, current_app.config["LOG_DIR_PROJECTS"])
    if ok:
        project.status = "running"
        project.pid = result
        project.last_started = datetime.utcnow()
        db.session.commit()
        log("info", "project_manager", f"Started {project.name} (pid={result})")
        return json_ok(project.to_dict())
    log("error", "project_manager", f"Failed to start {project.name}: {result}")
    return json_error(result)


@api_projects_bp.route("/<int:project_id>/stop", methods=["POST"])
def stop_project(project_id):
    project = Project.query.get_or_404(project_id)
    ok, result = project_service.stop_project(project)
    if ok:
        project.status = "stopped"
        project.pid = None
        db.session.commit()
        log("info", "project_manager", f"Stopped {project.name}")
        return json_ok(project.to_dict())
    return json_error(result)


@api_projects_bp.route("/<int:project_id>/restart", methods=["POST"])
def restart_project(project_id):
    project = Project.query.get_or_404(project_id)
    project_service.stop_project(project)
    ok, result = project_service.start_project(project, current_app.config["LOG_DIR_PROJECTS"])
    if ok:
        project.status = "running"
        project.pid = result
        project.last_started = datetime.utcnow()
        db.session.commit()
        return json_ok(project.to_dict())
    return json_error(result)


@api_projects_bp.route("/<int:project_id>/logs", methods=["GET"])
def project_logs(project_id):
    project = Project.query.get_or_404(project_id)
    content = project_service.read_log_tail(current_app.config["LOG_DIR_PROJECTS"], project.id)
    return json_ok({"logs": content})


@api_projects_bp.route("/<int:project_id>/open-folder", methods=["POST"])
def open_folder(project_id):
    project = Project.query.get_or_404(project_id)
    ok, msg = project_service.open_folder(project.path)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_projects_bp.route("/<int:project_id>/open-vscode", methods=["POST"])
def open_vscode(project_id):
    project = Project.query.get_or_404(project_id)
    ok, msg = project_service.open_vscode(project.path)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_projects_bp.route("/<int:project_id>", methods=["DELETE"])
def delete_project(project_id):
    project = Project.query.get_or_404(project_id)
    db.session.delete(project)
    db.session.commit()
    return json_ok({"deleted": project_id})
