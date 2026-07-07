# Personal Operating Center (POC) 

A comprehensive personal control center (Dashboard) that runs on your Windows PC using Python/Flask,
accessible from any browser on your network (tablet, mobile, any other device) as a live "control center" with real-time updates.

Built entirely with Python (Flask + WebSocket) without any JavaScript framework — Vanilla JS + SQLite.

> **Read [SECURITY.md](SECURITY.md) before running this project on any network.**
> It gives full control over the device (running commands, files, shutdown) — designed for personal use on a trusted home network only.

---

## Screnshots
- POC_Theme_Ampled <br>
<img src=" Screenshots_From_App/POC_Theme_Ampled.png" alt="POC_Theme_Ampled" >
- POC_Theme_Cyberpunk <br>
<img src=" Screenshots_From_App/POC_Theme_Cyberpunk.png" alt="POC_Theme_Cyberpunk" >
- POC_Theme_DarkBlue <br>
<img src=" Screenshots_From_App/POC_Theme_DarkBlue.png" alt="POC_Theme_DarkBlue" >
- POC_Theme_Hacker <br>
<img src=" Screenshots_From_App/POC_Theme_Hacker.png" alt="POC_Theme_Hacker" >
- POC_Theme_Light <br>
<img src=" Screenshots_From_App/POC_Theme_Light.png" alt="POC_Theme_Light" >
- POC_Theme_Nature <br>
<img src=" Screenshots_From_App/POC_Theme_Nature.png" alt="POC_Theme_Nature" >
- POC_Theme_Ocean <br>
<img src=" Screenshots_From_App/POC_Theme_Ocean.png" alt=" POC_Theme_Ocean" >
- POC_Theme_Sunset <br>
<img src=" Screenshots_From_App/POC_Theme_Sunset.png" alt="POC_Theme_Sunset" >
---

## Features

### Interface
- Modern Glassmorphism design, fully responsive with tablet and mobile
- **7 built-in themes**: Dark, AMOLED, Hacker, Cyberpunk, Nature, Ocean, Sunset + Light mode
- Drag & Drop Widgets system, with automatic position and size saving
- Live updates without refresh via WebSocket

### Widgets available
| Widget | Description |
|---|---|
|  Clock / Date | The Clock and Date |
|  System Monitor | CPU / RAM / Disk usage |
|  Processes | Active processes + ability to terminate them |
|  Tasks | Simple task list |
|  Notes | Quick notes |
|  Project Manager | Launch/Stop/Monitor your Python projects |
|  Windows Control | Shutdown / Restart / Lock / Sleep / Screenshot |
|  Prayer Times | Prayer times (via Aladhan API) |
|  Azkar | Morning/Evening/Sleep Azkar with Tasbih counter |
|  Quotes | Daily quotes |
|  Stopwatch / Countdown | Stopwatch + multiple countdown timers |
|  Calendar | Monthly calendar with events |
|  Notification Center | Live notifications from Telegram / Email (IMAP) / YouTube |
|  File Manager | Browse/upload/download/delete/rename/preview files of any drive |
|  App Health / Watchdog | Application health monitoring + automatic or manual remote recovery |

### Reliability
- **`watchdog.py`**: A separate process that monitors the application and restarts it automatically if it crashes or freezes,
  even if you are not in front of the device. Full details below.
- Automatic registration as a service that starts with Windows (Task Scheduler).

---

## Installation

```bash
git clone <your-repo-url>
cd poc
python -m venv venv
venv\Scripts\activate          # on windows
pip install -r requirements.txt
```

After that, prepare your settings:
```bash
copy .env.example .env         # on windows (or cp on Linux/Mac)
```
Open `.env` and change at least:
- `POC_CONTROL_PIN` — PIN for dangerous operations (must change)
- `POC_SECRET_KEY` — Any random string

---

## Running

### 1) Normal run (for development)
```bash
python app.py
```

### 2) Recommended run (monitoring and automatic recovery)
```bash
python watchdog.py
```
Instead of running `app.py` directly, run `watchdog.py`. It will handle running and monitoring the application:
- If the application crashes unexpectedly → it will be restarted automatically within seconds
- If the application freezes (not responding at all) → after 3 failed health checks, it will be forcefully killed and a new instance will be started
- It provides a separate control port (5001) that you can send a "force recovery" command to, even if the main application is completely frozen

**To make it start automatically with every Windows startup:**
```bash
scripts/install_autostart.bat
```
And then from Task Scheduler, enable "Restart the task every: 1 minute" in the task properties
to make Windows restart it if the Watchdog itself is closed for any reason.

Then open: `http://<local-ip-of-pc>:5000` from any browser on the same network.

---

## Security

Read [SECURITY.md](SECURITY.md) for full details. The most important point:
**Do not forward ports 5000/5001 on the router.** If you want to access from outside the home, use a VPN
(like [Tailscale](https://tailscale.com)) instead of opening the port to the internet.

---

## Project Structure

```
poc/
├── app.py                 # Main Flask entry point
├── watchdog.py             # Standalone monitor (optional but recommended)
├── config.py                # Settings (reads from .env)
├── models/                  # SQLAlchemy models
├── routes/                  # Flask Blueprints (each API in a separate file)
├── services/                 # Business logic (system, files, projects, notifications)
├── sockets/                   # WebSocket events
├── widgets/registry.py         # Widget registry (add new widget from here)
├── templates/                    # Jinja2 (base + pages + widget templates)
├── static/{css,js}/                # The interface (Vanilla JS, no framework)
└── scripts/                          # Windows Task Scheduler scripts
```

To add a new widget, see the instructions at the end of [DEVLOG.md](DEVLOG.md).

---

## Roadmap (still need to build)

- [ ] Interactive Remote Terminal (streaming via WebSocket)
- [ ] Automation buttons (Backup, Clean Temp, etc.)
- [ ] Volume / Brightness / Clipboard control

---

## License

MIT License — see [LICENSE](LICENSE). The project gives full control over the device, so use it at your own risk
on a trusted network only.
