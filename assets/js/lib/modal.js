// assets/js/lib/modal.js — one modal at a time, appended to <body>.

let activeClose = null;

export function closeModal() {
  if (activeClose) { const c = activeClose; activeClose = null; c(); }
}

// buttons: [{ label, class?, onClick?, closeAfter=true }]
// tone: "warn" | "block" | undefined  (colours the accent bar)
export function openModal({ title, bodyHtml = "", buttons = [], tone, onClose }) {
  closeModal();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal ${tone ? "modal-" + tone : ""}" role="dialog" aria-modal="true"
         aria-label="${(title || "Dialog").replace(/"/g, "&quot;")}">
      ${title ? `<h3 class="modal-title">${title}</h3>` : ""}
      <div class="modal-body">${bodyHtml}</div>
      <div class="modal-actions"></div>
    </div>`;

  const actions = overlay.querySelector(".modal-actions");
  buttons.forEach((b) => {
    const el = document.createElement("button");
    el.className = `btn ${b.class || "btn-ghost"}`;
    el.textContent = b.label;
    el.addEventListener("click", async () => {
      let keepOpen = false;
      if (b.onClick) {
        el.disabled = true;
        try { keepOpen = (await b.onClick()) === false; }
        finally { el.disabled = false; }
      }
      if (b.closeAfter !== false && !keepOpen) closeModal();
    });
    actions.appendChild(el);
  });

  function onKey(e) { if (e.key === "Escape") closeModal(); }
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add("show"));

  activeClose = () => {
    document.removeEventListener("keydown", onKey);
    overlay.classList.remove("show");
    setTimeout(() => overlay.remove(), 140);
    if (onClose) onClose();
  };

  const first = actions.querySelector(".btn-teal, .btn-primary") || actions.querySelector(".btn");
  if (first) first.focus();
  return closeModal;
}
