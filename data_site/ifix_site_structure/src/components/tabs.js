// tabs.js — abas reutilizáveis (UI pura)
// Responsabilidade: render + troca de aba + callback

window.Tabs = (function () {
  let onChangeHandler = null;

  function render(tabs = [], opts = {}) {
    const root = document.createElement("div");
    root.className = "c-tabs";
    root.setAttribute("role", "tablist");

    const activeId = opts.activeId ?? (tabs.find((t) => t.active)?.id || tabs[0]?.id);

    root.innerHTML = `
      <div class="c-tabs__bar" data-tabs-bar></div>
    `;

    const bar = root.querySelector("[data-tabs-bar]");

    tabs.forEach((t) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "c-tabs__tab";
      btn.setAttribute("role", "tab");
      btn.setAttribute("data-tab-id", t.id);
      btn.setAttribute("aria-selected", String(t.id === activeId));
      if (t.id === activeId) btn.classList.add("is-active");

      btn.textContent = t.label ?? t.id;

      bar.appendChild(btn);
    });

    // delegação
    root.addEventListener("click", (e) => {
      const tab = e.target.closest("[data-tab-id]");
      if (!tab) return;
      const id = tab.getAttribute("data-tab-id");
      setActive(root, id);

      if (typeof onChangeHandler === "function") {
        onChangeHandler(id);
      }
    });

    return root;
  }

  function setActive(rootEl, id) {
    if (!rootEl) return;
    const all = rootEl.querySelectorAll("[data-tab-id]");
    all.forEach((el) => {
      const isActive = el.getAttribute("data-tab-id") === id;
      el.classList.toggle("is-active", isActive);
      el.setAttribute("aria-selected", String(isActive));
    });
  }

  function onChange(cb) {
    onChangeHandler = cb;
  }

  return { render, setActive, onChange };
})();
