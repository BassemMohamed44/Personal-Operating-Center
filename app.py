import os
from flask import Flask

from config import Config, LOG_DIR
from models import db

from routes.pages import pages_bp
from routes.api_tasks import api_tasks_bp
from routes.api_notes import api_notes_bp
from routes.api_widgets import api_widgets_bp
from routes.api_settings import api_settings_bp
from routes.api_projects import api_projects_bp
from routes.api_system import api_system_bp
from routes.api_prayer import api_prayer_bp
from routes.api_calendar import api_calendar_bp
from routes.api_countdown import api_countdown_bp
from routes.api_notifications import api_notifications_bp
from routes.api_files import api_files_bp

from sockets import socketio, register_socket_events


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.config["LOG_DIR_PROJECTS"] = os.path.join(LOG_DIR, "projects")
    app.config["SCREENSHOT_DIR"] = os.path.join(LOG_DIR, "screenshots")

    db.init_app(app)

    app.register_blueprint(pages_bp)
    app.register_blueprint(api_tasks_bp)
    app.register_blueprint(api_notes_bp)
    app.register_blueprint(api_widgets_bp)
    app.register_blueprint(api_settings_bp)
    app.register_blueprint(api_projects_bp)
    app.register_blueprint(api_system_bp)
    app.register_blueprint(api_prayer_bp)
    app.register_blueprint(api_calendar_bp)
    app.register_blueprint(api_countdown_bp)
    app.register_blueprint(api_notifications_bp)
    app.register_blueprint(api_files_bp)

    socketio.init_app(app)
    with app.app_context():
        db.create_all()
        register_socket_events(app)

    return app


app = create_app()

if __name__ == "__main__":
    debug_mode = os.environ.get("POC_DEBUG", "0") == "1"
    socketio.run(app, host=Config.HOST, port=Config.PORT, debug=debug_mode, allow_unsafe_werkzeug=True)
