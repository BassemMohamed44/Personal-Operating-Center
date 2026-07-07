(function () {
  let currentNoteId = null;

  async function loadNote() {
    const textarea = document.getElementById("quickNote");
    if (!textarea) return;
    try {
      const notes = await apiFetch("/api/notes");
      if (notes.length > 0) {
        currentNoteId = notes[0].id;
        textarea.value = notes[0].content;
      }
    } catch (e) { /* ignore */ }
  }

  async function saveNote() {
    const textarea = document.getElementById("quickNote");
    const content = textarea.value;
    if (currentNoteId) {
      await apiFetch(`/api/notes/${currentNoteId}`, { method: "PATCH", body: JSON.stringify({ content }) });
    } else {
      const note = await apiFetch("/api/notes", { method: "POST", body: JSON.stringify({ title: "Quick Note", content }) });
      currentNoteId = note.id;
    }
    showToast("Note saved", "success");
  }

  window.addEventListener("widgets:rendered", () => {
    loadNote();
    const btn = document.getElementById("saveNoteBtn");
    if (btn) btn.onclick = saveNote;
  });
})();
