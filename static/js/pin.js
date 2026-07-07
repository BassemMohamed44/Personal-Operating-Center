const PinGate = (() => {
  const modal = document.getElementById("pinModal");
  const input = document.getElementById("pinInput");
  const confirmBtn = document.getElementById("pinConfirm");
  const cancelBtn = document.getElementById("pinCancel");
  let resolver = null;

  function ask() {
    return new Promise((resolve) => {
      resolver = resolve;
      input.value = "";
      modal.classList.remove("hidden");
      input.focus();
    });
  }

  function close(result) {
    modal.classList.add("hidden");
    if (resolver) { resolver(result); resolver = null; }
  }

  if (confirmBtn) confirmBtn.addEventListener("click", () => close(input.value));
  if (cancelBtn) cancelBtn.addEventListener("click", () => close(null));
  if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") close(input.value); });

  async function withPin(fn) {
    const pin = await ask();
    if (pin === null) return;
    try {
      await fn(pin);
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  return { withPin };
})();
