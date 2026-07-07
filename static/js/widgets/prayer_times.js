(function () {
  const PRAYER_LABELS = {
    Fajr: "Fajr", Sunrise: "Sunrise", Dhuhr: "Dhuhr",
    Asr: "Asr", Maghrib: "Maghrib", Isha: "Isha",
  };

  async function loadPrayerTimes() {
    const list = document.getElementById("prayerList");
    if (!list) return;
    try {
      const data = await apiFetch("/api/prayer/times");
      document.getElementById("prayerCityLabel").textContent = `${data.city}, ${data.country}`;
      list.innerHTML = Object.entries(data.timings).map(([key, time]) => `
        <div class="prayer-row">
          <span>${PRAYER_LABELS[key] || key}</span>
          <span class="prayer-time">${time}</span>
        </div>`).join("");
      highlightNext(data.timings);
    } catch (e) {
      list.innerHTML = `<div class="empty-hint">${e.message}</div>`;
    }
  }

  function highlightNext(timings) {
    const hint = document.getElementById("prayerNextHint");
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    let next = null;
    for (const [key, time] of Object.entries(timings)) {
      const [h, m] = time.split(":").map(Number);
      const minutes = h * 60 + m;
      if (minutes > nowMinutes) { next = { key, time }; break; }
    }
    hint.textContent = next
      ? `Coming: ${PRAYER_LABELS[next.key] || next.key} hour ${next.time}`
      : "End of today's prayers";
  }

  function bindCityModal() {
    const openBtn = document.getElementById("prayerSettingsBtn");
    const modal = document.getElementById("prayerCityModal");
    const cancelBtn = document.getElementById("prayerCityCancel");
    const saveBtn = document.getElementById("prayerCitySave");
    if (!openBtn || openBtn.dataset.bound) return;
    openBtn.dataset.bound = "1";

    openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
    saveBtn.addEventListener("click", async () => {
      const city = document.getElementById("prayerCityInput").value.trim();
      const country = document.getElementById("prayerCountryInput").value.trim();
      if (!city || !country) { showToast("Enter the city and country", "error"); return; }
      await apiFetch("/api/prayer/settings", { method: "POST", body: JSON.stringify({ city, country }) });
      modal.classList.add("hidden");
      loadPrayerTimes();
      showToast("City updated successfully", "success");
    });
  }

  window.addEventListener("widgets:rendered", () => {
    loadPrayerTimes();
    bindCityModal();
  });
  setInterval(loadPrayerTimes, 10 * 60 * 1000);
})();
