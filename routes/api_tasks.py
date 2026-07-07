from flask import Blueprint, request
from models import db, Task
from utils.helpers import json_ok, json_error

api_tasks_bp = Blueprint("api_tasks", __name__, url_prefix="/api/tasks")


@api_tasks_bp.route("", methods=["GET"])
def list_tasks():
    tasks = Task.query.order_by(Task.created_at.desc()).all()
    return json_ok([t.to_dict() for t in tasks])


@api_tasks_bp.route("", methods=["POST"])
def create_task():
    body = request.get_json(force=True) or {}
    title = (body.get("title") or "").strip()
    if not title:
        return json_error("Title is required")
    task = Task(title=title, priority=body.get("priority", "normal"))
    db.session.add(task)
    db.session.commit()
    return json_ok(task.to_dict())


@api_tasks_bp.route("/<int:task_id>", methods=["PATCH"])
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    body = request.get_json(force=True) or {}
    if "done" in body:
        task.done = bool(body["done"])
    if "title" in body:
        task.title = body["title"]
    if "priority" in body:
        task.priority = body["priority"]
    db.session.commit()
    return json_ok(task.to_dict())


@api_tasks_bp.route("/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return json_ok({"deleted": task_id})
