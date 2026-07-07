(function () {
  async function loadProjects() {
    const list = document.getElementById("projectList");
    if (!list) return;
    try {
      const projects = await apiFetch("/api/projects");
      list.innerHTML = projects.map(p => `
        <div class="project-item" data-id="${p.id}">
          <span class="status-dot ${p.status}"></span>
          <span class="p-name">${p.name}</span>
          <button class="icon-btn act-run" title="Run"><i data-feather="play"></i></button>
          <button class="icon-btn act-stop" title="Stop"><i data-feather="square"></i></button>
          <button class="icon-btn act-restart" title="Restart"><i data-feather="refresh-cw"></i></button>
          <button class="icon-btn act-folder" title="Open Folder"><i data-feather="folder"></i></button>
          <button class="icon-btn act-vscode" title="Open VS Code"><i data-feather="code"></i></button>
          <button class="icon-btn act-logs" title="Logs"><i data-feather="terminal"></i></button>
        </div>`).join("");

      list.querySelectorAll(".project-item").forEach(item => {
        const id = item.dataset.id;
        item.querySelector(".act-run").onclick = () => callAction(id, "run");
        item.querySelector(".act-stop").onclick = () => callAction(id, "stop");
        item.querySelector(".act-restart").onclick = () => callAction(id, "restart");
        item.querySelector(".act-folder").onclick = () => callAction(id, "open-folder");
        item.querySelector(".act-vscode").onclick = () => callAction(id, "open-vscode");
        item.querySelector(".act-logs").onclick = () => viewLogs(id);
      });
      if (window.feather) feather.replace();
    } catch (e) { /* ignore */ }
  }

  async function callAction(id, action) {
    try {
      await apiFetch(`/api/projects/${id}/${action}`, { method: "POST" });
      showToast(`Done: ${action}`, "success");
      loadProjects();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function viewLogs(id) {
    try {
      const res = await apiFetch(`/api/projects/${id}/logs`);
      alert(res.logs || "No logs yet.");
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  async function addProject() {
    const name = document.getElementById("projNameInput").value.trim();
    const path = document.getElementById("projPathInput").value.trim();
    const cmd = document.getElementById("projCmdInput").value.trim() || "python app.py";
    if (!name || !path) { showToast("Project name and path are required", "error"); return; }
    await apiFetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name, path, run_command: cmd }),
    });
    document.getElementById("projNameInput").value = "";
    document.getElementById("projPathInput").value = "";
    document.getElementById("projCmdInput").value = "";
    loadProjects();
  }

  window.addEventListener("widgets:rendered", () => {
    loadProjects();
    const btn = document.getElementById("addProjectBtn");
    if (btn) btn.onclick = addProject;
  });
  setInterval(loadProjects, 8000);
})();
