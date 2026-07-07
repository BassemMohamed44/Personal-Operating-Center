document.addEventListener("DOMContentLoaded", async () => {
  const langSelect = document.getElementById("languageSelect");
  const animToggle = document.getElementById("animationsToggle");
  const refreshInput = document.getElementById("refreshRateInput");
  const saveBtn = document.getElementById("saveSettingsBtn");
  const exportBtn = document.getElementById("exportSettingsBtn");
  const importBtn = document.getElementById("importSettingsBtn");
  const importFile = document.getElementById("importFileInput");
  const visibilityList = document.getElementById("settingsWidgetVisibility");

  try {
    const settings = await apiFetch("/api/settings");
    if (langSelect) langSelect.value = settings.language || "ar";
    if (animToggle) animToggle.checked = settings.animations !== "off";
    if (refreshInput) refreshInput.value = settings.refresh_rate_ms || 2000;
  } catch (e) { /* ignore */ }


  try {
    const defs = await apiFetch("/api/widgets/available");
    const layout = await apiFetch("/api/widgets/layout");
    visibilityList.innerHTML = defs.map(def => {
      const pos = layout.find(p => p.widget_id === def.id) || { visible: def.default_visible };
      return `
        <div class="widget-manager-item">
          <span>${def.name}</span>
          <label class="switch">
            <input type="checkbox" ${pos.visible ? "checked" : ""} data-id="${def.id}">
            <span class="slider"></span>
          </label>
        </div>`;
    }).join("");
    visibilityList.querySelectorAll("input").forEach(input => {
      input.addEventListener("change", async (e) => {
        await apiFetch(`/api/widgets/${e.target.dataset.id}/visibility`, {
          method: "POST",
          body: JSON.stringify({ visible: e.target.checked }),
        });
      });
    });
  } catch (e) { /* ignore */ }

  if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
      try {
        await apiFetch("/api/settings", {
          method: "POST",
          body: JSON.stringify({
            language: langSelect.value,
            animations: animToggle.checked ? "on" : "off",
            refresh_rate_ms: refreshInput.value,
          }),
        });
        showToast("تم حفظ الإعدادات", "success");
      } catch (e) {
        showToast(e.message, "error");
      }
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const data = await apiFetch("/api/settings/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "poc_settings_backup.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  if (importBtn) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", async () => {
      const file = importFile.files[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        await apiFetch("/api/settings/import", { method: "POST", body: JSON.stringify(data) });
        showToast("Settings imported, reload the page", "success");
      } catch (e) {
        showToast("Invalid file", "error");
      }
    });
  }
});
