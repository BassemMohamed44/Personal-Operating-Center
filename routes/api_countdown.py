from datetime import datetime
from flask import Blueprint, request
from models import db, CountdownTarget
from utils.helpers import json_ok, json_error

api_countdown_bp = Blueprint("api_countdown", __name__, url_prefix="/api/countdown")


@api_countdown_bp.route("", methods=["GET"])
def list_countdowns():
    items = CountdownTarget.query.order_by(CountdownTarget.target_datetime).all()
    return json_ok([c.to_dict() for c in items])


@api_countdown_bp.route("", methods=["POST"])
def create_countdown():
    body = request.get_json(force=True) or {}
    title = (body.get("title") or "").strip()
    target = (body.get("target_datetime") or "").strip()
    if not title or not target:
        return json_error("title and target_datetime required")
    try:
        target_dt = datetime.fromisoformat(target)
    except ValueError:
        return json_error("The date format is incorrect")
    item = CountdownTarget(title=title, target_datetime=target_dt)
    db.session.add(item)
    db.session.commit()
    return json_ok(item.to_dict())


@api_countdown_bp.route("/<int:item_id>", methods=["DELETE"])
def delete_countdown(item_id):
    item = CountdownTarget.query.get_or_404(item_id)
    db.session.delete(item)
    db.session.commit()
    return json_ok({"deleted": item_id})
