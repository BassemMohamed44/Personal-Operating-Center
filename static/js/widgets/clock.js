(function () {
  function tick() {
    const now = new Date();
    const timeEl = document.getElementById("clockTime");
    const weekdayEl = document.getElementById("clockWeekday");
    const dateEl = document.getElementById("dateFull");
    if (timeEl && timeEl.textContent === "--:--:--") {
      timeEl.textContent = now.toTimeString().slice(0, 8);
    }
    if (weekdayEl && weekdayEl.textContent === "--") {
      weekdayEl.textContent = now.toLocaleDateString("en-US", { weekday: "long" });
    }
    if (dateEl && dateEl.textContent === "----/--/--") {
      dateEl.textContent = now.toISOString().slice(0, 10);
    }
  }
  window.addEventListener("widgets:rendered", tick);
})();
