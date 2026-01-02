// app.js - Sistema iFix Boituva ATUALIZADO
import { renderDashboard } from './components/dashboard.js';
import { renderCRM } from './components/crm.js';
import { renderPriceManagement } from './components/price.js';
import { renderOrderService } from './components/orderservice.js';

// Banco de dados simulado
import { db } from './databank/bankservice.js';

// Adicionar Chart.js via CDN dinamicamente
function loadChartJS() {
    return new Promise((resolve) => {
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = resolve;
        document.head.appendChild(script);
    });
}

class IFixSystem {
    constructor() {
        this.currentTab = 'dashboard';
        this.currentModal = null;
        this.isChartLoaded = false;
        this.init();
    }

    async init() {
        await loadChartJS();
        this.setupEventListeners();
        this.loadTabContent('dashboard');
        this.loadInitialData();
        
        // Expor sistema globalmente para funções nos templates
        window.system = this;
        window.db = db;
    }

    setupEventListeners() {
        // Navegação por tabs
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Menu toggle responsivo
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });

        // Fechar menu ao clicar fora (mobile)
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menuToggle');
            
            if (window.innerWidth <= 992 && 
                !sidebar.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });

        // Busca global
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.performGlobalSearch(e.target.value);
            });
        }

        // Notificações
        const notificationBtn = document.querySelector('.btn-notification');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    switchTab(tabName) {
        console.log('Mudando para tab:', tabName);
        
        // Atualizar navegação
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.tab === tabName) {
                item.classList.add('active');
            }
        });

        // Atualizar título da página
        const titles = {
            'dashboard': 'Dashboard',
            'clientes': 'Gestão de Clientes',
            'precos': 'Gestão de Preços',
            'ordens': 'Gestão de Ordens de Serviço',
            'relatorios': 'Relatórios',
            'configuracoes': 'Configurações'
        };
        
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[tabName] || tabName;
        }
        
        this.currentTab = tabName;

        // Esconder todas as tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Mostrar a tab atual
        const activeTab = document.getElementById(`${tabName}Content`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Carregar conteúdo da tab
        this.loadTabContent(tabName);
    }

    async loadTabContent(tabName) {
        console.log('Carregando conteúdo para:', tabName);
        
        const tabElement = document.getElementById(`${tabName}Content`);
        
        if (!tabElement) {
            console.error(`Elemento da tab ${tabName} não encontrado`);
            return;
        }

        try {
            switch(tabName) {
                case 'dashboard':
                    await renderDashboard();
                    break;
                case 'clientes':
                    await renderCRM();
                    break;
                case 'precos':
                    await renderPriceManagement();
                    break;
                case 'ordens':
                    await renderOrderService();
                    break;
                default:
                    tabElement.innerHTML = `
                        <div class="card">
                            <div class="text-center" style="padding: 3rem;">
                                <h3>Em desenvolvimento</h3>
                                <p class="text-light mt-2">Esta funcionalidade estará disponível em breve.</p>
                            </div>
                        </div>
                    `;
            }
        } catch (error) {
            console.error(`Erro ao carregar ${tabName}:`, error);
            this.showError(`Erro ao carregar ${tabName}: ${error.message}`);
        }
    }

    loadInitialData() {
        // Carregar dados iniciais do sistema
        console.log('Sistema iFix Boituva inicializado');
    }

    performGlobalSearch(query) {
        if (query.length < 2) return;
        
        console.log('Buscando:', query);
        // Implementar busca global
    }

    showNotifications() {
        this.showModal('notifications', {
            title: 'Notificações',
            content: `
                <div class="notification-list">
                    <div class="notification-item d-flex gap-3 mb-3 p-3 border-bottom">
                        <i class="fas fa-exclamation-circle text-orange"></i>
                        <div>
                            <strong>Nova OS cadastrada</strong>
                            <p>OS #00123 foi cadastrada para João Silva</p>
                            <small class="text-light">Há 5 minutos</small>
                        </div>
                    </div>
                    <div class="notification-item d-flex gap-3 mb-3 p-3 border-bottom">
                        <i class="fas fa-check-circle text-success"></i>
                        <div>
                            <strong>OS concluída</strong>
                            <p>OS #00122 está pronta para retirada</p>
                            <small class="text-light">Há 1 hora</small>
                        </div>
                    </div>
                    <div class="notification-item d-flex gap-3 p-3">
                        <i class="fas fa-user-plus text-info"></i>
                        <div>
                            <strong>Novo cliente</strong>
                            <p>Maria Santos foi cadastrada no sistema</p>
                            <small class="text-light">Hoje</small>
                        </div>
                    </div>
                </div>
            `
        });
    }

    showModal(type, options = {}) {
        // Remover modal anterior
        const existingModal = document.querySelector('.modal.active');
        if (existingModal) {
            existingModal.remove();
        }

        const modalId = `modal-${Date.now()}`;
        const modalHTML = `
            <div class="modal active" id="${modalId}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${options.title || 'Modal'}</h3>
                        <button class="modal-close" data-modal-close="${modalId}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${options.content || ''}
                    </div>
                    ${options.footer ? `
                        <div class="modal-footer">
                            ${options.footer}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('modalContainer').innerHTML = modalHTML;
        this.currentModal = modalId;

        // Adicionar evento para fechar modal
        const closeBtn = document.querySelector(`[data-modal-close="${modalId}"]`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal(modalId));
        }

        // Fechar modal com ESC
        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeModal(modalId);
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        // Fechar modal ao clicar fora
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modalId);
                }
            });
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
                this.currentModal = null;
            }, 300);
        }
    }

    showError(message) {
        const errorHTML = `
            <div class="card mb-4" style="border-left: 4px solid #F44336;">
                <div class="d-flex align-center gap-3">
                    <i class="fas fa-exclamation-triangle" style="color: #F44336; font-size: 1.5rem;"></i>
                    <div>
                        <h4 class="mb-1">Erro</h4>
                        <p class="text-light mb-0">${message}</p>
                    </div>
                </div>
            </div>
        `;

        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.insertAdjacentHTML('afterbegin', errorHTML);

            // Remover após 5 segundos
            setTimeout(() => {
                const errorCard = contentWrapper.querySelector('.card');
                if (errorCard && errorCard.parentNode) {
                    errorCard.parentNode.removeChild(errorCard);
                }
            }, 5000);
        }
    }

    showSuccess(message) {
        const successHTML = `
            <div class="card mb-4" style="border-left: 4px solid #4CAF50;">
                <div class="d-flex align-center gap-3">
                    <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 1.5rem;"></i>
                    <div>
                        <h4 class="mb-1">Sucesso!</h4>
                        <p class="text-light mb-0">${message}</p>
                    </div>
                </div>
            </div>
        `;

        const contentWrapper = document.querySelector('.content-wrapper');
        if (contentWrapper) {
            contentWrapper.insertAdjacentHTML('afterbegin', successHTML);

            // Remover após 3 segundos
            setTimeout(() => {
                const successCard = contentWrapper.querySelector('.card');
                if (successCard && successCard.parentNode) {
                    successCard.parentNode.removeChild(successCard);
                }
            }, 3000);
        }
    }

    // Utilitários de formatação
    formatCurrency(value) {
        if (value === undefined || value === null) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    formatDate(date) {
        if (!date) return '--/--/----';
        return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    }

    formatDateTime(date) {
        if (!date) return '--/--/---- --:--';
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
}

// Inicializar sistema quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IFixSystem();
});

// Exportar funções utilitárias globais
window.formatCurrency = (value) => {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

window.formatDate = (date) => {
    if (!date) return '--/--/----';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};