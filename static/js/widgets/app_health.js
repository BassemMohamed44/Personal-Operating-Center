(function () {
  let intervalId = null;

  function watchdogBase() {
    return `http://${window.location.hostname}:5001`;
  }

  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  }

  const REASON_LABELS = {
    "process exited unexpectedly": "Application crashed",
    "health check failed repeatedly (app appears frozen)": "Application frozen",
    "manual remote restart": "Manual restart",
  };

  async function loadStatus() {
    const hint = document.getElementById("watchdogOfflineHint");
    const stats = document.getElementById("appHealthStats");
    try {
      const res = await fetch(`${watchdogBase()}/status`);
      const json = await res.json();
      const data = json.data;
      hint.classList.add("hidden");
      stats.style.opacity = "1";
      document.getElementById("appHealthState").textContent = data.app_alive ? "Running" : "Stopped";
      document.getElementById("appHealthUptime").textContent = formatUptime(data.uptime_seconds);
      document.getElementById("appHealthRestarts").textContent = data.restart_count;
      document.getElementById("appHealthLastReason").textContent =
        REASON_LABELS[data.last_restart_reason] || data.last_restart_reason || "—";
    } catch (e) {
      hint.classList.remove("hidden");
      stats.style.opacity = "0.4";
    }
  }

  function softRestart() {
    PinGate.withPin(async (pin) => {
      try {
        await apiFetch("/api/system/restart-app", { method: "POST", headers: { "X-Control-Pin": pin } });
        showToast("Restarting application in a second...", "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  function forceRestart() {
    if (!confirm("Are you sure you want to force restart the application?")) return;
    PinGate.withPin(async (pin) => {
      try {
        const res = await fetch(`${watchdogBase()}/restart`, {
          method: "POST",
          headers: { "X-Control-Pin": pin },
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        showToast(json.data.message, "success");
      } catch (e) {
        showToast("Failed to reach Watchdog: " + e.message, "error");
      }
    });
  }

  function bind() {
    const refreshBtn = document.getElementById("appHealthRefreshBtn");
    const softBtn = document.getElementById("appSoftRestartBtn");
    const forceBtn = document.getElementById("appForceRestartBtn");
    if (refreshBtn) refreshBtn.onclick = loadStatus;
    if (softBtn) softBtn.onclick = softRestart;
    if (forceBtn) forceBtn.onclick = forceRestart;
  }

  window.addEventListener("widgets:rendered", () => {
    const widget = document.querySelector('[data-widget="app_health"]');
    if (!widget) return;
    bind();
    loadStatus();
    clearInterval(intervalId);
    intervalId = setInterval(loadStatus, 10000);
  });
})();
