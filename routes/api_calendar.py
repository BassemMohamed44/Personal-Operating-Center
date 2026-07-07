from flask import Blueprint, request
from models import db, CalendarEvent
from utils.helpers import json_ok, json_error

api_calendar_bp = Blueprint("api_calendar", __name__, url_prefix="/api/calendar")


@api_calendar_bp.route("/events", methods=["GET"])
def list_events():
    month = request.args.get("month")
    query = CalendarEvent.query
    if month:
        query = query.filter(CalendarEvent.event_date.like(f"{month}%"))
    events = query.order_by(CalendarEvent.event_date).all()
    return json_ok([e.to_dict() for e in events])


@api_calendar_bp.route("/events", methods=["POST"])
def create_event():
    body = request.get_json(force=True) or {}
    title = (body.get("title") or "").strip()
    event_date = (body.get("event_date") or "").strip()
    if not title or not event_date:
        return json_error("title and event_date required (YYYY-MM-DD)")
    event = CalendarEvent(
        title=title, event_date=event_date,
        event_time=body.get("event_time"),
        color=body.get("color", "accent"),
        notes=body.get("notes", ""),
    )
    db.session.add(event)
    db.session.commit()
    return json_ok(event.to_dict())


@api_calendar_bp.route("/events/<int:event_id>", methods=["DELETE"])
def delete_event(event_id):
    event = CalendarEvent.query.get_or_404(event_id)
    db.session.delete(event)
    db.session.commit()
    return json_ok({"deleted": event_id})
