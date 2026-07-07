(function () {
  async function loadProcesses() {
    const tbody = document.getElementById("processTableBody");
    if (!tbody) return;
    try {
      const procs = await apiFetch("/api/system/processes?limit=8");
      tbody.innerHTML = procs.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.pid}</td>
          <td>${p.cpu_percent}%</td>
          <td><button class="icon-btn kill-btn" data-pid="${p.pid}" title="Kill"><i data-feather="x"></i></button></td>
        </tr>
      `).join("");
      tbody.querySelectorAll(".kill-btn").forEach(btn => {
        btn.addEventListener("click", () => killProcess(btn.dataset.pid));
      });
      if (window.feather) feather.replace();
    } catch (e) { /* widget not on screen or server not ready yet */ }
  }

  function killProcess(pid) {
    PinGate.withPin(async (pin) => {
      await apiFetch(`/api/system/processes/${pid}/kill`, {
        method: "POST",
        headers: { "X-Control-Pin": pin },
      });
      showToast(`Process ${pid} killed`, "success");
      loadProcesses();
    });
  }

  window.addEventListener("widgets:rendered", loadProcesses);
  setInterval(loadProcesses, 5000);
})();
