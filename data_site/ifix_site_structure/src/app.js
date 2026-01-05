// src/app.js
// Ponto de entrada principal do sistema iFix - Implementa roteamento e gerenciamento de estado
// Utilizando componentes globais reescritos

// Importação das páginas (mantendo a estrutura original)
import { DashboardPage } from './pages/dashboard.page.js';
import { CRMPage } from './pages/crm.page.js';
import { OrderServicePage } from './pages/orderservice.page.js';
import { PricePage } from './pages/price.page.js';

export const App = (() => {
  // Estado global do sistema
  const state = {
    currentPage: 'dashboard',
    previousPage: null,
    user: null,
    settings: {
      theme: 'dark',
      notifications: true,
      autoRefresh: true
    },
    isLoading: false,
    error: null,
    lastRefresh: null,
    sidebarCollapsed: false
  };

  let root = null;
  let sidebarInstance = null;
  let tabsInstance = null;
  let mainContent = null;
  let loadingOverlay = null;

  // Mapeamento de páginas
  const pages = {
    dashboard: DashboardPage,
    crm: CRMPage,
    orders: OrderServicePage,
    prices: PricePage
  };

  // Instâncias das páginas carregadas
  const pageInstances = {};

  // ==================== INICIALIZAÇÃO ====================
  async function init() {
    root = document.getElementById('app-root') || document.getElementById('app');
    if (!root) {
      console.error('Elemento raiz não encontrado no DOM');
      return;
    }

    // Carregar configurações do localStorage
    loadSettings();

    // Renderizar estrutura base se necessário
    if (!document.querySelector('.app-container')) {
      renderBaseLayout();
    }

    // Inicializar componentes
    await initSidebar();
    await initTabs();

    // Configurar listeners
    setupEventListeners();

    // Carregar página inicial baseada no hash
    const hash = window.location.hash.replace('#', '');
    const initialPage = hash || state.currentPage;
    await loadPage(initialPage);

    // Iniciar auto-refresh se habilitado
    if (state.settings.autoRefresh) {
      startAutoRefresh();
    }

    console.log('✅ Sistema iFix inicializado com sucesso');
  }

  function renderBaseLayout() {
    // Se já existe estrutura no HTML, não recriar
    if (document.querySelector('.app-header')) return;

    root.innerHTML = `
      <div class="app-container">
        <aside id="sidebar" class="app-sidebar"></aside>
        <main class="app-main">
          <header class="app-header">
            <div class="header-left">
              <button class="btn btn-icon" id="toggleSidebar" aria-label="Alternar menu lateral">
                <i class="fas fa-bars"></i>
              </button>
              <div class="app-title">
                <h1>iFix Sistema Interno</h1>
                <span class="app-version">v1.0.0</span>
              </div>
            </div>
            <div class="header-right">
              <div class="user-info" id="userInfo" role="button" tabindex="0">
                <div class="user-avatar">
                  <i class="fas fa-user"></i>
                </div>
                <span class="user-name">Usuário</span>
                <i class="fas fa-chevron-down"></i>
              </div>
              <button class="btn btn-icon" id="toggleTheme" title="Alternar tema" aria-label="Alternar tema">
                <i class="fas fa-moon"></i>
              </button>
              <button class="btn btn-icon" id="refreshPage" title="Atualizar" aria-label="Atualizar página">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </header>
          
          <div id="mainTabs" class="app-tabs"></div>
          
          <div id="mainContent" class="app-content"></div>
          
          <footer class="app-footer">
            <div class="footer-left">
              <span class="status-indicator" id="statusIndicator">
                <span class="status-dot online"></span>
                Sistema online
              </span>
              <span class="last-refresh" id="lastRefresh">
                Última atualização: --
              </span>
            </div>
            <div class="footer-right">
              <span class="copyright">
                © ${new Date().getFullYear()} iFix - Sistema Interno
              </span>
            </div>
          </footer>
        </main>
        
        <div id="globalToast" class="global-toast"></div>
        
        <div id="loadingOverlay" class="loading-overlay">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    `;

    mainContent = document.getElementById('mainContent');
    loadingOverlay = document.getElementById('loadingOverlay');
  }

  async function initSidebar() {
    const sidebarEl = document.getElementById('sidebar');
    if (!sidebarEl) return;

    // Configurar itens da sidebar usando o novo componente
    const sidebarItems = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        active: true
      },
      {
        id: 'crm',
        label: 'CRM',
        icon: '👥',
        badge: '12'
      },
      {
        id: 'orders',
        label: 'Ordens de Serviço',
        icon: '📋',
        badge: '5'
      },
      {
        id: 'prices',
        label: 'Preços',
        icon: '🏷️'
      },
      {
        type: 'divider'
      },
      {
        type: 'header',
        label: 'Módulos'
      },
      {
        id: 'reports',
        label: 'Relatórios',
        icon: '📈'
      },
      {
        id: 'inventory',
        label: 'Estoque',
        icon: '📦'
      },
      {
        id: 'calendar',
        label: 'Agenda',
        icon: '📅'
      }
    ];

    // Usar o novo componente Sidebar
    sidebarInstance = window.Sidebar;
    sidebarInstance.mount(sidebarEl, sidebarItems, {
      brand: 'iFix',
      subtitle: 'Sistema Interno',
      collapsible: true,
      rememberState: true,
      version: '1.0.0'
    });

    // Configurar handler para cliques nos itens
    sidebarInstance.onItemClick((itemId) => {
      navigateTo(itemId);
    });

    // Definir item ativo inicial
    setTimeout(() => {
      sidebarInstance.setActiveItem(state.currentPage);
    }, 100);
  }

  async function initTabs() {
    const tabsEl = document.getElementById('mainTabs');
    if (!tabsEl) return;

    // Configurar abas usando o novo componente
    const tabsConfig = [
      { 
        id: 'dashboard', 
        label: 'Dashboard', 
        active: true, 
        closable: false,
        icon: '📊'
      },
      { 
        id: 'crm', 
        label: 'CRM', 
        closable: true,
        icon: '👥'
      },
      { 
        id: 'orders', 
        label: 'Ordens', 
        closable: true,
        icon: '📋'
      },
      { 
        id: 'prices', 
        label: 'Preços', 
        closable: true,
        icon: '🏷️'
      }
    ];

    // Usar o novo componente Tabs
    tabsInstance = window.Tabs;
    const tabsElement = tabsInstance.render(tabsConfig, {
      type: 'underline',
      align: 'left',
      fullWidth: false
    });

    // Configurar eventos
    tabsInstance.onChange((tabId) => {
      navigateTo(tabId);
    });

    tabsEl.appendChild(tabsElement);
  }

  // ==================== GERENCIAMENTO DE PÁGINAS ====================
  async function loadPage(pageId) {
    if (!pages[pageId]) {
      console.error(`Página "${pageId}" não encontrada`);
      showGlobalToast(`Página "${pageId}" não encontrada`, 'error');
      return;
    }

    // Impedir recarregamento da mesma página
    if (pageId === state.currentPage && pageInstances[pageId]) return;

    // Atualizar estado
    state.previousPage = state.currentPage;
    state.currentPage = pageId;

    // Mostrar loading
    showLoading();

    try {
      // Desmontar página anterior se existir
      if (pageInstances[state.previousPage]) {
        await pageInstances[state.previousPage].unmount?.();
      }

      // Criar instância da página se não existir
      if (!pageInstances[pageId]) {
        pageInstances[pageId] = pages[pageId];
      }

      // Limpar conteúdo atual
      if (mainContent) {
        mainContent.innerHTML = '';
      } else {
        mainContent = document.getElementById('mainContent') || 
                      document.getElementById('app-container');
      }

      // Montar nova página
      await pageInstances[pageId].mount({ 
        rootEl: mainContent,
        onNavigate: (targetPage) => navigateTo(targetPage),
        onRefresh: () => refreshPage(),
        onError: (error) => handlePageError(pageId, error),
        components: {
          Card: window.Card,
          Form: window.Form,
          Modal: window.Modal,
          Table: window.Table,
          Tabs: window.Tabs
        }
      });

      // Atualizar UI
      updateActiveTab(pageId);
      updateSidebarActive(pageId);
      updateLastRefresh();
      updateWindowHash(pageId);

      showGlobalToast(`Página carregada: ${getPageTitle(pageId)}`, 'success');
    } catch (error) {
      console.error(`Erro ao carregar página ${pageId}:`, error);
      showGlobalToast(`Erro ao carregar página: ${error.message}`, 'error');
      
      // Fallback para dashboard em caso de erro
      if (pageId !== 'dashboard') {
        await loadPage('dashboard');
      }
    } finally {
      hideLoading();
    }
  }

  function getPageTitle(pageId) {
    const titles = {
      dashboard: 'Dashboard',
      crm: 'CRM - Clientes',
      orders: 'Ordens de Serviço',
      prices: 'Catálogo de Preços'
    };
    return titles[pageId] || pageId;
  }

  function navigateTo(pageId) {
    // Impedir navegação para mesma página
    if (pageId === state.currentPage) return;

    // Adicionar ao histórico
    window.history.pushState({ page: pageId }, '', `#${pageId}`);

    // Carregar página
    loadPage(pageId);
  }

  function refreshPage() {
    loadPage(state.currentPage);
  }

  function updateActiveTab(pageId) {
    if (tabsInstance && tabsInstance.setActive) {
      const tabsContainer = document.querySelector('.c-tabs');
      if (tabsContainer) {
        tabsInstance.setActive(tabsContainer, pageId);
      }
    }
  }

  function updateSidebarActive(pageId) {
    if (sidebarInstance && sidebarInstance.setActiveItem) {
      sidebarInstance.setActiveItem(pageId);
    }
  }

  function updateWindowHash(pageId) {
    if (window.location.hash !== `#${pageId}`) {
      window.location.hash = pageId;
    }
  }

  // ==================== GERENCIAMENTO DE ESTADO ====================
  function loadSettings() {
    const savedSettings = localStorage.getItem('ifix-settings');
    if (savedSettings) {
      try {
        state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }

    // Aplicar tema salvo
    applyTheme(state.settings.theme);
  }

  function saveSettings() {
    try {
      localStorage.setItem('ifix-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  }

  function updateLastRefresh() {
    const now = new Date();
    state.lastRefresh = now;
    
    const lastRefreshEl = document.getElementById('lastRefresh');
    if (lastRefreshEl) {
      const timeStr = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
      lastRefreshEl.textContent = `Última atualização: ${timeStr}`;
    }
  }

  // ==================== CONTROLES DE UI ====================
  function setupEventListeners() {
    // Toggle sidebar
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    if (toggleSidebarBtn) {
      toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }

    // Toggle theme
    const toggleThemeBtn = document.getElementById('toggleTheme');
    if (toggleThemeBtn) {
      toggleThemeBtn.addEventListener('click', toggleTheme);
    }

    // Refresh page
    const refreshPageBtn = document.getElementById('refreshPage');
    if (refreshPageBtn) {
      refreshPageBtn.addEventListener('click', refreshPage);
    }

    // User menu
    const userInfoBtn = document.getElementById('userInfo');
    if (userInfoBtn) {
      userInfoBtn.addEventListener('click', showUserMenu);
      userInfoBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showUserMenu();
        }
      });
    }

    // Navegação com histórico do browser
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.page) {
        loadPage(event.state.page);
      }
    });

    // Navegação por hash
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && pages[hash] && hash !== state.currentPage) {
        loadPage(hash);
      }
    });

    // Navegação por teclado
    document.addEventListener('keydown', (e) => {
      // Ctrl + R = Refresh
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshPage();
      }
      
      // Escape = Fechar modais
      if (e.key === 'Escape') {
        closeAllModals();
      }
      
      // Ctrl + S = Salvar (em formulários)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        triggerSaveAction();
      }
    });

    // Detectar mudança de conexão
    window.addEventListener('online', () => {
      showGlobalToast('Conexão restaurada', 'success');
      document.getElementById('statusIndicator')?.classList.add('online');
    });

    window.addEventListener('offline', () => {
      showGlobalToast('Sem conexão com a internet', 'warning');
      document.getElementById('statusIndicator')?.classList.remove('online');
    });
  }

  function toggleSidebar() {
    const appContainer = document.querySelector('.app-container');
    if (appContainer) {
      appContainer.classList.toggle('sidebar-collapsed');
      state.sidebarCollapsed = !state.sidebarCollapsed;
      
      // Se estiver usando o componente Sidebar, alternar estado
      if (sidebarInstance && sidebarInstance.toggleSidebar) {
        const sidebarEl = document.querySelector('.c-sidebar');
        if (sidebarEl) {
          sidebarInstance.toggleSidebar(sidebarEl, { collapsible: true, rememberState: true });
        }
      }
    }
  }

  function toggleTheme() {
    const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
    state.settings.theme = newTheme;
    applyTheme(newTheme);
    saveSettings();
    
    // Atualizar ícone
    const themeIcon = document.querySelector('#toggleTheme i');
    if (themeIcon) {
      themeIcon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    showGlobalToast(`Tema alterado para ${newTheme === 'light' ? 'claro' : 'escuro'}`, 'info');
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = `theme-${theme}`;
    
    // Salvar no localStorage do sistema
    localStorage.setItem('ifix-theme', theme);
  }

  function showUserMenu() {
    // Criar menu de usuário usando o componente Modal
    const modalContent = `
      <div class="user-menu">
        <div class="user-menu-header">
          <div class="user-avatar-large">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-details">
            <h3>Usuário</h3>
            <p>admin@ifix.com</p>
          </div>
        </div>
        <div class="user-menu-options">
          <button class="user-menu-item" id="userProfileBtn">
            <i class="fas fa-user"></i>
            <span>Meu Perfil</span>
          </button>
          <button class="user-menu-item" id="userSettingsBtn">
            <i class="fas fa-cog"></i>
            <span>Configurações</span>
          </button>
          <div class="user-menu-divider"></div>
          <button class="user-menu-item" id="logoutBtn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Sair</span>
          </button>
        </div>
      </div>
    `;

    const modal = window.Modal.create({
      title: 'Conta de Usuário',
      content: modalContent,
      size: 'sm',
      closeOnBackdrop: true,
      closeOnEsc: true,
      className: 'user-modal'
    });

    window.Modal.open(modal);

    // Configurar eventos do menu
    setTimeout(() => {
      document.getElementById('userProfileBtn')?.addEventListener('click', () => {
        window.Modal.close(modal);
        showGlobalToast('Perfil do usuário', 'info');
      });

      document.getElementById('userSettingsBtn')?.addEventListener('click', () => {
        window.Modal.close(modal);
        showSettingsModal();
      });

      document.getElementById('logoutBtn')?.addEventListener('click', () => {
        window.Modal.close(modal);
        logout();
      });
    }, 10);
  }

  function showSettingsModal() {
    const modalContent = `
      <div class="settings-modal">
        <div class="settings-group">
          <h4><i class="fas fa-palette"></i> Aparência</h4>
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="darkModeToggle" ${state.settings.theme === 'dark' ? 'checked' : ''}>
              <span class="slider"></span>
              <span class="switch-label">Modo escuro</span>
            </label>
          </div>
        </div>
        
        <div class="settings-group">
          <h4><i class="fas fa-sync-alt"></i> Comportamento</h4>
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="autoRefreshToggle" ${state.settings.autoRefresh ? 'checked' : ''}>
              <span class="slider"></span>
              <span class="switch-label">Auto-refresh (5 min)</span>
            </label>
          </div>
          <div class="form-group">
            <label class="switch">
              <input type="checkbox" id="notificationsToggle" ${state.settings.notifications ? 'checked' : ''}>
              <span class="slider"></span>
              <span class="switch-label">Notificações</span>
            </label>
          </div>
        </div>
        
        <div class="settings-group">
          <h4><i class="fas fa-database"></i> Dados</h4>
          <button class="btn btn-block btn-secondary" id="clearCacheBtn">
            <i class="fas fa-trash"></i> Limpar cache local
          </button>
          <button class="btn btn-block btn-secondary" id="exportDataBtn">
            <i class="fas fa-file-export"></i> Exportar todos os dados
          </button>
        </div>
      </div>
    `;

    const modal = window.Modal.create({
      title: 'Configurações do Sistema',
      content: modalContent,
      size: 'md',
      footer: `
        <button class="btn" data-modal-close>Cancelar</button>
        <button class="btn btn-primary" id="saveSettingsBtn">Salvar</button>
      `
    });

    window.Modal.open(modal);

    // Configurar eventos do modal
    setTimeout(() => {
      // Toggles
      document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
        state.settings.theme = e.target.checked ? 'dark' : 'light';
      });

      document.getElementById('autoRefreshToggle')?.addEventListener('change', (e) => {
        state.settings.autoRefresh = e.target.checked;
        if (e.target.checked) {
          startAutoRefresh();
        } else {
          stopAutoRefresh();
        }
      });

      document.getElementById('notificationsToggle')?.addEventListener('change', (e) => {
        state.settings.notifications = e.target.checked;
      });

      // Botões
      document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
      document.getElementById('exportDataBtn')?.addEventListener('click', exportAllData);
      document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
        saveSettings();
        applyTheme(state.settings.theme);
        window.Modal.close(modal);
        showGlobalToast('Configurações salvas', 'success');
      });
    }, 0);
  }

  function showLoading() {
    state.isLoading = true;
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
    }
  }

  function hideLoading() {
    state.isLoading = false;
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }
  }

  function showGlobalToast(message, type = 'info') {
    const toastEl = document.getElementById('globalToast');
    if (!toastEl) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    
    // Ícone baseado no tipo
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Fechar">&times;</button>
    `;
    
    toastEl.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Botão de fechar
    toast.querySelector('.toast-close').addEventListener('click', () => {
      closeToast(toast);
    });
    
    // Remover automaticamente após 5 segundos (3 para erro)
    const duration = type === 'error' ? 5000 : 3000;
    setTimeout(() => {
      if (toast.parentNode) {
        closeToast(toast);
      }
    }, duration);
  }

  function closeToast(toastElement) {
    toastElement.classList.remove('show');
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    }, 300);
  }

  // ==================== FUNÇÕES AUXILIARES ====================
  function startAutoRefresh() {
    // Atualizar a cada 5 minutos
    state.autoRefreshInterval = setInterval(() => {
      if (state.currentPage === 'dashboard' && pageInstances.dashboard?.refresh) {
        pageInstances.dashboard.refresh();
      }
      updateLastRefresh();
      showGlobalToast('Dados atualizados automaticamente', 'info');
    }, 5 * 60 * 1000);
  }

  function stopAutoRefresh() {
    if (state.autoRefreshInterval) {
      clearInterval(state.autoRefreshInterval);
      state.autoRefreshInterval = null;
    }
  }

  function handlePageError(pageId, error) {
    console.error(`Erro na página ${pageId}:`, error);
    showGlobalToast(`Erro na página: ${error.message}`, 'error');
  }

  function clearCache() {
    if (confirm('Tem certeza que deseja limpar todos os dados locais? Esta ação não pode ser desfeita.')) {
      localStorage.clear();
      sessionStorage.clear();
      showGlobalToast('Cache limpo com sucesso', 'success');
      
      // Recarregar a página
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  function exportAllData() {
    try {
      const data = {
        sistema: 'iFix',
        versao: '1.0.0',
        exportado: new Date().toISOString(),
        dados: {
          clientes: 24,
          ordens: 8,
          servicos: 56,
          faturamento: 12840
        }
      };
      
      // Usar função de exportação do sistema
      exportToJSON(data, `ifix-backup-${new Date().toISOString().split('T')[0]}.json`);
      showGlobalToast('Dados exportados com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      showGlobalToast('Erro ao exportar dados', 'error');
    }
  }

  function exportToJSON(data, filename) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function closeAllModals() {
    document.querySelectorAll('.c-modal__overlay').forEach(modal => {
      window.Modal.close(modal);
    });
  }

  function triggerSaveAction() {
    // Disparar evento de salvar em formulários ativos
    const activeForm = document.querySelector('form:focus-within');
    if (activeForm) {
      const submitBtn = activeForm.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
    }
  }

  function logout() {
    showGlobalToast('Saindo do sistema...', 'info');
    setTimeout(() => {
      // Limpar dados de sessão
      sessionStorage.clear();
      // Redirecionar para página de login
      window.location.href = '/login.html';
    }, 1000);
  }

  // ==================== API PÚBLICA ====================
  return {
    async start() {
      await init();
    },
    
    navigateTo(pageId) {
      navigateTo(pageId);
    },
    
    refreshCurrentPage() {
      refreshPage();
    },
    
    getState() {
      return { ...state };
    },
    
    updateSetting(key, value) {
      state.settings[key] = value;
      saveSettings();
    },
    
    showNotification(message, type = 'info') {
      showGlobalToast(message, type);
    },
    
    exportToJSON(data, filename) {
      exportToJSON(data, filename);
    },
    
    async logout() {
      logout();
    },
    
    // Métodos para componentes
    getComponents() {
      return {
        Card: window.Card,
        Form: window.Form,
        Modal: window.Modal,
        Table: window.Table,
        Tabs: window.Tabs,
        Sidebar: window.Sidebar
      };
    }
  };
})();

// Inicializar aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Verificar se componentes estão carregados
    if (!window.Card || !window.Form || !window.Modal || !window.Sidebar || !window.Table || !window.Tabs) {
      console.warn('Alguns componentes não foram carregados. Verificando novamente...');
      // Aguardar um pouco e tentar novamente
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await App.start();
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
    
    // Mostrar tela de erro amigável
    document.body.innerHTML = `
      <div class="error-container">
        <div class="error-content">
          <h1>⚠️ Erro ao carregar o sistema</h1>
          <p>${error.message}</p>
          <div class="error-actions">
            <button onclick="window.location.reload()" class="btn btn-primary">
              <i class="fas fa-redo"></i> Tentar novamente
            </button>
            <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" class="btn btn-secondary">
              <i class="fas fa-trash"></i> Limpar cache e recarregar
            </button>
          </div>
          <div class="error-details">
            <details>
              <summary>Detalhes técnicos</summary>
              <pre>${error.stack}</pre>
            </details>
          </div>
        </div>
      </div>
    `;
  }
});

// Exportar para uso em outros módulos
window.iFixApp = App;

// Suporte para módulos ES6
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
}