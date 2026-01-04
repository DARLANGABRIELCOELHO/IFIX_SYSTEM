// sidebar.js — componente de navegação lateral (UI pura)
// Responsabilidade: render + controle de item ativo + callback de clique

window.Sidebar = (function () {
  let onClickHandler = null;
  let containerEl = null;

  const DEFAULTS = {
    brand: "iFix",
    subtitle: "Sistema Interno",
  };

  function render(items = [], opts = {}) {
    const options = { ...DEFAULTS, ...opts };

    const aside = document.createElement("aside");
    aside.className = "c-sidebar";
    aside.setAttribute("role", "navigation");
    aside.setAttribute("aria-label", "Menu lateral");

    aside.innerHTML = `
      <div class="c-sidebar__brand">
        <div class="c-sidebar__brandTitle">${escapeHtml(options.brand)}</div>
        <div class="c-sidebar__brandSubtitle">${escapeHtml(options.subtitle)}</div>
      </div>

      <div class="c-sidebar__content">
        <ul class="c-sidebar__list" data-sidebar-list></ul>
      </div>
    `;

    const list = aside.querySelector("[data-sidebar-list]");
    list.appendChild(buildItems(items));

    // Eventos (delegação)
    aside.addEventListener("click", (e) => {
      const item = e.target.closest("[data-sidebar-item]");
      if (!item) return;

      const id = item.getAttribute("data-sidebar-item");
      if (!id) return;

      setActiveItem(id);

      if (typeof onClickHandler === "function") {
        onClickHandler(id);
      }
    });

    return aside;
  }

  function mount(targetEl, items = [], opts = {}) {
    if (!targetEl) throw new Error("Sidebar.mount: targetEl é obrigatório");
    containerEl = targetEl;
    containerEl.innerHTML = "";
    containerEl.appendChild(render(items, opts));
  }

  function onItemClick(cb) {
    onClickHandler = cb;
  }

  function setActiveItem(id) {
    const root = getRoot();
    if (!root) return;

    const all = root.querySelectorAll("[data-sidebar-item]");
    all.forEach((el) => el.classList.remove("is-active"));

    const active = root.querySelector(`[data-sidebar-item="${cssEscape(id)}"]`);
    if (active) active.classList.add("is-active");
  }

  function buildItems(items) {
    const frag = document.createDocumentFragment();

    items.forEach((it) => {
      if (it?.type === "divider") {
        const li = document.createElement("li");
        li.className = "c-sidebar__divider";
        frag.appendChild(li);
        return;
      }

      const li = document.createElement("li");
      li.className = "c-sidebar__item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-sidebar__btn";
      btn.setAttribute("data-sidebar-item", it.id);

      if (it.active) btn.classList.add("is-active");

      btn.innerHTML = `
        <span class="c-sidebar__icon" aria-hidden="true">
          ${it.icon ? `<i class="${escapeAttr(it.icon)}"></i>` : ""}
        </span>
        <span class="c-sidebar__label">${escapeHtml(it.label ?? it.id)}</span>
      `;

      li.appendChild(btn);
      frag.appendChild(li);
    });

    return frag;
  }

  function getRoot() {
    if (!containerEl) return document.querySelector(".c-sidebar");
    return containerEl.querySelector(".c-sidebar");
  }

  // Helpers
  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replaceAll("`", "&#096;");
  }

  // cssEscape simples (suficiente para ids comuns)
  function cssEscape(str) {
    return String(str ?? "").replaceAll('"', '\\"');
  }

  return { render, mount, onItemClick, setActiveItem };
})();
