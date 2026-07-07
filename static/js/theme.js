const ThemeSystem = (() => {
  const STORAGE_FALLBACK_KEY = "poc_theme";

  let currentTheme = "dark";

  function apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    currentTheme = theme;
    document.querySelectorAll(".theme-swatch").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });
    const icon = document.getElementById("themeToggleBtn");
    if (icon) {
      icon.innerHTML = theme === "light"
        ? '<i data-feather="sun"></i>'
        : '<i data-feather="moon"></i>';
      if (window.feather) feather.replace();
    }
  }

  async function init() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      apply((json.data && json.data.theme) || "dark");
    } catch (e) {
      apply("dark");
    }
  }

  async function setTheme(theme) {
    apply(theme);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
    } catch (e) { /* ignore network errors, theme still applied locally */ }
  }

  function toggleQuick() {
    const next = currentTheme === "light" ? "dark" : "light";
    setTheme(next);
  }

  return { init, apply, setTheme, toggleQuick, get current() { return currentTheme; } };
})();

document.addEventListener("DOMContentLoaded", () => {
  ThemeSystem.init();
  const btn = document.getElementById("themeToggleBtn");
  if (btn) btn.addEventListener("click", () => ThemeSystem.toggleQuick());

  document.querySelectorAll(".theme-swatch").forEach(swatch => {
    swatch.addEventListener("click", () => ThemeSystem.setTheme(swatch.dataset.theme));
  });
});
