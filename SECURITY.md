# Security Policy

## Read this first

This project gives **full** control over the device it runs on:
- Run any Shell/CMD/PowerShell command (`/api/system/run-command`)
- Shutdown / Restart / Sleep / Lock device
- Read/write/delete any file the user running Python can access (File Manager)
- Take screenshots
- Restart itself remotely (Watchdog on a separate port)

**This means: anyone who reaches this server address on the network = has full control over your device.**
The project is built to be a "personal control center" on your home network (LAN) only, not a service exposed to the internet.

---

## Basic rules (must follow)

### 1. Don't expose the server to the public internet
- **Don't do Port Forwarding** for port 5000 or 5001 on your router.
- If you need to access it from outside the home, use a **VPN** (like WireGuard or Tailscale) instead of opening the port to the whole world.
  Tailscale is particularly easy and will let you access the server as if it were on the same network, even from outside, without any router settings.

### 2. Change the default PIN immediately
- Copy `.env.example` to `.env` and set `POC_CONTROL_PIN` to a strong value (not "1234" or sequential numbers).
- Every dangerous operation (delete file, run command, shutdown, etc.) requires this PIN as a header.
- The PIN is sent as plain text in every request — its purpose is to prevent anyone on the same network from accidentally pressing a button or guessing it, **not** to replace network security.

### 3. Email (Notification Center)
- The email password (IMAP) is stored as **plain text** in the local SQLite database (`data/poc.db`).
- Use a dedicated "App Password" (not your main password) — enable two-factor authentication and create an App Password from your account settings (Gmail/Outlook/etc.).
- The `data/poc.db` file is already added to `.gitignore`, but be careful not to upload it by mistake.

### 4. Windows Firewall
- Open port 5000 (and 5001 if using Watchdog) only on "Private" networks, not Public.
- If you have multiple devices on the network that don't need to access it, restrict access by IP if possible.

### 5. HTTPS
- The server runs plain HTTP (no encryption) — suitable for a trusted home network, but if you're already using a VPN like Tailscale, it provides network-level encryption.
- If you want full HTTPS, you can put a reverse proxy (Caddy/nginx) in front of Flask with a self-signed certificate or use Tailscale/Cloudflare Tunnel.

---

## Known weaknesses (by design, not bugs)

| Feature | Risk | Mitigation |
|---|---|---|
| `run-command` endpoint | Execute any command on the device | Protected by PIN, requires trusted network only |
| File Manager | Read/delete/modify any file | Protected by PIN for dangerous operations, reading is not protected by PIN currently |
| Watchdog control (port 5001) | Remote force recovery | Protected by the same PIN, but it's a separate operation from any deeper auth |
| Email password storage | Plain text in SQLite | Use App Password, not production-grade secrets storage |
| No users/roles system | Anyone with the PIN = full control | Suitable for personal use, not for teams |

---

## Reporting a security vulnerability

This project is personal/hobby, but if you find a vulnerability (like bypassing the PIN, path traversal in File Manager, etc.):
1. **Don't open a public issue** on GitHub if the vulnerability is serious (like remote code execution without a PIN).
2. Send the vulnerability details privately to the repo owner (via GitHub Security Advisories or email if available in the profile).
3. A simple description of how to reproduce the issue is enough.

---

## Checklist before running the server for the first time

- [ ] Copied `.env.example` to `.env` and changed `POC_CONTROL_PIN`
- [ ] Changed `POC_SECRET_KEY` to a random long value
- [ ] Server is running on a home network only (no Port Forwarding)
- [ ] If using Email notifications, using an App Password, not the primary password
- [ ] Opened the port in the firewall on "Private" only
