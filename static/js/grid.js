const Grid = (() => {
  const grid = document.getElementById("grid");
  let editMode = false;
  let layout = [];
  let widgetDefs = [];

  async function init() {
    try {
      widgetDefs = await apiFetch("/api/widgets/available");
      layout = await apiFetch("/api/widgets/layout");
    } catch (e) {
      console.error("Grid init failed:", e);
      showToast("Failed to load widgets: " + e.message, "error");
      widgetDefs = widgetDefs || [];
      layout = layout || [];
    }
    render();

    const editBtn = document.getElementById("editLayoutBtn");
    if (editBtn) editBtn.addEventListener("click", toggleEditMode);
  }

  function toggleEditMode() {
    editMode = !editMode;
    grid.classList.toggle("edit-mode", editMode);
    document.getElementById("editLayoutBtn").innerHTML = editMode
      ? '<i data-feather="check"></i> Save Layout'
      : '<i data-feather="move"></i> Rearrange Widgets';
    if (window.feather) feather.replace();
    if (!editMode) saveLayout();
  }

  function render() {
    grid.innerHTML = "";
    const sorted = [...layout].sort((a, b) => a.order_index - b.order_index);
    sorted.forEach(pos => {
      try {
        if (!pos.visible) return;
        const tpl = document.getElementById(`tpl-${pos.widget_id}`);
        if (!tpl) { console.warn("No template found for widget:", pos.widget_id); return; }
        const node = tpl.content.cloneNode(true);
        const card = node.querySelector(".widget-card");
        if (!card) { console.warn("Template has no .widget-card root:", pos.widget_id); return; }
        card.style.gridColumn = `span ${pos.w}`;
        card.style.gridRow = `span ${pos.h}`;
        card.draggable = true;
        card.dataset.widgetId = pos.widget_id;

        card.addEventListener("dragstart", onDragStart);
        card.addEventListener("dragover", onDragOver);
        card.addEventListener("drop", onDrop);
        card.addEventListener("dragend", onDragEnd);

        grid.appendChild(card);
      } catch (e) {
        console.error(`Failed to render widget "${pos.widget_id}":`, e);
      }
    });
    if (window.feather) feather.replace();
    window.dispatchEvent(new CustomEvent("widgets:rendered"));
  }

  let draggedEl = null;

  function onDragStart(e) {
    if (!editMode) { e.preventDefault(); return; }
    draggedEl = e.currentTarget;
    draggedEl.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e) {
    if (!editMode) return;
    e.preventDefault();
    const target = e.currentTarget;
    if (target === draggedEl) return;
    const rect = target.getBoundingClientRect();
    const before = (e.clientX - rect.left) < rect.width / 2;
    target.parentNode.insertBefore(draggedEl, before ? target : target.nextSibling);
  }

  function onDrop(e) { e.preventDefault(); }

  function onDragEnd(e) {
    draggedEl.classList.remove("dragging");
    draggedEl = null;
    syncOrderFromDom();
  }

  function syncOrderFromDom() {
    const cards = [...grid.querySelectorAll(".widget-card")];
    cards.forEach((card, idx) => {
      const pos = layout.find(p => p.widget_id === card.dataset.widgetId);
      if (pos) pos.order_index = idx;
    });
  }

  async function saveLayout() {
    try {
      await apiFetch("/api/widgets/layout", {
        method: "POST",
        body: JSON.stringify(layout),
      });
      showToast("Layout saved", "success");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function setVisibility(widgetId, visible) {
    const pos = layout.find(p => p.widget_id === widgetId);
    if (pos) pos.visible = visible;
    try {
      await apiFetch(`/api/widgets/${widgetId}/visibility`, {
        method: "POST",
        body: JSON.stringify({ visible }),
      });
      render();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  function getLayout() { return layout; }
  function getWidgetDefs() { return widgetDefs; }

  return { init, toggleEditMode, setVisibility, getLayout, getWidgetDefs, render };
})();

document.addEventListener("DOMContentLoaded", () => Grid.init());
