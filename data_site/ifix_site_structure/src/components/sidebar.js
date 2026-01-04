// components/sidebar.js
// Sidebar reutilizável com tema iFix

const SIDEBAR_COLLAPSE_KEY = "ifix_sidebar_collapsed";
const SIDEBAR_THEME_KEY = "ifix_theme";

export default {
    /**
     * Renderiza a sidebar
     * @param {Array} items - Itens do menu
     * @returns {HTMLElement} Elemento da sidebar
     */
    render(items = []) {
        const collapsed = localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true';
        const currentTheme = localStorage.getItem(SIDEBAR_THEME_KEY) || 'dark';
        
        const sidebar = document.createElement('aside');
        sidebar.className = `sidebar ${collapsed ? 'collapsed' : ''}`;
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <a href="#" class="sidebar-logo" data-page="dashboard">
                    <div class="sidebar-logo-icon">i</div>
                    ${!collapsed ? `
                        <div class="sidebar-logo-text">
                            i<span>Fix</span>
                        </div>
                    ` : ''}
                </a>
                <button class="sidebar-toggle" id="sidebar-toggle" aria-label="${collapsed ? 'Expandir' : 'Recolher'} menu">
                    <i class="fas ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}"></i>
                </button>
            </div>

            <nav class="sidebar-nav" aria-label="Navegação principal">
                <ul class="sidebar-nav-list">
                    ${items.map(item => {
                        if (item.type === 'divider') {
                            return `<li class="sidebar-divider"></li>`;
                        }
                        
                        const isActive = item.active || false;
                        return `
                            <li class="sidebar-nav-item">
                                <button 
                                    class="sidebar-nav-link ${isActive ? 'active' : ''}" 
                                    data-page="${item.id}"
                                    title="${item.label}"
                                    aria-label="${item.label}"
                                    ${isActive ? 'aria-current="page"' : ''}
                                >
                                    <i class="${item.icon || 'fas fa-circle'}"></i>
                                    ${!collapsed ? `<span>${item.label}</span>` : ''}
                                    ${isActive && !collapsed ? '<span class="active-indicator"></span>' : ''}
                                </button>
                            </li>
                        `;
                    }).join('')}
                </ul>
            </nav>

            <div class="sidebar-footer">
                ${!collapsed ? `
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="sidebar-user-info">
                            <div class="sidebar-user-name">Administrador</div>
                            <div class="sidebar-user-role">Admin</div>
                        </div>
                    </div>
                ` : `
                    <div class="sidebar-user collapsed">
                        <div class="sidebar-user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                `}

                <div class="sidebar-theme-toggle">
                    <i class="fas fa-moon ${currentTheme === 'dark' ? 'active' : ''}" data-theme="dark"></i>
                    <div class="theme-switch" id="theme-switch">
                        <input type="checkbox" id="theme-toggle-checkbox" ${currentTheme === 'light' ? 'checked' : ''}>
                        <span class="theme-slider"></span>
                    </div>
                    <i class="fas fa-sun ${currentTheme === 'light' ? 'active' : ''}" data-theme="light"></i>
                </div>
            </div>
        `;

        return sidebar;
    },

    /**
     * Configura eventos da sidebar
     * @param {Function} onItemClick - Callback para clique nos itens
     */
    onItemClick(onItemClick) {
        document.addEventListener('click', (e) => {
            // Clique no toggle da sidebar
            if (e.target.closest('#sidebar-toggle')) {
                e.preventDefault();
                this.toggleSidebar();
                return;
            }

            // Clique no logo
            if (e.target.closest('.sidebar-logo')) {
                e.preventDefault();
                const page = e.target.closest('.sidebar-logo').dataset.page;
                if (page && onItemClick) {
                    onItemClick(page);
                }
                return;
            }

            // Clique nos itens de navegação
            const navLink = e.target.closest('.sidebar-nav-link');
            if (navLink) {
                e.preventDefault();
                const page = navLink.dataset.page;
                if (page && onItemClick) {
                    onItemClick(page);
                }
                return;
            }

            // Clique no toggle de tema
            const themeIcon = e.target.closest('[data-theme]');
            if (themeIcon) {
                e.preventDefault();
                const theme = themeIcon.dataset.theme;
                this.toggleTheme(theme);
                return;
            }

            // Clique no checkbox do tema
            const themeCheckbox = e.target.closest('#theme-toggle-checkbox');
            if (themeCheckbox) {
                const theme = themeCheckbox.checked ? 'light' : 'dark';
                this.toggleTheme(theme);
                return;
            }
        });
    },

    /**
     * Alterna entre sidebar expandida/recolhida
     */
    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = sidebar.classList.contains('collapsed');
        
        sidebar.classList.toggle('collapsed', !isCollapsed);
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, !isCollapsed);
        
        // Dispara evento personalizado para que outros componentes saibam
        window.dispatchEvent(new CustomEvent('sidebarToggle', {
            detail: { collapsed: !isCollapsed }
        }));
    },

    /**
     * Alterna entre temas claro/escuro
     * @param {string} theme - 'light' ou 'dark'
     */
    toggleTheme(theme) {
        const html = document.documentElement;
        const newTheme = theme || (html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem(SIDEBAR_THEME_KEY, newTheme);
        
        // Atualiza ícones ativos
        document.querySelectorAll('[data-theme]').forEach(icon => {
            icon.classList.toggle('active', icon.dataset.theme === newTheme);
        });
        
        // Atualiza checkbox
        const checkbox = document.getElementById('theme-toggle-checkbox');
        if (checkbox) {
            checkbox.checked = newTheme === 'light';
        }
        
        // Dispara evento personalizado
        window.dispatchEvent(new CustomEvent('themeChange', {
            detail: { theme: newTheme }
        }));
    },

    /**
     * Atualiza o item ativo na sidebar
     * @param {string} pageId - ID da página ativa
     */
    setActiveItem(pageId) {
        document.querySelectorAll('.sidebar-nav-link').forEach(link => {
            const isActive = link.dataset.page === pageId;
            link.classList.toggle('active', isActive);
            link.setAttribute('aria-current', isActive ? 'page' : null);
        });
    },

    /**
     * Retorna o estado atual da sidebar
     * @returns {boolean} Se está recolhida
     */
    isCollapsed() {
        const sidebar = document.querySelector('.sidebar');
        return sidebar ? sidebar.classList.contains('collapsed') : false;
    },

    /**
     * Retorna o tema atual
     * @returns {string} 'light' ou 'dark'
     */
    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'dark';
    },

    /**
     * Adiciona um item à sidebar (dinamicamente)
     * @param {Object} item - Item a ser adicionado
     */
    addItem(item) {
        const navList = document.querySelector('.sidebar-nav-list');
        if (!navList) return;

        const li = document.createElement('li');
        li.className = 'sidebar-nav-item';
        li.innerHTML = `
            <button 
                class="sidebar-nav-link" 
                data-page="${item.id}"
                title="${item.label}"
                aria-label="${item.label}"
            >
                <i class="${item.icon || 'fas fa-circle'}"></i>
                ${!this.isCollapsed() ? `<span>${item.label}</span>` : ''}
            </button>
        `;

        navList.appendChild(li);
    },

    /**
     * Remove um item da sidebar
     * @param {string} itemId - ID do item a ser removido
     */
    removeItem(itemId) {
        const item = document.querySelector(`[data-page="${itemId}"]`);
        if (item && item.closest('.sidebar-nav-item')) {
            item.closest('.sidebar-nav-item').remove();
        }
    },

    /**
     * Atualiza informações do usuário
     * @param {Object} userInfo - Informações do usuário
     */
    updateUserInfo(userInfo) {
        const userName = document.querySelector('.sidebar-user-name');
        const userRole = document.querySelector('.sidebar-user-role');
        const userAvatar = document.querySelector('.sidebar-user-avatar i');
        
        if (userName && userInfo.name) userName.textContent = userInfo.name;
        if (userRole && userInfo.role) userRole.textContent = userInfo.role;
        if (userAvatar && userInfo.avatarIcon) {
            userAvatar.className = userInfo.avatarIcon;
        }
    },

    /**
     * Destrói a sidebar (limpa eventos)
     */
    destroy() {
        // Remove event listeners específicos se necessário
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.replaceWith(sidebar.cloneNode(true));
        }
    }
};