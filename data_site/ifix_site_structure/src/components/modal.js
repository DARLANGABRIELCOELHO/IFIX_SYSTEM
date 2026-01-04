// modal.js — modal reutilizável (UI pura)
// Responsabilidade: abrir/fechar + conteúdo dinâmico + callback de fechamento

window.Modal = (function () {
  let onCloseHandler = null;

  function create({ title = "Modal", content = null, footer = null, closeOnBackdrop = true } = {}) {
    const overlay = document.createElement("div");
    overlay.className = "c-modal__overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");

    overlay.innerHTML = `
      <div class="c-modal" data-modal>
        <div class="c-modal__header">
          <div class="c-modal__title" data-modal-title></div>
          <button class="c-modal__close" type="button" aria-label="Fechar" data-modal-close>×</button>
        </div>
        <div class="c-modal__body" data-modal-body></div>
        <div class="c-modal__footer" data-modal-footer></div>
      </div>
    `;

    overlay.querySelector("[data-modal-title]").textContent = title;

    const body = overlay.querySelector("[data-modal-body]");
    const footerEl = overlay.querySelector("[data-modal-footer]");

    setContent(body, content);
    setContent(footerEl, footer);

    overlay.addEventListener("click", (e) => {
      const isCloseBtn = e.target.closest("[data-modal-close]");
      const clickedOverlay = e.target === overlay;

      if (isCloseBtn) close(overlay);
      if (closeOnBackdrop && clickedOverlay) close(overlay);
    });

    // ESC fecha
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close(overlay);
    });

    return overlay;
  }

  function open(modalEl) {
    if (!modalEl) return;
    document.body.appendChild(modalEl);

    // foco (básico)
    setTimeout(() => {
      const closeBtn = modalEl.querySelector("[data-modal-close]");
      closeBtn?.focus();
    }, 0);
  }

  function close(modalEl) {
    if (!modalEl) return;
    modalEl.remove();

    if (typeof onCloseHandler === "function") onCloseHandler();
  }

  function onClose(cb) {
    onCloseHandler = cb;
  }

  function setContent(targetEl, content) {
    targetEl.innerHTML = "";
    if (!content) return;

    if (content instanceof Node) {
      targetEl.appendChild(content);
      return;
    }

    // string
    targetEl.innerHTML = String(content);
  }

  return { create, open, close, onClose };
})();
