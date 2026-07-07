from flask import Blueprint, request
from models import db, WidgetPosition, Setting
from widgets.registry import WIDGET_REGISTRY
from utils.helpers import json_ok, json_error

api_widgets_bp = Blueprint("api_widgets", __name__, url_prefix="/api/widgets")


@api_widgets_bp.route("/available", methods=["GET"])
def available_widgets():
    return json_ok(WIDGET_REGISTRY)


@api_widgets_bp.route("/layout", methods=["GET"])
def get_layout():
    positions = WidgetPosition.query.order_by(WidgetPosition.order_index).all()
    existing_ids = {p.widget_id for p in positions}

    created = False
    for idx, w in enumerate(WIDGET_REGISTRY):
        if w["id"] not in existing_ids:
            db.session.add(WidgetPosition(
                widget_id=w["id"], x=(idx % 3) * 4, y=(idx // 3) * 4,
                w=4, h=4, visible=w.get("default_visible", True), order_index=idx,
            ))
            created = True
    if created:
        db.session.commit()
        positions = WidgetPosition.query.order_by(WidgetPosition.order_index).all()

    return json_ok([p.to_dict() for p in positions])


@api_widgets_bp.route("/layout", methods=["POST"])
def save_layout():
    body = request.get_json(force=True) or []
    for item in body:
        pos = WidgetPosition.query.filter_by(widget_id=item["widget_id"]).first()
        if not pos:
            pos = WidgetPosition(widget_id=item["widget_id"])
            db.session.add(pos)
        pos.x = item.get("x", pos.x)
        pos.y = item.get("y", pos.y)
        pos.w = item.get("w", pos.w)
        pos.h = item.get("h", pos.h)
        pos.visible = item.get("visible", pos.visible)
        pos.order_index = item.get("order_index", pos.order_index)
    db.session.commit()
    return json_ok({"saved": len(body)})


@api_widgets_bp.route("/<widget_id>/visibility", methods=["POST"])
def toggle_visibility(widget_id):
    pos = WidgetPosition.query.filter_by(widget_id=widget_id).first_or_404()
    body = request.get_json(force=True) or {}
    pos.visible = bool(body.get("visible", not pos.visible))
    db.session.commit()
    return json_ok(pos.to_dict())

