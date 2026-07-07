(function () {
  let currentPath = null;
  let drives = [];

  const EXT_ICONS = {
    ".py": "code", ".js": "code", ".html": "code", ".css": "code", ".json": "code",
    ".md": "file-text", ".txt": "file-text", ".log": "file-text",
    ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".svg": "image",
    ".zip": "archive", ".rar": "archive", ".7z": "archive",
    ".mp3": "music", ".wav": "music",
    ".mp4": "video", ".mov": "video", ".avi": "video",
    ".pdf": "file-text", ".exe": "terminal",
  };

  function iconFor(entry) {
    if (entry.is_dir) return "folder";
    return EXT_ICONS[entry.ext] || "file";
  }

  function formatSize(bytes) {
    if (bytes === null || bytes === undefined) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  }

  async function loadRoot() {
    try {
      const data = await apiFetch("/api/files/root");
      drives = data.drives || [];
      const select = document.getElementById("fmDriveSelect");
      if (select) {
        select.innerHTML = drives.map(d => `<option value="${d}">${d}</option>`).join("");
        select.onchange = () => browseTo(select.value);
      }
      currentPath = data.default_path;
      browseTo(currentPath);
    } catch (e) {
      showToast("Failed to load file manager: " + e.message, "error");
    }
  }

  async function browseTo(path) {
    const list = document.getElementById("fmList");
    if (!list) return;
    try {
      const data = await apiFetch(`/api/files/list?path=${encodeURIComponent(path)}`);
      currentPath = data.path;
      renderBreadcrumb(data.path);
      renderList(data.entries, data.parent);
    } catch (e) {
      list.innerHTML = `<div class="empty-hint">${e.message}</div>`;
    }
  }

  function renderBreadcrumb(path) {
    const el = document.getElementById("fmBreadcrumb");
    if (el) el.textContent = path;
  }

  function renderList(entries, parent) {
    const list = document.getElementById("fmList");
    if (entries.length === 0) {
      list.innerHTML = `<div class="empty-hint">Folder is empty</div>`;
      return;
    }
    list.innerHTML = entries.map(e => `
      <div class="fm-row" data-path="${escapeHtml(e.path)}" data-dir="${e.is_dir}" data-image="${e.is_image}">
        <i data-feather="${iconFor(e)}" class="fm-row-icon"></i>
        <span class="fm-row-name">${escapeHtml(e.name)}</span>
        <span class="fm-row-size">${formatSize(e.size)}</span>
        <span class="fm-row-date">${e.modified ? e.modified.slice(0, 16).replace("T", " ") : ""}</span>
        <div class="fm-row-actions">
          ${!e.is_dir ? `<button class="icon-btn fm-download" title="Download"><i data-feather="download"></i></button>` : ""}
          <button class="icon-btn fm-rename" title="Rename"><i data-feather="edit-3"></i></button>
          <button class="icon-btn fm-delete" title="Delete"><i data-feather="trash-2"></i></button>
        </div>
      </div>`).join("");

    list.querySelectorAll(".fm-row").forEach(row => {
      const path = row.dataset.path;
      const isDir = row.dataset.dir === "true";
      const isImage = row.dataset.image === "true";

      row.querySelector(".fm-row-name").addEventListener("click", () => {
        if (isDir) browseTo(path);
        else if (isImage) previewImage(path);
        else downloadFile(path);
      });

      const dlBtn = row.querySelector(".fm-download");
      if (dlBtn) dlBtn.addEventListener("click", (e) => { e.stopPropagation(); downloadFile(path); });

      row.querySelector(".fm-rename").addEventListener("click", (e) => {
        e.stopPropagation();
        promptInput("Rename", row.querySelector(".fm-row-name").textContent, async (newName) => {
          await withPinAction("/api/files/rename", { path, new_name: newName });
        });
      });

      row.querySelector(".fm-delete").addEventListener("click", (e) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${row.querySelector(".fm-row-name").textContent}"?`)) return;
        withPinAction("/api/files/delete", { path });
      });
    });

    if (window.feather) feather.replace();
  }

  function downloadFile(path) {
    window.open(`/api/files/download?path=${encodeURIComponent(path)}`, "_blank");
  }

  function previewImage(path) {
    const modal = document.getElementById("fmPreviewModal");
    document.getElementById("fmPreviewImg").src = `/api/files/preview?path=${encodeURIComponent(path)}`;
    document.getElementById("fmPreviewName").textContent = path.split(/[\\/]/).pop();
    modal.classList.remove("hidden");
  }

  function promptInput(title, defaultValue, onConfirm) {
    const modal = document.getElementById("fmPromptModal");
    document.getElementById("fmPromptTitle").textContent = title;
    const input = document.getElementById("fmPromptInput");
    input.value = defaultValue || "";
    modal.classList.remove("hidden");

    const confirmBtn = document.getElementById("fmPromptConfirm");
    const cancelBtn = document.getElementById("fmPromptCancel");

    function cleanup() {
      modal.classList.add("hidden");
      confirmBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    }
    function onOk() {
      const val = input.value.trim();
      cleanup();
      if (val) onConfirm(val);
    }
    function onCancel() { cleanup(); }

    confirmBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  }

  async function withPinAction(url, body) {
    return PinGate.withPin(async (pin) => {
      await apiFetch(url, {
        method: "POST",
        headers: { "X-Control-Pin": pin },
        body: JSON.stringify(body),
      });
      showToast("Done", "success");
      browseTo(currentPath);
    });
  }

  function bind() {
    document.getElementById("fmUpBtn").onclick = () => {
      const parentPath = currentPath.split(/[\\/]/).slice(0, -1).join("/") || "/";
      browseTo(parentPath);
    };
    document.getElementById("fmRefreshBtn").onclick = () => browseTo(currentPath);
    document.getElementById("fmOpenNativeBtn").onclick = () => withPinAction("/api/files/open", { path: currentPath });

    document.getElementById("fmNewFolderBtn").onclick = () => {
      promptInput("New folder name", "", async (name) => {
        await withPinAction("/api/files/mkdir", { path: currentPath, name });
      });
    };

    const uploadBtn = document.getElementById("fmUploadBtn");
    const uploadInput = document.getElementById("fmUploadInput");
    uploadBtn.onclick = () => uploadInput.click();
    uploadInput.onchange = async () => {
      const files = Array.from(uploadInput.files);
      if (files.length === 0) return;
      PinGate.withPin(async (pin) => {
        for (const file of files) {
          const formData = new FormData();
          formData.append("path", currentPath);
          formData.append("file", file);
          const res = await fetch("/api/files/upload", {
            method: "POST",
            headers: { "X-Control-Pin": pin },
            body: formData,
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
        }
        showToast(`Uploaded ${files.length} files`, "success");
        browseTo(currentPath);
      });
      uploadInput.value = "";
    };

    document.getElementById("fmPreviewClose").onclick = () => {
      document.getElementById("fmPreviewModal").classList.add("hidden");
    };
  }

  window.addEventListener("widgets:rendered", () => {
    const widget = document.querySelector('[data-widget="file_manager"]');
    if (!widget) return;
    bind();
    loadRoot();
  });
})();
