from flask import Blueprint, request
from models import db, Setting
from utils.helpers import json_ok

api_settings_bp = Blueprint("api_settings", __name__, url_prefix="/api/settings")

DEFAULTS = {
    "theme": "dark",
    "language": "ar",
    "animations": "on",
    "refresh_rate_ms": "2000",
}


@api_settings_bp.route("", methods=["GET"])
def get_settings():
    rows = {s.key: s.value for s in Setting.query.all()}
    merged = {**DEFAULTS, **rows}
    return json_ok(merged)


@api_settings_bp.route("", methods=["POST"])
def save_settings():
    body = request.get_json(force=True) or {}
    for key, value in body.items():
        row = Setting.query.get(key)
        if not row:
            row = Setting(key=key)
            db.session.add(row)
        row.value = str(value)
    db.session.commit()
    return json_ok(body)


@api_settings_bp.route("/export", methods=["GET"])
def export_settings():
    rows = {s.key: s.value for s in Setting.query.all()}
    return json_ok(rows)


@api_settings_bp.route("/import", methods=["POST"])
def import_settings():
    body = request.get_json(force=True) or {}
    for key, value in body.items():
        row = Setting.query.get(key)
        if not row:
            row = Setting(key=key)
            db.session.add(row)
        row.value = str(value)
    db.session.commit()
    return json_ok({"imported": len(body)})
