// modal.js — modal reutilizável melhorado
window.Modal = (function () {
  let currentModal = null;
  let focusableElements = [];
  let focusedBeforeModal = null;

  function create({ 
    title = "Modal", 
    content = null, 
    footer = null, 
    closeOnBackdrop = true,
    closeOnEsc = true,
    size = "md", // sm, md, lg, xl
    className = "",
    onOpen = null,
    onClose = null,
    preventClose = false
  } = {}) {
    const overlay = document.createElement("div");
    overlay.className = "c-modal__overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", `modal-title-${Date.now()}`);

    const modal = document.createElement("div");
    modal.className = `c-modal c-modal--${size} ${className}`.trim();
    modal.setAttribute("data-modal", "");

    modal.innerHTML = `
      <div class="c-modal__header">
        <h2 class="c-modal__title" id="modal-title-${Date.now()}" data-modal-title></h2>
        ${!preventClose ? '<button class="c-modal__close" type="button" aria-label="Fechar" data-modal-close>×</button>' : ''}
      </div>
      <div class="c-modal__body" data-modal-body></div>
      <div class="c-modal__footer" data-modal-footer></div>
    `;

    overlay.appendChild(modal);

    modal.querySelector("[data-modal-title]").textContent = title;

    const body = modal.querySelector("[data-modal-body]");
    const footerEl = modal.querySelector("[data-modal-footer]");

    setContent(body, content);
    setContent(footerEl, footer);

    // Eventos
    if (!preventClose) {
      overlay.addEventListener("click", (e) => {
        const isCloseBtn = e.target.closest("[data-modal-close]");
        const clickedOverlay = e.target === overlay;

        if (isCloseBtn) close(overlay, onClose);
        if (closeOnBackdrop && clickedOverlay) close(overlay, onClose);
      });

      if (closeOnEsc) {
        overlay.addEventListener("keydown", (e) => {
          if (e.key === "Escape") close(overlay, onClose);
        });
      }
    }

    // Foco trap
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        trapFocus(e, overlay);
      }
    });

    return overlay;
  }

  function open(modalEl) {
    if (!modalEl) return;
    
    // Salva elemento com foco atual
    focusedBeforeModal = document.activeElement;
    
    // Fecha modal anterior se existir
    if (currentModal) {
      currentModal.remove();
    }
    
    document.body.appendChild(modalEl);
    currentModal = modalEl;
    
    // Foca no primeiro elemento interativo
    setTimeout(() => {
      const focusable = getFocusableElements(modalEl);
      focusableElements = focusable;
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }, 10);
    
    // Bloqueia scroll da página
    document.body.style.overflow = "hidden";
  }

  function close(modalEl, callback = null) {
    if (!modalEl) return;
    
    modalEl.remove();
    currentModal = null;
    
    // Restaura scroll
    document.body.style.overflow = "";
    
    // Retorna foco ao elemento anterior
    if (focusedBeforeModal) {
      focusedBeforeModal.focus();
    }
    
    // Callback
    if (typeof callback === "function") {
      callback();
    }
  }

  function setContent(targetEl, content) {
    targetEl.innerHTML = "";
    if (!content) return;

    if (content instanceof Node) {
      targetEl.appendChild(content);
      return;
    }

    // Pode ser string, array ou objeto
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item instanceof Node) {
          targetEl.appendChild(item);
        } else {
          const div = document.createElement("div");
          div.innerHTML = item;
          targetEl.appendChild(div);
        }
      });
    } else {
      targetEl.innerHTML = String(content);
    }
  }

  function getFocusableElements(modalEl) {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return Array.from(modalEl.querySelectorAll(focusableSelectors.join(',')))
      .filter(el => el.offsetParent !== null); // Somente visíveis
  }

  function trapFocus(e, modalEl) {
    const focusable = getFocusableElements(modalEl);
    if (focusable.length === 0) return;

    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  }

  return { 
    create, 
    open, 
    close, 
    setContent 
  };
})();