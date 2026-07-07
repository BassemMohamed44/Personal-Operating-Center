import threading
import time
from datetime import datetime

from flask_socketio import SocketIO

from services import system_service
from services import notification_service

socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

_bg_started = False
_lock = threading.Lock()


def register_socket_events(app):
    @socketio.on("connect")
    def handle_connect():
        socketio.emit("server_message", {"msg": "Connected to POC server"})

    @socketio.on("disconnect")
    def handle_disconnect():
        pass

    start_background_broadcaster(app)
    start_notification_poller(app)


def start_background_broadcaster(app):
    global _bg_started
    with _lock:
        if _bg_started:
            return
        _bg_started = True

    def loop():
        while True:
            try:
                now = datetime.now()
                socketio.emit("clock_tick", {
                    "time": now.strftime("%H:%M:%S"),
                    "date": now.strftime("%Y-%m-%d"),
                    "weekday": now.strftime("%A"),
                })
                stats = system_service.get_system_stats()
                socketio.emit("system_stats", stats)
            except Exception:
                pass
            socketio.sleep(1)

    socketio.start_background_task(loop)


_notif_started = False


def start_notification_poller(app, interval_seconds=45):
    global _notif_started
    with _lock:
        if _notif_started:
            return
        _notif_started = True

    def loop():
        while True:
            try:
                with app.app_context():
                    created = notification_service.poll_all()
                    for note in created:
                        socketio.emit("new_notification", note.to_dict())
            except Exception:
                pass
            socketio.sleep(interval_seconds)

    socketio.start_background_task(loop)
