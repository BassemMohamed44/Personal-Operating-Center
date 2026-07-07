(function () {
  const SOURCE_ICONS = { telegram: "send", email: "mail", youtube: "youtube", system: "info" };

  function timeAgo(isoString) {
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return "Now";
    if (diff < 3600) return `since ${Math.floor(diff / 60)} minutes`;
    if (diff < 86400) return `since ${Math.floor(diff / 3600)} hours`;
    return `since ${Math.floor(diff / 86400)} days`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function loadNotifications() {
    const list = document.getElementById("notifList");
    if (!list) return;
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      const items = json.data || [];
      const unread = json.unread_count || 0;

      const badge = document.getElementById("notifUnreadBadge");
      if (badge) {
        badge.textContent = unread;
        badge.classList.toggle("hidden", unread === 0);
      }

      if (items.length === 0) {
        list.innerHTML = `<div class="empty-hint">No notifications yet. Click ⚙️ to setup sources.</div>`;
        return;
      }

      list.innerHTML = items.map(n => `
        <div class="notif-item ${n.is_read ? "" : "unread"}" data-id="${n.id}">
          <i data-feather="${SOURCE_ICONS[n.source] || "bell"}" class="notif-icon"></i>
          <div class="notif-content">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-body">${escapeHtml(n.body).slice(0, 120)}</div>
            <div class="notif-time">${timeAgo(n.created_at)}</div>
          </div>
          <button class="icon-btn notif-del" title="Delete"><i data-feather="x"></i></button>
        </div>`).join("");

      list.querySelectorAll(".notif-item").forEach(item => {
        item.addEventListener("click", (e) => {
          if (e.target.closest(".notif-del")) return;
          markRead(item.dataset.id);
        });
        item.querySelector(".notif-del").addEventListener("click", (e) => {
          e.stopPropagation();
          deleteNotification(item.dataset.id);
        });
      });
      if (window.feather) feather.replace();
    } catch (e) { console.error("notifications load failed", e); }
  }

  async function markRead(id) {
    try { await apiFetch(`/api/notifications/${id}/read`, { method: "POST" }); loadNotifications(); } catch (e) {}
  }
  async function deleteNotification(id) {
    try { await apiFetch(`/api/notifications/${id}`, { method: "DELETE" }); loadNotifications(); } catch (e) {}
  }

  // ---------------- Settings modal ----------------
  async function openSettingsModal() {
    const modal = document.getElementById("notifSettingsModal");
    try {
      const settings = await apiFetch("/api/notifications/settings");
      document.getElementById("notifTelegramEnabled").checked = settings.notif_telegram_enabled === "1";
      document.getElementById("notifTelegramToken").value = settings.notif_telegram_token || "";
      document.getElementById("notifEmailEnabled").checked = settings.notif_email_enabled === "1";
      document.getElementById("notifEmailHost").value = settings.notif_email_host || "";
      document.getElementById("notifEmailPort").value = settings.notif_email_port || "993";
      document.getElementById("notifEmailUser").value = settings.notif_email_user || "";
      document.getElementById("notifEmailPassword").value = settings.notif_email_password || "";
      document.getElementById("notifYoutubeEnabled").checked = settings.notif_youtube_enabled === "1";
      document.getElementById("notifYoutubeChannels").value = settings.notif_youtube_channels || "";
    } catch (e) { /* first run, no settings yet */ }
    modal.classList.remove("hidden");
  }

  async function saveSettings() {
    const body = {
      notif_telegram_enabled: document.getElementById("notifTelegramEnabled").checked ? "1" : "0",
      notif_telegram_token: document.getElementById("notifTelegramToken").value.trim(),
      notif_email_enabled: document.getElementById("notifEmailEnabled").checked ? "1" : "0",
      notif_email_host: document.getElementById("notifEmailHost").value.trim(),
      notif_email_port: document.getElementById("notifEmailPort").value.trim(),
      notif_email_user: document.getElementById("notifEmailUser").value.trim(),
      notif_email_password: document.getElementById("notifEmailPassword").value,
      notif_youtube_enabled: document.getElementById("notifYoutubeEnabled").checked ? "1" : "0",
      notif_youtube_channels: document.getElementById("notifYoutubeChannels").value.trim(),
    };
    try {
      await apiFetch("/api/notifications/settings", { method: "POST", body: JSON.stringify(body) });
      showToast("Notification settings saved", "success");
      document.getElementById("notifSettingsModal").classList.add("hidden");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function testTelegram() {
    try {
      const res = await apiFetch("/api/notifications/test/telegram", {
        method: "POST",
        body: JSON.stringify({ token: document.getElementById("notifTelegramToken").value.trim() }),
      });
      showToast(res.message, "success");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function testEmail() {
    try {
      const res = await apiFetch("/api/notifications/test/email", {
        method: "POST",
        body: JSON.stringify({
          host: document.getElementById("notifEmailHost").value.trim(),
          port: document.getElementById("notifEmailPort").value.trim(),
          user: document.getElementById("notifEmailUser").value.trim(),
          password: document.getElementById("notifEmailPassword").value,
        }),
      });
      showToast(res.message, "success");
    } catch (e) { showToast(e.message, "error"); }
  }

  async function testYoutube() {
    try {
      const res = await apiFetch("/api/notifications/test/youtube", {
        method: "POST",
        body: JSON.stringify({ channel_id: document.getElementById("notifYoutubeChannels").value.trim() }),
      });
      showToast(res.message, "success");
    } catch (e) { showToast(e.message, "error"); }
  }

  function bind() {
    const settingsBtn = document.getElementById("notifSettingsBtn");
    const closeBtn = document.getElementById("closeNotifSettings");
    const modal = document.getElementById("notifSettingsModal");
    const refreshBtn = document.getElementById("notifRefreshBtn");
    const markAllBtn = document.getElementById("notifMarkAllBtn");
    const clearBtn = document.getElementById("notifClearBtn");

    if (settingsBtn) settingsBtn.onclick = openSettingsModal;
    if (closeBtn) closeBtn.onclick = () => modal.classList.add("hidden");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
    if (refreshBtn) refreshBtn.onclick = async () => {
      try { await apiFetch("/api/notifications/poll-now", { method: "POST" }); } catch (e) {}
      loadNotifications();
    };
    if (markAllBtn) markAllBtn.onclick = async () => {
      await apiFetch("/api/notifications/read-all", { method: "POST" });
      loadNotifications();
    };
    if (clearBtn) clearBtn.onclick = async () => {
      if (!confirm("Are you sure you want to clear all notifications?")) return;
      await apiFetch("/api/notifications/clear", { method: "POST" });
      loadNotifications();
    };

    const saveBtn = document.getElementById("notifSettingsSaveBtn");
    if (saveBtn) saveBtn.onclick = saveSettings;
    const telTest = document.getElementById("notifTelegramTestBtn");
    if (telTest) telTest.onclick = testTelegram;
    const mailTest = document.getElementById("notifEmailTestBtn");
    if (mailTest) mailTest.onclick = testEmail;
    const ytTest = document.getElementById("notifYoutubeTestBtn");
    if (ytTest) ytTest.onclick = testYoutube;
  }

  if (typeof POC_SOCKET !== "undefined") {
    POC_SOCKET.on("new_notification", () => loadNotifications());
  }

  window.addEventListener("widgets:rendered", () => {
    const widget = document.querySelector('[data-widget="notifications"]');
    if (!widget) return;
    loadNotifications();
    bind();
  });
})();
