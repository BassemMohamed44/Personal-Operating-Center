(function () {
  async function loadTasks() {
    const list = document.getElementById("taskList");
    if (!list) return;
    try {
      const tasks = await apiFetch("/api/tasks");
      list.innerHTML = tasks.map(t => `
        <li class="task-item ${t.done ? "done" : ""}" data-id="${t.id}">
          <input type="checkbox" ${t.done ? "checked" : ""} class="task-check">
          <span>${escapeHtml(t.title)}</span>
          <button class="task-del"><i data-feather="trash-2"></i></button>
        </li>`).join("");

      list.querySelectorAll(".task-check").forEach(cb => {
        cb.addEventListener("change", (e) => toggleTask(e.target.closest(".task-item").dataset.id, e.target.checked));
      });
      list.querySelectorAll(".task-del").forEach(btn => {
        btn.addEventListener("click", (e) => deleteTask(e.target.closest(".task-item").dataset.id));
      });
      if (window.feather) feather.replace();
    } catch (e) { /* ignore */ }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function addTask() {
    const input = document.getElementById("newTaskInput");
    const title = input.value.trim();
    if (!title) return;
    await apiFetch("/api/tasks", { method: "POST", body: JSON.stringify({ title }) });
    input.value = "";
    loadTasks();
  }

  async function toggleTask(id, done) {
    await apiFetch(`/api/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ done }) });
    loadTasks();
  }

  async function deleteTask(id) {
    await apiFetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadTasks();
  }

  window.addEventListener("widgets:rendered", () => {
    loadTasks();
    const btn = document.getElementById("addTaskBtn");
    const input = document.getElementById("newTaskInput");
    if (btn) btn.onclick = addTask;
    if (input) input.onkeydown = (e) => { if (e.key === "Enter") addTask(); };
  });
})();
