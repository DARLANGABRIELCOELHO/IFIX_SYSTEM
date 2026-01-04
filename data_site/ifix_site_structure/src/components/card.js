// card.js — card genérico melhorado
window.Card = (function () {
  const VERSION = "2.0.0";
  
  function render({ 
    title = "", 
    subtitle = "", 
    content = null, 
    actions = null,
    footer = null,
    className = "",
    onClick = null,
    id = null,
    data = {}
  } = {}) {
    const card = document.createElement("div");
    card.className = `c-card ${className}`.trim();
    
    if (id) card.id = id;
    if (onClick) {
      card.style.cursor = "pointer";
      card.addEventListener("click", onClick);
    }
    
    // Atributos de dados
    Object.entries(data).forEach(([key, value]) => {
      card.setAttribute(`data-${key}`, value);
    });

    // Header
    const header = document.createElement("div");
    header.className = "c-card__header";
    header.innerHTML = `
      <div class="c-card__titles">
        ${title ? `<div class="c-card__title">${escapeHtml(title)}</div>` : ""}
        ${subtitle ? `<div class="c-card__subtitle">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      <div class="c-card__actions" data-card-actions></div>
    `;

    // Body
    const body = document.createElement("div");
    body.className = "c-card__body";
    setContent(body, content);

    // Actions
    const actionsEl = header.querySelector("[data-card-actions]");
    setContent(actionsEl, actions);

    card.appendChild(header);
    card.appendChild(body);

    // Footer (nova funcionalidade)
    if (footer) {
      const footerEl = document.createElement("div");
      footerEl.className = "c-card__footer";
      setContent(footerEl, footer);
      card.appendChild(footerEl);
    }

    return card;
  }

  function setContent(targetEl, content) {
    targetEl.innerHTML = "";
    if (!content) return;
    
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (item instanceof Node) {
          targetEl.appendChild(item);
        } else if (typeof item === "string") {
          const wrapper = document.createElement("div");
          wrapper.innerHTML = item;
          targetEl.appendChild(wrapper);
        }
      });
      return;
    }
    
    if (content instanceof Node) {
      targetEl.appendChild(content);
      return;
    }
    
    // HTML seguro (já escapado no conteúdo, não no wrapper)
    const wrapper = document.createElement("div");
    wrapper.innerHTML = String(content);
    targetEl.appendChild(wrapper);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { 
    render,
    version: VERSION
  };
})();