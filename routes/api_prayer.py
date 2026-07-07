import requests
from flask import Blueprint, request
from models import db, Setting
from utils.helpers import json_ok, json_error

api_prayer_bp = Blueprint("api_prayer", __name__, url_prefix="/api/prayer")

ALADHAN_URL = "https://api.aladhan.com/v1/timingsByCity"


@api_prayer_bp.route("/times", methods=["GET"])
def get_times():
    city = request.args.get("city") or _get_setting("prayer_city", "Cairo")
    country = request.args.get("country") or _get_setting("prayer_country", "Egypt")
    method = request.args.get("method") or _get_setting("prayer_method", "5")

    try:
        resp = requests.get(
            ALADHAN_URL,
            params={"city": city, "country": country, "method": method},
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        timings = data.get("data", {}).get("timings", {})
        if not timings:
            return json_error("Failed to fetch prayer times for this city")

        wanted = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"]
        result = {k: timings[k] for k in wanted if k in timings}
        return json_ok({"city": city, "country": country, "timings": result})
    except requests.exceptions.RequestException as e:
        return json_error(f"Unable to connect to the prayer times service: {e}", 502)


@api_prayer_bp.route("/settings", methods=["POST"])
def save_prayer_settings():
    body = request.get_json(force=True) or {}
    for key in ("city", "country", "method"):
        if key in body:
            _set_setting(f"prayer_{key}", body[key])
    return json_ok(body)


def _get_setting(key, default):
    row = Setting.query.get(key)
    return row.value if row and row.value else default


def _set_setting(key, value):
    row = Setting.query.get(key)
    if not row:
        row = Setting(key=key)
        db.session.add(row)
    row.value = str(value)
    db.session.commit()
