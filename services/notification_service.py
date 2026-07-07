import imaplib
import email
from email.header import decode_header
import xml.etree.ElementTree as ET

import requests

from models import db, Setting, Notification


def _get(key, default=None):
    row = Setting.query.get(key)
    return row.value if row and row.value not in (None, "") else default


def _set(key, value):
    row = Setting.query.get(key)
    if not row:
        row = Setting(key=key)
        db.session.add(row)
    row.value = str(value)
    db.session.commit()


def _store_notification(source, title, body):
    note = Notification(source=source, title=title[:255], body=body or "")
    db.session.add(note)
    db.session.commit()
    return note


# ---------------------------------------------------------------- Telegram
def test_telegram(token):
    try:
        resp = requests.get(f"https://api.telegram.org/bot{token}/getMe", timeout=8)
        data = resp.json()
        if data.get("ok"):
            return True, f"Connected to a bot: @{data['result']['username']}"
        return False, data.get("description", "Failed to verify the token")
    except Exception as e:
        return False, f"Failed to connect: {e}"


def poll_telegram():
    if _get("notif_telegram_enabled") != "1":
        return []
    token = _get("notif_telegram_token")
    if not token:
        return []

    offset = int(_get("notif_telegram_last_update_id", "0"))
    created = []
    try:
        resp = requests.get(
            f"https://api.telegram.org/bot{token}/getUpdates",
            params={"offset": offset + 1, "timeout": 0},
            timeout=10,
        )
        data = resp.json()
        if not data.get("ok"):
            return []
        updates = data.get("result", [])
        for upd in updates:
            offset = max(offset, upd["update_id"])
            msg = upd.get("message") or upd.get("channel_post")
            if not msg:
                continue
            sender = msg.get("from", {}).get("first_name") or msg.get("chat", {}).get("title") or "Telegram"
            text = msg.get("text") or msg.get("caption") or "[Media]"
            note = _store_notification("telegram", f"{sender}", text)
            created.append(note)
        if updates:
            _set("notif_telegram_last_update_id", offset)
    except requests.exceptions.RequestException:
        pass
    return created


# ------------------------------------------------------------------ Email
def test_email(host, port, user, password, use_ssl=True):
    try:
        imap_cls = imaplib.IMAP4_SSL if use_ssl else imaplib.IMAP4
        conn = imap_cls(host, int(port))
        conn.login(user, password)
        conn.select("INBOX", readonly=True)
        conn.logout()
        return True, "Connected successfully to the mailbox"
    except Exception as e:
        return False, str(e)


def _decode_mime(value):
    if not value:
        return ""
    parts = decode_header(value)
    decoded = ""
    for text, enc in parts:
        if isinstance(text, bytes):
            decoded += text.decode(enc or "utf-8", errors="ignore")
        else:
            decoded += text
    return decoded


def poll_email():
    if _get("notif_email_enabled") != "1":
        return []
    host = _get("notif_email_host")
    port = _get("notif_email_port", "993")
    user = _get("notif_email_user")
    password = _get("notif_email_password")
    use_ssl = _get("notif_email_ssl", "1") == "1"
    if not (host and user and password):
        return []

    created = []
    try:
        imap_cls = imaplib.IMAP4_SSL if use_ssl else imaplib.IMAP4
        conn = imap_cls(host, int(port))
        conn.login(user, password)
        conn.select("INBOX")

        last_uid = int(_get("notif_email_last_uid", "0"))
        typ, data = conn.uid("search", None, f"UID {last_uid + 1}:*")
        if typ != "OK":
            conn.logout()
            return []

        uids = [int(u) for u in data[0].split()] if data[0] else []
        uids = [u for u in uids if u > last_uid]
        max_uid = last_uid

        for uid in uids[-20:]:
            typ, msg_data = conn.uid("fetch", str(uid), "(RFC822.HEADER)")
            if typ != "OK" or not msg_data or not msg_data[0]:
                continue
            msg = email.message_from_bytes(msg_data[0][1])
            subject = _decode_mime(msg.get("Subject", "(Untitled)"))
            sender = _decode_mime(msg.get("From", "unknown"))
            note = _store_notification("email", subject, f"From: {sender}")
            created.append(note)
            max_uid = max(max_uid, uid)

        conn.logout()
        if max_uid > last_uid:
            _set("notif_email_last_uid", max_uid)
    except Exception:
        pass
    return created


# ---------------------------------------------------------------- YouTube
YT_FEED_URL = "https://www.youtube.com/feeds/videos.xml"
YT_NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015"}


def test_youtube(channel_id):
    try:
        resp = requests.get(YT_FEED_URL, params={"channel_id": channel_id}, timeout=8)
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        title_el = root.find("a:title", YT_NS)
        channel_name = title_el.text if title_el is not None else channel_id
        return True, f"Channel: {channel_name}"
    except Exception as e:
        return False, str(e)


def poll_youtube():
    if _get("notif_youtube_enabled") != "1":
        return []
    channels_raw = _get("notif_youtube_channels", "")
    channel_ids = [c.strip() for c in channels_raw.split(",") if c.strip()]
    if not channel_ids:
        return []

    import json
    last_ids = {}
    try:
        last_ids = json.loads(_get("notif_youtube_last_ids", "{}"))
    except ValueError:
        last_ids = {}

    created = []
    for cid in channel_ids:
        try:
            resp = requests.get(YT_FEED_URL, params={"channel_id": cid}, timeout=8)
            resp.raise_for_status()
            root = ET.fromstring(resp.content)
            channel_title_el = root.find("a:title", YT_NS)
            channel_title = channel_title_el.text if channel_title_el is not None else cid
            entries = root.findall("a:entry", YT_NS)
            if not entries:
                continue
            latest = entries[0]
            video_id_el = latest.find("yt:videoId", YT_NS)
            video_title_el = latest.find("a:title", YT_NS)
            video_id = video_id_el.text if video_id_el is not None else None
            video_title = video_title_el.text if video_title_el is not None else "new video"

            if video_id and last_ids.get(cid) != video_id:
                note = _store_notification("youtube", f"{channel_title}", video_title)
                created.append(note)
                last_ids[cid] = video_id
        except Exception:
            continue

    _set("notif_youtube_last_ids", json.dumps(last_ids))
    return created


def poll_all():
    results = []
    for fn in (poll_telegram, poll_email, poll_youtube):
        try:
            results.extend(fn())
        except Exception:
            continue
    return results
