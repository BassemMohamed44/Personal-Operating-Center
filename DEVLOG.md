# Development Log

> Detailed technical notes during the project construction in stages. For quick instructions check [README.md](README.md).

# Personal Operating Center (POC) — Phase 1

## Installation (once only)
```
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```
Open: `http://<local-ip-of-pc>:5000` on the tablet browser (you must be on the same Wi-Fi network).

## Two ways to run

### 1) Normal run (for development)
```
python app.py
```
If the app hangs or crashes, you must go to the laptop to run it manually.

### 2) Run with Watchdog (recommended - preferably running even if you are far away)
```
python watchdog.py
```
Instead of running app.py directly, run watchdog.py. It will run app.py from inside and monitor it:
- If the app suddenly crashes → it will restart it automatically within seconds.
- If the app hangs/freezes (not responding to anything) → after 3 failed check attempts (~45 seconds) it will kill it and run a new copy.
- It runs on a separate port (5001) dedicated to control, so even if the app itself is completely frozen, you can still send it a "force recovery" command from the dashboard (widget "App Health") and it will respond because it is a completely independent process from the application.

**To keep it running even after restarting the device or if it has any problems:**
1. Run `scripts/install_autostart.bat` (registers Watchdog to start automatically when you log in to Windows)
2. Open Task Scheduler manually and find the "POC_Watchdog" task, then in the Settings tab enable:
   "Restart the task every: 1 minute" and "Attempt to restart up to: 999 times"
   (This ensures that even if the Watchdog itself is closed for any reason, Windows will restart it).
3. To disable automatic startup whenever you want: `scripts/uninstall_autostart.bat`

## Remote control of the application (widget "App Health")
- **Normal restart**: restarts the same process without needing Watchdog (works even if you run app.py directly).
- **Force recovery (Watchdog)**: kills the process by force and starts a new copy, which is the solution when the application is completely frozen and not responding to anything. You must have run `watchdog.py` not `app.py` for this button to work.

## Important security note
- The Watchdog port (5001) needs to be opened in the Windows firewall just like port 5000, and it is protected by the same CONTROL_PIN.

## Important before use
- Change `CONTROL_PIN` in `config.py` (or via environment variable `POC_CONTROL_PIN`) — this is the secret code
  required for any dangerous command: Shutdown / Restart / Kill Process / Run Command.
- Do not expose this server to the public internet (Port Forwarding) without an additional layer of protection
  (VPN or Reverse Proxy with real Auth) because it gives full control over your device.
- Screenshot requires an additional library: `pip install Pillow`.

## What was built (Phase 1 — fully functional and tested)
- Professional project structure: routes / services / models / widgets / sockets / static / templates
- Full SQLite: Tasks, Notes, Settings, WidgetPositions, Notifications(schema), Logs, Projects
- Live WebSocket: Clock + CPU/RAM/Disk every second without Refresh
- 7 themes + light mode: Dark, AMOLED, Hacker, Cyberpunk, Nature, Ocean, Sunset, Light
  (automatically saved in the database)
- Widget System: Drag & Drop for reordering + show/hide + automatic position saving
- Ready Widgets: Clock, Date, System Monitor, Processes(+Kill), Tasks, Notes,
  Project Manager (Run/Stop/Restart/Open Folder/Open VS Code/Logs/Status), Windows Control
- Windows Control: Shutdown / Restart / Sleep / Lock / Screenshot / Cancel-shutdown — protected by PIN
- Basic remote command runner: `POST /api/system/run-command` (protected by PIN) — the core of the Terminal
- Settings page: Theme, Language, Animations, Refresh rate, Widget visibility, Export/Import JSON
- **Notification Center**: Telegram (Bot API) + Email (IMAP) + YouTube (RSS, without API Key)
  updated automatically every 45 seconds in the background + instant push via WebSocket, with connection test for each source.
- **File Manager**: full browsing of any drive, create folder, upload/download, rename, delete,
  preview images, open path in File Explorer — all dangerous operations (delete/rename/upload/open) protected by PIN.

## File Manager Security Note
- It starts from the user directory (`~`) by default. Change `FILE_MANAGER_ROOT` in `config.py`
  if you want it to start from another location, or use the list of drives (C:\, D:\...) from the dropdown menu.
- Like other system commands, delete/upload/rename require the same CONTROL_PIN.

## Important Notification Security Note
- Email credentials (Email/App Password) are stored as plain text in the local SQLite database.
  This is acceptable for your personal device, but if you move the database or copy it elsewhere, be careful with this file.
- Gmail and others require an "App Password" not the regular password (enable 2FA and create an App Password from account settings).
- Telegram: create a new bot via @BotFather in Telegram, and put the token in the notification settings.
- YouTube: you need the Channel ID (not the channel name) - you can get it from the channel page > About > Share Channel.

## Remaining parts of the original request (still need to be built)
- Remote Terminal with interactive interface (streaming via WebSocket instead of REST)
- Automation buttons (run custom scripts: Backup, Clean Temp...)
- Volume/Brightness/Clipboard control (requires special Windows libraries: pycaw, screen_brightness_control)

## New files in this batch
- `watchdog.py` — run it instead of app.py for monitoring and automatic recovery
- `scripts/install_autostart.bat` and `scripts/uninstall_autostart.bat`
- New widget: "App Health / Watchdog"

## How to add a new widget (actual steps)
1. Add a line in `widgets/registry.py`
2. Create `templates/widgets/<id>.html`
3. Add `<template id="tpl-<id>">{% include "widgets/<id>.html" %}</template>` in `index.html`
4. (optional) Create `static/js/widgets/<id>.js` for widget logic
