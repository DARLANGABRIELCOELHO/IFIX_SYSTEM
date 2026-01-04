// app.js - Aplicação principal com navegação entre módulos
class IFIXSystem {
    constructor() {
        this.currentPage = 'dashboard';
        this.initializeNavigation();
        this.loadPage(this.currentPage);
        this.setupGlobalListeners();
    }
    
    initializeNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }
    
    navigateTo(page) {
        // Atualizar navegação ativa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });
        
        // Atualizar breadcrumb
        document.getElementById('currentPage').textContent = this.getPageTitle(page);
        
        // Carregar página
        this.currentPage = page;
        this.loadPage(page);
    }
    
    getPageTitle(page) {
        const titles = {
            'dashboard': 'Dashboard',
            'price': 'Consulta de Preços',
            'orderservice': 'Ordem de Serviço',
            'crm': 'CRM Clientes',
            'services': 'Serviços'
        };
        return titles[page] || page;
    }
    
    async loadPage(page) {
        const content = document.getElementById('pageContent');
        content.innerHTML = '<div class="loading">Carregando...</div>';
        
        try {
            switch(page) {
                case 'dashboard':
                    if (window.DashboardModule) {
                        content.innerHTML = window.DashboardModule.render();
                        window.DashboardModule.initialize();
                    }
                    break;
                case 'price':
                    if (window.PriceModule) {
                        content.innerHTML = window.PriceModule.render();
                        window.PriceModule.initialize();
                    }
                    break;
                case 'orderservice':
                    if (window.OrderServiceModule) {
                        content.innerHTML = window.OrderServiceModule.render();
                        window.OrderServiceModule.initialize();
                    }
                    break;
                case 'crm':
                    if (window.CRMModule) {
                        content.innerHTML = window.CRMModule.render();
                        window.CRMModule.initialize();
                    }
                    break;
                default:
                    content.innerHTML = '<div class="page-placeholder">Módulo em desenvolvimento</div>';
            }
        } catch (error) {
            console.error(`Erro ao carregar página ${page}:`, error);
            content.innerHTML = '<div class="error">Erro ao carregar a página</div>';
        }
    }
    
    setupGlobalListeners() {
        // Listener global para Enter
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.currentPage === 'price') {
                if (window.PriceModule && window.PriceModule.searchPrices) {
                    window.PriceModule.searchPrices();
                }
            }
        });
    }
}

// Inicializar sistema quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.ifixSystem = new IFIXSystem();
});