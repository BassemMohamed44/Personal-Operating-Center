(function () {
  let startTime = 0;
  let elapsed = 0;
  let running = false;
  let intervalId = null;
  let laps = [];

  function format(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}.${tenths}`;
  }

  function tick() {
    const display = document.getElementById("stopwatchDisplay");
    if (display) display.textContent = format(elapsed + (Date.now() - startTime));
  }

  function start() {
    if (running) return;
    running = true;
    startTime = Date.now();
    intervalId = setInterval(tick, 100);
    setBtnLabel();
  }

  function pause() {
    running = false;
    elapsed += Date.now() - startTime;
    clearInterval(intervalId);
    setBtnLabel();
  }

  function reset() {
    running = false;
    clearInterval(intervalId);
    elapsed = 0;
    laps = [];
    renderLaps();
    const display = document.getElementById("stopwatchDisplay");
    if (display) display.textContent = format(0);
    setBtnLabel();
  }

  function lap() {
    const current = elapsed + (running ? Date.now() - startTime : 0);
    laps.unshift(current);
    renderLaps();
  }

  function renderLaps() {
    const list = document.getElementById("stopwatchLaps");
    if (!list) return;
    list.innerHTML = laps.map((l, idx) => `<li>roll ${laps.length - idx}: ${format(l)}</li>`).join("");
  }

  function setBtnLabel() {
    const btn = document.getElementById("stopwatchStartBtn");
    if (btn) btn.textContent = running ? "Stop" : "Start";
  }

  function bind() {
    const startBtn = document.getElementById("stopwatchStartBtn");
    const lapBtn = document.getElementById("stopwatchLapBtn");
    const resetBtn = document.getElementById("stopwatchResetBtn");
    if (startBtn) startBtn.onclick = () => (running ? pause() : start());
    if (lapBtn) lapBtn.onclick = lap;
    if (resetBtn) resetBtn.onclick = reset;

    const display = document.getElementById("stopwatchDisplay");
    if (display) display.textContent = format(elapsed);
    if (running) intervalId = setInterval(tick, 100);
    setBtnLabel();
    renderLaps();
  }

  window.addEventListener("widgets:rendered", bind);
})();
