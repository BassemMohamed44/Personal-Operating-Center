(function () {
  let timerId = null;

  async function loadCountdowns() {
    const list = document.getElementById("countdownList");
    if (!list) return;
    try {
      const items = await apiFetch("/api/countdown");
      list.innerHTML = items.map(item => `
        <div class="countdown-item" data-target="${item.target_datetime}" data-id="${item.id}">
          <div class="countdown-title">${escapeHtml(item.title)}</div>
          <div class="countdown-remaining">--</div>
          <button class="icon-btn del-countdown"><i data-feather="trash-2"></i></button>
        </div>`).join("");
      list.querySelectorAll(".del-countdown").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.target.closest(".countdown-item").dataset.id;
          await apiFetch(`/api/countdown/${id}`, { method: "DELETE" });
          loadCountdowns();
        });
      });
      if (window.feather) feather.replace();
      tickAll();
    } catch (e) { /* ignore */ }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function tickAll() {
    document.querySelectorAll(".countdown-item").forEach(item => {
      const target = new Date(item.dataset.target).getTime();
      const now = Date.now();
      const diff = target - now;
      const el = item.querySelector(".countdown-remaining");
      if (diff <= 0) { el.textContent = "Time's up"; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent = `${d}d ${h}h ${m}m ${s}s`;
    });
  }

  async function addCountdown() {
    const title = document.getElementById("countdownTitleInput").value.trim();
    const dateVal = document.getElementById("countdownDateInput").value;
    if (!title || !dateVal) { showToast("Enter title and date", "error"); return; }
    await apiFetch("/api/countdown", {
      method: "POST",
      body: JSON.stringify({ title, target_datetime: dateVal }),
    });
    document.getElementById("countdownTitleInput").value = "";
    document.getElementById("countdownDateInput").value = "";
    loadCountdowns();
  }

  window.addEventListener("widgets:rendered", () => {
    loadCountdowns();
    const btn = document.getElementById("countdownAddBtn");
    if (btn) btn.onclick = addCountdown;
    clearInterval(timerId);
    timerId = setInterval(tickAll, 1000);
  });
})();
