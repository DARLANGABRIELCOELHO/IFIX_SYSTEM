// sidebar.js — sidebar melhorada com localStorage e estado
window.Sidebar = (function () {
  const STORAGE_KEY = "sidebar_state";
  let onClickHandler = null;
  let containerEl = null;
  let currentActive = null;

  const DEFAULTS = {
    brand: "iFix",
    subtitle: "Sistema Interno",
    collapsible: false,
    rememberState: true
  };

  function render(items = [], opts = {}) {
    const options = { ...DEFAULTS, ...opts };
    
    // Recupera estado salvo
    let collapsed = false;
    if (options.rememberState) {
      const saved = localStorage.getItem(STORAGE_KEY);
      collapsed = saved === "collapsed";
    }

    const aside = document.createElement("aside");
    aside.className = "c-sidebar";
    aside.setAttribute("role", "navigation");
    aside.setAttribute("aria-label", "Menu lateral");
    
    if (options.collapsible) {
      aside.classList.add("c-sidebar--collapsible");
      if (collapsed) aside.classList.add("is-collapsed");
    }

    aside.innerHTML = `
      <div class="c-sidebar__brand">
        <div class="c-sidebar__brandContent">
          <div class="c-sidebar__brandTitle">${escapeHtml(options.brand)}</div>
          <div class="c-sidebar__brandSubtitle">${escapeHtml(options.subtitle)}</div>
        </div>
        ${options.collapsible ? 
          `<button class="c-sidebar__toggle" type="button" aria-label="${collapsed ? 'Expandir' : 'Recolher'}" data-sidebar-toggle>
            <span class="c-sidebar__toggleIcon">${collapsed ? '→' : '←'}</span>
          </button>` : 
          ''
        }
      </div>

      <div class="c-sidebar__content">
        <nav class="c-sidebar__nav">
          <ul class="c-sidebar__list" data-sidebar-list></ul>
        </nav>
        ${options.collapsible && !collapsed ? 
          `<div class="c-sidebar__footer">
            <small class="c-sidebar__version">v${options.version || '1.0.0'}</small>
          </div>` : 
          ''
        }
      </div>
    `;

    const list = aside.querySelector("[data-sidebar-list]");
    list.appendChild(buildItems(items));

    // Eventos
    aside.addEventListener("click", handleSidebarClick.bind(null, options));
    
    // Toggle via teclado
    const toggleBtn = aside.querySelector("[data-sidebar-toggle]");
    if (toggleBtn) {
      toggleBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSidebar(aside, options);
        }
      });
    }

    return aside;
  }

  function handleSidebarClick(options, e) {
    const toggleBtn = e.target.closest("[data-sidebar-toggle]");
    if (toggleBtn) {
      toggleSidebar(this, options);
      return;
    }

    const item = e.target.closest("[data-sidebar-item]");
    if (!item) return;

    const id = item.getAttribute("data-sidebar-item");
    if (!id) return;

    setActiveItem(id);
    
    if (typeof onClickHandler === "function") {
      onClickHandler(id);
    }
  }

  function toggleSidebar(sidebarEl, options) {
    if (!sidebarEl || !options.collapsible) return;
    
    sidebarEl.classList.toggle("is-collapsed");
    const isCollapsed = sidebarEl.classList.contains("is-collapsed");
    
    // Atualiza ícone do botão
    const toggleIcon = sidebarEl.querySelector(".c-sidebar__toggleIcon");
    if (toggleIcon) {
      toggleIcon.textContent = isCollapsed ? "→" : "←";
    }
    
    // Atualiza aria-label
    const toggleBtn = sidebarEl.querySelector("[data-sidebar-toggle]");
    if (toggleBtn) {
      toggleBtn.setAttribute("aria-label", isCollapsed ? "Expandir" : "Recolher");
    }
    
    // Salva estado
    if (options.rememberState) {
      localStorage.setItem(STORAGE_KEY, isCollapsed ? "collapsed" : "expanded");
    }
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
    
    currentActive = id;
    
    const allItems = root.querySelectorAll("[data-sidebar-item]");
    allItems.forEach(item => {
      item.classList.remove("is-active");
      item.setAttribute("aria-current", "false");
    });
    
    const activeItem = root.querySelector(`[data-sidebar-item="${cssEscape(id)}"]`);
    if (activeItem) {
      activeItem.classList.add("is-active");
      activeItem.setAttribute("aria-current", "page");
      
      // Rolagem suave para o item ativo
      activeItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  function buildItems(items) {
    const frag = document.createDocumentFragment();
    
    items.forEach((item) => {
      if (item?.type === "divider") {
        const li = document.createElement("li");
        li.className = "c-sidebar__divider";
        li.setAttribute("role", "separator");
        frag.appendChild(li);
        return;
      }
      
      if (item?.type === "header") {
        const li = document.createElement("li");
        li.className = "c-sidebar__header";
        li.textContent = escapeHtml(item.label);
        frag.appendChild(li);
        return;
      }
      
      const li = document.createElement("li");
      li.className = "c-sidebar__item";
      
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-sidebar__btn";
      btn.setAttribute("data-sidebar-item", item.id);
      btn.setAttribute("aria-label", item.label || item.id);
      
      if (item.active) btn.classList.add("is-active");
      if (item.disabled) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
      }
      
      btn.innerHTML = `
        ${item.icon ? `<span class="c-sidebar__icon" aria-hidden="true">${item.icon}</span>` : ""}
        <span class="c-sidebar__label">${escapeHtml(item.label || item.id)}</span>
        ${item.badge ? `<span class="c-sidebar__badge">${escapeHtml(item.badge)}</span>` : ""}
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

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function cssEscape(str) {
    return CSS.escape ? CSS.escape(str) : String(str).replace(/[^a-z0-9]/gi, "\\$&");
  }

  return {
    render,
    mount,
    onItemClick,
    setActiveItem,
    getActiveItem: () => currentActive
  };
})();