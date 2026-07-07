(function () {
  let viewDate = new Date();
  let selectedDate = null;
  let monthEvents = [];

  const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function pad(n) { return String(n).padStart(2, "0"); }
  function toKey(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

  async function loadMonth() {
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const monthKey = `${y}-${pad(m + 1)}`;
    document.getElementById("calMonthLabel").textContent = `${MONTH_NAMES[m]} ${y}`;
    try {
      monthEvents = await apiFetch(`/api/calendar/events?month=${monthKey}`);
    } catch (e) {
      monthEvents = [];
    }
    renderGrid();
  }

  function renderGrid() {
    const grid = document.getElementById("calGrid");
    if (!grid) return;
    const y = viewDate.getFullYear();
    const m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const todayKey = toKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    let html = DAY_NAMES.map(d => `<div class="cal-dayname">${d}</div>`).join("");
    for (let i = 0; i < firstDay; i++) html += `<div class="cal-cell empty"></div>`;

    for (let day = 1; day <= daysInMonth; day++) {
      const key = toKey(y, m, day);
      const hasEvent = monthEvents.some(e => e.event_date === key);
      const isToday = key === todayKey;
      const isSelected = key === selectedDate;
      html += `<div class="cal-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}" data-date="${key}">
        <span>${day}</span>${hasEvent ? '<div class="cal-dot"></div>' : ""}
      </div>`;
    }
    grid.innerHTML = html;

    grid.querySelectorAll(".cal-cell:not(.empty)").forEach(cell => {
      cell.addEventListener("click", () => {
        selectedDate = cell.dataset.date;
        document.getElementById("calEventDate").value = selectedDate;
        renderGrid();
        renderDayEvents();
      });
    });
    renderDayEvents();
  }

  function renderDayEvents() {
    const container = document.getElementById("calEventsForDay");
    if (!container) return;
    if (!selectedDate) { container.innerHTML = ""; return; }
    const events = monthEvents.filter(e => e.event_date === selectedDate);
    if (events.length === 0) {
      container.innerHTML = `<div class="empty-hint">No events on ${selectedDate}</div>`;
      return;
    }
    container.innerHTML = events.map(e => `
      <div class="cal-event-row">
        <span>${e.event_time ? e.event_time + " — " : ""}${escapeHtml(e.title)}</span>
        <button class="icon-btn del-event" data-id="${e.id}"><i data-feather="trash-2"></i></button>
      </div>`).join("");
    container.querySelectorAll(".del-event").forEach(btn => {
      btn.addEventListener("click", async () => {
        await apiFetch(`/api/calendar/events/${btn.dataset.id}`, { method: "DELETE" });
        loadMonth();
      });
    });
    if (window.feather) feather.replace();
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function addEvent() {
    const title = document.getElementById("calEventTitle").value.trim();
    const date = document.getElementById("calEventDate").value || selectedDate;
    const time = document.getElementById("calEventTime").value;
    if (!title || !date) { showToast("Enter title and date", "error"); return; }
    await apiFetch("/api/calendar/events", {
      method: "POST",
      body: JSON.stringify({ title, event_date: date, event_time: time || null }),
    });
    document.getElementById("calEventTitle").value = "";
    document.getElementById("calEventTime").value = "";
    selectedDate = date;
    loadMonth();
  }

  function bindNav() {
    document.getElementById("calPrevBtn").onclick = () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      loadMonth();
    };
    document.getElementById("calNextBtn").onclick = () => {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      loadMonth();
    };
    document.getElementById("calAddEventBtn").onclick = addEvent;
  }

  window.addEventListener("widgets:rendered", () => {
    const widget = document.querySelector('[data-widget="calendar"]');
    if (!widget) return;
    bindNav();
    loadMonth();
  });
})();
