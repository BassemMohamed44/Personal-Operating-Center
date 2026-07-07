(function () {
  const CONFIRM_MESSAGES = {
    shutdown: "Are you sure you want to shut down the device?",
    restart: "Are you sure you want to restart the device?",
  };

  function bind() {
    document.querySelectorAll('[data-widget="windows_control"] [data-action]').forEach(btn => {
      btn.onclick = () => handleAction(btn.dataset.action);
    });
  }

  function handleAction(action) {
    if (CONFIRM_MESSAGES[action] && !confirm(CONFIRM_MESSAGES[action])) return;

    PinGate.withPin(async (pin) => {
      const res = await apiFetch(`/api/system/${action}`, {
        method: "POST",
        headers: { "X-Control-Pin": pin },
        body: JSON.stringify({ delay: 5 }),
      });
      showToast(res.message || "Implemented", "success");
    });
  }

  window.addEventListener("widgets:rendered", bind);
})();
