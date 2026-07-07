from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Setting(db.Model):
    __tablename__ = "settings"
    key = db.Column(db.String(100), primary_key=True)
    value = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {"key": self.key, "value": self.value}


class WidgetPosition(db.Model):
    __tablename__ = "widget_positions"
    id = db.Column(db.Integer, primary_key=True)
    widget_id = db.Column(db.String(100), unique=True, nullable=False)
    x = db.Column(db.Integer, default=0)
    y = db.Column(db.Integer, default=0)
    w = db.Column(db.Integer, default=4)
    h = db.Column(db.Integer, default=4)
    visible = db.Column(db.Boolean, default=True)
    order_index = db.Column(db.Integer, default=0)

    def to_dict(self):
        return {
            "widget_id": self.widget_id,
            "x": self.x, "y": self.y, "w": self.w, "h": self.h,
            "visible": self.visible, "order_index": self.order_index,
        }


class Task(db.Model):
    __tablename__ = "tasks"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    done = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default="normal")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "done": self.done,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "due_at": self.due_at.isoformat() if self.due_at else None,
        }


class Note(db.Model):
    __tablename__ = "notes"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), default="")
    content = db.Column(db.Text, default="")
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "content": self.content,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class Notification(db.Model):
    __tablename__ = "notifications"
    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(50)) 
    title = db.Column(db.String(255))
    body = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "source": self.source, "title": self.title,
            "body": self.body, "is_read": self.is_read,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class LogEntry(db.Model):
    __tablename__ = "logs"
    id = db.Column(db.Integer, primary_key=True)
    level = db.Column(db.String(20), default="info")
    source = db.Column(db.String(100))
    message = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id, "level": self.level, "source": self.source,
            "message": self.message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Project(db.Model):
    __tablename__ = "projects"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    path = db.Column(db.String(500), nullable=False)
    run_command = db.Column(db.String(500), default="python app.py")
    status = db.Column(db.String(20), default="stopped")  
    pid = db.Column(db.Integer, nullable=True)
    last_started = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "name": self.name, "path": self.path,
            "run_command": self.run_command, "status": self.status,
            "pid": self.pid,
            "last_started": self.last_started.isoformat() if self.last_started else None,
        }


class CalendarEvent(db.Model):
    __tablename__ = "calendar_events"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    event_date = db.Column(db.String(10), nullable=False)  
    event_time = db.Column(db.String(5), nullable=True)     
    color = db.Column(db.String(20), default="accent")
    notes = db.Column(db.Text, default="")

    def to_dict(self):
        return {
            "id": self.id, "title": self.title, "event_date": self.event_date,
            "event_time": self.event_time, "color": self.color, "notes": self.notes,
        }


class CountdownTarget(db.Model):
    __tablename__ = "countdown_targets"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    target_datetime = db.Column(db.DateTime, nullable=False)

    def to_dict(self):
        return {
            "id": self.id, "title": self.title,
            "target_datetime": self.target_datetime.isoformat(),
        }


def log(level, source, message):
    entry = LogEntry(level=level, source=source, message=message)
    db.session.add(entry)
    db.session.commit()
    return entry
