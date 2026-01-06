// app.js - Bootstrap da aplicação iFix Web App

// ==============================
// 1. IMPORTAÇÕES (ES Modules)
// ==============================
import { Storage } from './data/storage.js';
import { Sidebar } from './components/sidebar.js';
import { CRMRepo } from './data/repos/crm.repo.js';
import { OSRepo } from './data/repos/os.repo.js';
import { PriceRepo } from './data/repos/price.repo.js';

// Pages
import { render as renderDashboard, mount as mountDashboard, unmount as unmountDashboard } from './pages/dashboard.page.js';
import { render as renderCRM, mount as mountCRM, unmount as unmountCRM } from './pages/crm.page.js';
import { render as renderOrderService, mount as mountOrderService, unmount as unmountOrderService } from './pages/order-service.page.js';
import { render as renderPrice, mount as mountPrice, unmount as unmountPrice } from './pages/price.page.js';
import { render as renderSettings, mount as mountSettings, unmount as unmountSettings } from './pages/settings.page.js';

// ==============================
// 2. CONFIGURAÇÕES GLOBAIS
// ==============================
const ROUTES = {
    '#dashboard': { render: renderDashboard, mount: mountDashboard, unmount: unmountDashboard },
    '#crm': { render: renderCRM, mount: mountCRM, unmount: unmountCRM },
    '#order-service': { render: renderOrderService, mount: mountOrderService, unmount: unmountOrderService },
    '#price': { render: renderPrice, mount: mountPrice, unmount: unmountPrice },
    '#settings': { render: renderSettings, mount: mountSettings, unmount: unmountSettings }
};

const DEFAULT_ROUTE = '#dashboard';

// ==============================
// 3. ESTADO DA APLICAÇÃO
// ==============================
let currentPage = null;
let currentPageUnmount = null;
let sidebarInstance = null;
let abortController = new AbortController();

// ==============================
// 4. FUNÇÕES CORE
// ==============================

/**
 * Inicializa o storage e repositórios
 */
function initializeData() {
    try {
        Storage.init();
        console.log('✅ Storage inicializado');
    } catch (error) {
        console.error('❌ Falha ao inicializar storage:', error);
        throw error;
    }
}

/**
 * Monta a sidebar
 */
function mountSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-bar' },
        { id: 'crm', label: 'CRM', icon: 'fas fa-users' },
        { id: 'order-service', label: 'Ordens de Serviço', icon: 'fas fa-clipboard-list' },
        { id: 'price', label: 'Preços', icon: 'fas fa-tags' },
        { type: 'divider' },
        { id: 'settings', label: 'Configurações', icon: 'fas fa-cog' }
    ];

    sidebarInstance = Sidebar.render(sidebarItems);
    sidebarContainer.appendChild(sidebarInstance);

    // Configura clique nos itens
    Sidebar.onItemClick((pageId) => {
        window.location.hash = pageId;
    });

    console.log('✅ Sidebar montada');
}

/**
 * Desmonta a página atual
 */
function unmountCurrentPage() {
    if (currentPageUnmount) {
        currentPageUnmount();
        currentPageUnmount = null;
    }

    // Cancela todos os listeners da página anterior
    abortController.abort();
    abortController = new AbortController();

    // Remove o conteúdo antigo
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = '';
    }
}

/**
 * Carrega uma página com base no hash
 * @param {string} hash - Hash da URL (ex: #dashboard)
 */
async function loadPage(hash) {
    // Normaliza hash
    const routeKey = Object.keys(ROUTES).find(key => key === hash) || DEFAULT_ROUTE;
    const route = ROUTES[routeKey];

    // Atualiza a sidebar
    if (sidebarInstance) {
        const pageId = routeKey.replace('#', '');
        Sidebar.setActiveItem(pageId);
    }

    // Desmonta página atual
    unmountCurrentPage();

    // Renderiza nova página
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
        console.error('❌ Container #main-content não encontrado');
        return;
    }

    try {
        // Renderiza o conteúdo
        currentPage = route.render();
        mainContent.appendChild(currentPage);

        // Monta a página (registra eventos)
        if (route.mount) {
            route.mount(abortController.signal);
        }

        // Guarda a função de unmount
        currentPageUnmount = route.unmount || (() => {});

        console.log(`✅ Página carregada: ${routeKey}`);
    } catch (error) {
        console.error(`❌ Erro ao carregar página ${routeKey}:`, error);
        mainContent.innerHTML = `<div class="error-state">Erro ao carregar página. <a href="#dashboard">Voltar ao Dashboard</a></div>`;
    }
}

/**
 * Trata mudanças no hash
 */
function handleHashChange() {
    const hash = window.location.hash || DEFAULT_ROUTE;
    loadPage(hash);
}

/**
 * Inicializa o roteamento
 */
function initializeRouting() {
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Carrega página inicial
    console.log('✅ Roteamento inicializado');
}

/**
 * Inicializa notificações (toast)
 */
function initializeNotifications() {
    // Cria container de notificações se não existir
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

/**
 * Mostra uma notificação
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: 'success', 'error', 'info'
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    container.appendChild(notification);

    // Remove após 5 segundos
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Expor para uso global (se necessário)
window.showNotification = showNotification;

// ==============================
// 5. INICIALIZAÇÃO DA APLICAÇÃO
// ==============================

/**
 * Inicializa a aplicação
 */
async function initializeApp() {
    console.log('🚀 Inicializando iFix Web App...');

    try {
        // 1. Inicializa dados
        initializeData();

        // 2. Inicializa notificações
        initializeNotifications();

        // 3. Monta sidebar
        mountSidebar();

        // 4. Inicializa roteamento
        initializeRouting();

        // 5. Garante seed de preços
        PriceRepo.ensureSeeded();

        console.log('✅ Aplicação inicializada com sucesso');
    } catch (error) {
        console.error('❌ Falha crítica na inicialização:', error);
        document.body.innerHTML = `
            <div style="padding: 2rem; text-align: center;">
                <h2>Erro crítico na inicialização</h2>
                <p>${error.message}</p>
                <button onclick="location.reload()">Recarregar</button>
            </div>
        `;
    }
}

// ==============================
// 6. EXPORTAÇÕES (para testes)
// ==============================
export {
    initializeApp,
    loadPage,
    unmountCurrentPage,
    showNotification
};

// ==============================
// 7. INICIALIZAÇÃO AO CARREGAR
// ==============================
// Aguarda o DOM estar pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}