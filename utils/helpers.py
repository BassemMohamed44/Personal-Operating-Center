from functools import wraps
from flask import request, jsonify, current_app


def require_pin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        pin = request.headers.get("X-Control-Pin", "")
        if pin != current_app.config["CONTROL_PIN"]:
            return jsonify({"success": False, "error": "Invalid or missing control PIN"}), 403
        return f(*args, **kwargs)
    return wrapper


def json_ok(data=None, **extra):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    payload.update(extra)
    return jsonify(payload)


def json_error(message, code=400):
    return jsonify({"success": False, "error": message}), code
