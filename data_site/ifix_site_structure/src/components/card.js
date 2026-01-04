// card.js — card genérico (UI pura)
// Responsabilidade: blocos visuais reutilizáveis (título, conteúdo, ações)

window.Card = (function () {
  function render({ title = "", subtitle = "", content = null, actions = null } = {}) {
    const card = document.createElement("div");
    card.className = "c-card";

    const header = document.createElement("div");
    header.className = "c-card__header";
    header.innerHTML = `
      <div class="c-card__titles">
        ${title ? `<div class="c-card__title">${escapeHtml(title)}</div>` : ""}
        ${subtitle ? `<div class="c-card__subtitle">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      <div class="c-card__actions" data-card-actions></div>
    `;

    const body = document.createElement("div");
    body.className = "c-card__body";

    setContent(body, content);

    const actionsEl = header.querySelector("[data-card-actions]");
    setContent(actionsEl, actions);

    card.appendChild(header);
    card.appendChild(body);

    return card;
  }

  function setContent(targetEl, content) {
    targetEl.innerHTML = "";
    if (!content) return;
    if (content instanceof Node) return targetEl.appendChild(content);
    targetEl.innerHTML = String(content);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  return { render };
})();
