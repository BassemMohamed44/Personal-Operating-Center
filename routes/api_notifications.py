from flask import Blueprint, request
from models import db, Notification, Setting
from services import notification_service as ns
from utils.helpers import json_ok, json_error

api_notifications_bp = Blueprint("api_notifications", __name__, url_prefix="/api/notifications")


@api_notifications_bp.route("", methods=["GET"])
def list_notifications():
    limit = int(request.args.get("limit", 50))
    items = Notification.query.order_by(Notification.created_at.desc()).limit(limit).all()
    unread = Notification.query.filter_by(is_read=False).count()
    return json_ok([n.to_dict() for n in items], unread_count=unread)


@api_notifications_bp.route("/poll-now", methods=["POST"])
def poll_now():
    created = ns.poll_all()
    return json_ok({"new_items": len(created)})


@api_notifications_bp.route("/<int:note_id>/read", methods=["POST"])
def mark_read(note_id):
    note = Notification.query.get_or_404(note_id)
    note.is_read = True
    db.session.commit()
    return json_ok(note.to_dict())


@api_notifications_bp.route("/read-all", methods=["POST"])
def mark_all_read():
    Notification.query.filter_by(is_read=False).update({"is_read": True})
    db.session.commit()
    return json_ok({"marked": True})


@api_notifications_bp.route("/<int:note_id>", methods=["DELETE"])
def delete_notification(note_id):
    note = Notification.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return json_ok({"deleted": note_id})


@api_notifications_bp.route("/clear", methods=["POST"])
def clear_all():
    Notification.query.delete()
    db.session.commit()
    return json_ok({"cleared": True})


# ---------------------------------------------------------------- Settings

SETTINGS_KEYS = [
    "notif_telegram_enabled", "notif_telegram_token",
    "notif_email_enabled", "notif_email_host", "notif_email_port",
    "notif_email_user", "notif_email_password", "notif_email_ssl",
    "notif_youtube_enabled", "notif_youtube_channels",
]


@api_notifications_bp.route("/settings", methods=["GET"])
def get_settings():
    rows = {s.key: s.value for s in Setting.query.filter(Setting.key.in_(SETTINGS_KEYS)).all()}
    if rows.get("notif_email_password"):
        rows["notif_email_password"] = "••••••••"
    return json_ok(rows)


@api_notifications_bp.route("/settings", methods=["POST"])
def save_settings():
    body = request.get_json(force=True) or {}
    for key in SETTINGS_KEYS:
        if key not in body:
            continue
        if key == "notif_email_password" and body[key] == "••••••••":
            continue
        row = Setting.query.get(key)
        if not row:
            row = Setting(key=key)
            db.session.add(row)
        row.value = str(body[key])
    db.session.commit()
    return json_ok({"saved": True})


@api_notifications_bp.route("/test/telegram", methods=["POST"])
def test_telegram():
    body = request.get_json(force=True) or {}
    token = body.get("token") or ""
    ok, msg = ns.test_telegram(token)
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_notifications_bp.route("/test/email", methods=["POST"])
def test_email_route():
    body = request.get_json(force=True) or {}
    ok, msg = ns.test_email(
        body.get("host"), body.get("port", 993),
        body.get("user"), body.get("password"),
        body.get("use_ssl", True),
    )
    return json_ok({"message": msg}) if ok else json_error(msg)


@api_notifications_bp.route("/test/youtube", methods=["POST"])
def test_youtube_route():
    body = request.get_json(force=True) or {}
    channel_id = (body.get("channel_id") or "").split(",")[0].strip()
    ok, msg = ns.test_youtube(channel_id)
    return json_ok({"message": msg}) if ok else json_error(msg)
