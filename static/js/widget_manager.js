document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("widgetManagerModal");
  const openBtn = document.getElementById("widgetManagerBtn");
  const closeBtn = document.getElementById("closeWidgetManager");
  const list = document.getElementById("widgetManagerList");

  function buildList() {
    const defs = Grid.getWidgetDefs();
    const layout = Grid.getLayout();
    list.innerHTML = "";
    defs.forEach(def => {
      const pos = layout.find(p => p.widget_id === def.id) || { visible: def.default_visible };
      const row = document.createElement("div");
      row.className = "widget-manager-item";
      row.innerHTML = `
        <span>${def.name}</span>
        <label class="switch">
          <input type="checkbox" ${pos.visible ? "checked" : ""} data-id="${def.id}">
          <span class="slider"></span>
        </label>`;
      row.querySelector("input").addEventListener("change", (e) => {
        Grid.setVisibility(def.id, e.target.checked);
      });
      list.appendChild(row);
    });
  }

  if (openBtn) openBtn.addEventListener("click", () => { buildList(); modal.classList.remove("hidden"); });
  if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
});
