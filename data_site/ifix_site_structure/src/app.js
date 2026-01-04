// app.js — SPA Orchestrator (JS puro, sem framework e sem imports)
// Requisitos: sidebar + carregamento de páginas + breadcrumb + tema

(function () {
  const ROUTES = ["dashboard", "price"]; // no momento, você pediu só essas pages

  const DOM = {
    sidebarRoot: document.querySelector("#sidebar"),
    pageRoot: document.querySelector("#page-container"),
    breadcrumbCurrent: document.querySelector("#current-breadcrumb"),
    themeToggle: document.querySelector("#theme-toggle"),
  };

  const AppState = {
    currentPage: null,
    theme: "dark",
  };

  function normalizeRoute(id) {
    const r = String(id ?? "").trim().toLowerCase();
    if (r === "order-service") return "orderservice"; // compat, caso apareça
    if (ROUTES.includes(r)) return r;
    return "dashboard";
  }

  function pageLabel(pageId) {
    switch (pageId) {
      case "price":
        return "Preços";
      case "dashboard":
      default:
        return "Dashboard";
    }
  }

  function setupTheme() {
    const savedTheme = localStorage.getItem("ifix-theme") || "dark";
    AppState.theme = savedTheme;
    document.documentElement.setAttribute("data-theme", savedTheme);

    // expõe global (se você quiser usar em outros lugares)
    window.toggleTheme = () => {
      AppState.theme = AppState.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", AppState.theme);
      localStorage.setItem("ifix-theme", AppState.theme);
    };

    if (DOM.themeToggle) {
      DOM.themeToggle.addEventListener("click", () => window.toggleTheme());
    }
  }

  function setBreadcrumb(pageId) {
    if (!DOM.breadcrumbCurrent) return;
    DOM.breadcrumbCurrent.textContent = pageLabel(pageId);
  }

  function renderLoading(pageId) {
    if (!DOM.pageRoot) return;
    DOM.pageRoot.innerHTML = `
      <div class="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Carregando ${escapeHtml(pageLabel(pageId))}...</p>
      </div>
    `;
  }

  function renderError(msg) {
    if (!DOM.pageRoot) return;
    DOM.pageRoot.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro ao carregar página</h3>
        <p>${escapeHtml(msg || "Erro desconhecido")}</p>
        <button class="btn btn-primary" id="btnBackDash">Voltar ao Dashboard</button>
      </div>
    `;
    document.getElementById("btnBackDash")?.addEventListener("click", () => loadPage("dashboard"));
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ===== Sidebar =====
  function initSidebar() {
    if (!DOM.sidebarRoot || !window.Sidebar) return;

    // usa o componente Sidebar (global) criado antes: Sidebar.mount + Sidebar.onItemClick + Sidebar.setActiveItem
    window.Sidebar.mount(
      DOM.sidebarRoot,
      [
        { id: "dashboard", label: "Dashboard", icon: "fas fa-chart-bar", active: true },
        { id: "price", label: "Preços", icon: "fas fa-tags" },
      ],
      { brand: "iFix", subtitle: "Sistema Interno" }
    );

    window.Sidebar.onItemClick((pageId) => loadPage(pageId));
  }

  // ===== Navegação por links data-page =====
  function bindGlobalNav() {
    document.addEventListener("click", (e) => {
      const el = e.target.closest("[data-page]");
      if (!el) return;

      const pageId = el.getAttribute("data-page");
      if (!pageId) return;

      e.preventDefault();
      loadPage(pageId);
    });
  }

  // ===== Carregamento de página =====
  function loadPage(pageId) {
    const id = normalizeRoute(pageId);
    AppState.currentPage = id;

    // sidebar active
    window.Sidebar?.setActiveItem?.(id);

    // breadcrumb
    setBreadcrumb(id);

    // loading
    renderLoading(id);

    try {
      const page = window.Pages?.[id];
      if (!page || typeof page.render !== "function") {
        throw new Error(`Página "${id}" não está registrada em window.Pages.`);
      }

      const view = page.render();
      if (!DOM.pageRoot) return;

      DOM.pageRoot.innerHTML = "";
      DOM.pageRoot.appendChild(view);

      // acessibilidade: foco no conteúdo
      document.querySelector("#app")?.focus?.();
    } catch (err) {
      console.error("❌ Erro ao carregar página:", err);
      renderError(err?.message);
    }
  }

  function initData() {
    // garante seeds e estruturas mínimas
    if (window.Storage?.init) {
      window.Storage.init({ version: 1 });
    }
  }

  function initApp() {
    setupTheme();
    initData();
    initSidebar();
    bindGlobalNav();

    loadPage("dashboard");

    console.log("✅ iFix Sistema iniciado com sucesso!");
  }

  // expõe API mínima global
  window.App = { loadPage, state: AppState };

  document.addEventListener("DOMContentLoaded", initApp);

  window.addEventListener("error", (event) => {
    console.error("Erro global:", event.error);
  });
})();
