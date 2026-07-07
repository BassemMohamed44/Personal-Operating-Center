const POC_SOCKET = io();

POC_SOCKET.on("connect", () => {
  const dot = document.getElementById("connStatus");
  if (dot) { dot.classList.remove("offline"); dot.classList.add("online"); }
});

POC_SOCKET.on("disconnect", () => {
  const dot = document.getElementById("connStatus");
  if (dot) { dot.classList.remove("online"); dot.classList.add("offline"); }
});

POC_SOCKET.on("clock_tick", (data) => {
  const mini = document.getElementById("miniClock");
  if (mini) mini.textContent = data.time;

  const clockTime = document.getElementById("clockTime");
  if (clockTime) clockTime.textContent = data.time;
  const clockWeekday = document.getElementById("clockWeekday");
  if (clockWeekday) clockWeekday.textContent = data.weekday;
  const dateFull = document.getElementById("dateFull");
  if (dateFull) dateFull.textContent = data.date;
});

POC_SOCKET.on("system_stats", (stats) => {
  const cpuBar = document.getElementById("cpuBar");
  const ramBar = document.getElementById("ramBar");
  const diskBar = document.getElementById("diskBar");
  if (cpuBar) {
    cpuBar.style.width = stats.cpu_percent + "%";
    document.getElementById("cpuVal").textContent = stats.cpu_percent + "%";
  }
  if (ramBar) {
    ramBar.style.width = stats.ram_percent + "%";
    document.getElementById("ramVal").textContent = stats.ram_percent + "%";
  }
  if (diskBar) {
    diskBar.style.width = stats.disk_percent + "%";
    document.getElementById("diskVal").textContent = stats.disk_percent + "%";
  }
  const uptimeVal = document.getElementById("uptimeVal");
  if (uptimeVal) uptimeVal.textContent = formatUptime(stats.uptime_seconds);
});

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}
