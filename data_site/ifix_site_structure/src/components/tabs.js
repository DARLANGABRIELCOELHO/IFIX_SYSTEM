// tabs.js — abas reutilizáveis melhoradas
window.Tabs = (function () {
  let onChangeHandler = null;
  let currentActive = null;
  
  function render(tabs = [], opts = {}) {
    const options = {
      type: "normal", // normal, pills, underline
      align: "left", // left, center, right
      fullWidth: false,
      ...opts
    };
    
    const activeId = opts.activeId ?? (tabs.find(t => t.active)?.id || tabs[0]?.id);
    currentActive = activeId;
    
    const container = document.createElement("div");
    container.className = `c-tabs c-tabs--${options.type}`;
    if (options.fullWidth) container.classList.add("c-tabs--full");
    
    const bar = document.createElement("div");
    bar.className = `c-tabs__bar c-tabs__bar--${options.align}`;
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Navegação por abas");
    
    tabs.forEach((tab) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-tabs__tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", String(tab.id === activeId));
      btn.setAttribute("aria-controls", `tabpanel-${tab.id}`);
      btn.setAttribute("id", `tab-${tab.id}`);
      btn.setAttribute("data-tab-id", tab.id);
      
      if (tab.id === activeId) {
        btn.classList.add("is-active");
        btn.setAttribute("tabindex", "0");
      } else {
        btn.setAttribute("tabindex", "-1");
      }
      
      if (tab.disabled) {
        btn.disabled = true;
        btn.classList.add("is-disabled");
      }
      
      // Conteúdo da tab
      const content = document.createElement("div");
      content.className = "c-tabs__tab-content";
      
      if (tab.icon) {
        const icon = document.createElement("span");
        icon.className = "c-tabs__icon";
        icon.innerHTML = tab.icon;
        content.appendChild(icon);
      }
      
      const label = document.createElement("span");
      label.className = "c-tabs__label";
      label.textContent = tab.label ?? tab.id;
      content.appendChild(label);
      
      if (tab.badge) {
        const badge = document.createElement("span");
        badge.className = "c-tabs__badge";
        badge.textContent = tab.badge;
        content.appendChild(badge);
      }
      
      btn.appendChild(content);
      bar.appendChild(btn);
    });
    
    container.appendChild(bar);
    
    // Conteúdo das tabs
    const contentContainer = document.createElement("div");
    contentContainer.className = "c-tabs__content-container";
    
    tabs.forEach((tab) => {
      const panel = document.createElement("div");
      panel.className = "c-tabs__panel";
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", `tab-${tab.id}`);
      panel.setAttribute("id", `tabpanel-${tab.id}`);
      panel.setAttribute("data-tabpanel-id", tab.id);
      
      if (tab.id === activeId) {
        panel.classList.add("is-active");
      } else {
        panel.hidden = true;
      }
      
      // Conteúdo customizado ou padrão
      if (tab.content) {
        if (tab.content instanceof Node) {
          panel.appendChild(tab.content);
        } else {
          panel.innerHTML = tab.content;
        }
      }
      
      contentContainer.appendChild(panel);
    });
    
    container.appendChild(contentContainer);
    
    // Eventos
    bar.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab-id]");
      if (!tab || tab.disabled) return;
      
      const id = tab.getAttribute("data-tab-id");
      switchTab(container, id);
      
      if (typeof onChangeHandler === "function") {
        onChangeHandler(id);
      }
    });
    
    // Navegação por teclado
    bar.addEventListener("keydown", (e) => {
      const tabs = Array.from(bar.querySelectorAll("[data-tab-id]:not(.is-disabled)"));
      const currentIndex = tabs.findIndex(t => t.classList.contains("is-active"));
      
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          switchTab(container, tabs[prevIndex].getAttribute("data-tab-id"));
          break;
          
        case "ArrowRight":
          e.preventDefault();
          const nextIndex = (currentIndex + 1) % tabs.length;
          switchTab(container, tabs[nextIndex].getAttribute("data-tab-id"));
          break;
          
        case "Home":
          e.preventDefault();
          switchTab(container, tabs[0].getAttribute("data-tab-id"));
          break;
          
        case "End":
          e.preventDefault();
          switchTab(container, tabs[tabs.length - 1].getAttribute("data-tab-id"));
          break;
      }
    });
    
    return container;
  }
  
  function switchTab(container, id) {
    if (!container) return;
    
    // Atualiza botões
    const allTabs = container.querySelectorAll("[data-tab-id]");
    allTabs.forEach(tab => {
      const isActive = tab.getAttribute("data-tab-id") === id;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    
    // Atualiza painéis
    const allPanels = container.querySelectorAll("[data-tabpanel-id]");
    allPanels.forEach(panel => {
      const isActive = panel.getAttribute("data-tabpanel-id") === id;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
      
      // Foco no primeiro elemento interativo do painel ativo
      if (isActive) {
        setTimeout(() => {
          const focusable = panel.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          focusable?.focus();
        }, 10);
      }
    });
    
    currentActive = id;
  }
  
  function onChange(cb) {
    onChangeHandler = cb;
  }
  
  function getActiveTab(container) {
    return container?.querySelector("[data-tab-id].is-active")?.getAttribute("data-tab-id") || currentActive;
  }
  
  function setActive(container, id) {
    switchTab(container, id);
  }
  
  function updateTab(container, id, updates) {
    const tab = container?.querySelector(`[data-tab-id="${id}"]`);
    const panel = container?.querySelector(`[data-tabpanel-id="${id}"]`);
    
    if (updates.label && tab) {
      const label = tab.querySelector(".c-tabs__label");
      if (label) label.textContent = updates.label;
    }
    
    if (updates.badge && tab) {
      let badge = tab.querySelector(".c-tabs__badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "c-tabs__badge";
        tab.querySelector(".c-tabs__tab-content").appendChild(badge);
      }
      badge.textContent = updates.badge;
    }
    
    if (updates.disabled !== undefined && tab) {
      tab.disabled = updates.disabled;
      tab.classList.toggle("is-disabled", updates.disabled);
    }
    
    if (updates.content && panel) {
      panel.innerHTML = "";
      if (updates.content instanceof Node) {
        panel.appendChild(updates.content);
      } else {
        panel.innerHTML = updates.content;
      }
    }
  }
  
  return { 
    render, 
    setActive, 
    onChange,
    getActiveTab,
    updateTab,
    switchTab
  };
})();