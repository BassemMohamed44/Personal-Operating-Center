from flask import Blueprint, request
from models import db, Note
from utils.helpers import json_ok, json_error

api_notes_bp = Blueprint("api_notes", __name__, url_prefix="/api/notes")


@api_notes_bp.route("", methods=["GET"])
def list_notes():
    notes = Note.query.order_by(Note.updated_at.desc()).all()
    return json_ok([n.to_dict() for n in notes])


@api_notes_bp.route("", methods=["POST"])
def create_note():
    body = request.get_json(force=True) or {}
    note = Note(title=body.get("title", "Untitled"), content=body.get("content", ""))
    db.session.add(note)
    db.session.commit()
    return json_ok(note.to_dict())


@api_notes_bp.route("/<int:note_id>", methods=["PATCH"])
def update_note(note_id):
    note = Note.query.get_or_404(note_id)
    body = request.get_json(force=True) or {}
    if "title" in body:
        note.title = body["title"]
    if "content" in body:
        note.content = body["content"]
    db.session.commit()
    return json_ok(note.to_dict())


@api_notes_bp.route("/<int:note_id>", methods=["DELETE"])
def delete_note(note_id):
    note = Note.query.get_or_404(note_id)
    db.session.delete(note)
    db.session.commit()
    return json_ok({"deleted": note_id})
