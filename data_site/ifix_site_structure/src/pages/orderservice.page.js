// pages/orderservice.page.js
import { openModal, closeModal, showNotification } from '../app.js';
import Modal from '../components/modal.js';
import Table from '../components/table.js';
import Form from '../components/form.js';

const OrderServicePage = {
    currentData: null,
    selectedClient: null,
    selectedServices: [],
    allServices: [],
    allClients: [],

    async render() {
        const container = document.createElement('div');
        container.className = 'order-service-page';
        container.innerHTML = `
            <div class="page-header">
                <div class="header-content">
                    <h1><i class="fas fa-clipboard-list"></i> Ordens de Serviço</h1>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="new-order-btn">
                            <i class="fas fa-plus"></i> Nova Ordem
                        </button>
                        <button class="btn btn-secondary" id="print-all-btn">
                            <i class="fas fa-print"></i> Imprimir Selecionadas
                        </button>
                    </div>
                </div>
                <div class="search-filter">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="search-orders" placeholder="Buscar por cliente, modelo, OS...">
                    </div>
                    <div class="filters">
                        <select id="filter-status" class="form-control">
                            <option value="">Todos os status</option>
                            <option value="aberto">Em aberto</option>
                            <option value="andamento">Em andamento</option>
                            <option value="aguardando">Aguardando peças</option>
                            <option value="finalizado">Finalizado</option>
                            <option value="entregue">Entregue</option>
                        </select>
                        <select id="filter-date" class="form-control">
                            <option value="">Todos os períodos</option>
                            <option value="today">Hoje</option>
                            <option value="week">Esta semana</option>
                            <option value="month">Este mês</option>
                            <option value="last-month">Mês anterior</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="page-content">
                <!-- Lista de ordens -->
                <div class="orders-list-container" id="orders-list">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Carregando ordens de serviço...</p>
                    </div>
                </div>

                <!-- Resumo rápido -->
                <div class="quick-summary">
                    <div class="summary-card">
                        <div class="summary-icon" style="background: rgba(33, 150, 243, 0.1);">
                            <i class="fas fa-clock" style="color: #2196F3;"></i>
                        </div>
                        <div class="summary-info">
                            <span class="summary-value" id="count-aberto">0</span>
                            <span class="summary-label">Em aberto</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon" style="background: rgba(255, 152, 0, 0.1);">
                            <i class="fas fa-tools" style="color: #FF9800;"></i>
                        </div>
                        <div class="summary-info">
                            <span class="summary-value" id="count-andamento">0</span>
                            <span class="summary-label">Em andamento</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon" style="background: rgba(156, 39, 176, 0.1);">
                            <i class="fas fa-box-open" style="color: #9C27B0;"></i>
                        </div>
                        <div class="summary-info">
                            <span class="summary-value" id="count-aguardando">0</span>
                            <span class="summary-label">Aguardando peças</span>
                        </div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-icon" style="background: rgba(76, 175, 80, 0.1);">
                            <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
                        </div>
                        <div class="summary-info">
                            <span class="summary-value" id="count-finalizado">0</span>
                            <span class="summary-label">Finalizado</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        return container;
    },

    async init() {
        // Carrega dados iniciais
        await this.loadData();
        
        // Configura eventos
        this.setupEvents();
        
        // Renderiza a lista de ordens
        this.renderOrdersList();
    },

    async loadData() {
        try {
            // Carrega serviços
            this.allServices = await this.loadServices();
            
            // Carrega clientes (simulação)
            this.allClients = await this.loadClients();
            
            // Carrega ordens
            this.currentData = await this.loadOrders();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            showNotification('Erro ao carregar dados', 'error');
        }
    },

    async loadServices() {
        // Simulação - em produção viria do price.repo.js
        return [
            { id: 1, name: 'Troca de Tela', category: 'Tela', price: 250.00 },
            { id: 2, name: 'Troca de Bateria', category: 'Bateria', price: 150.00 },
            { id: 3, name: 'Troca de Conector de Carga', category: 'Hardware', price: 120.00 },
            { id: 4, name: 'Limpeza Interna', category: 'Manutenção', price: 80.00 },
            { id: 5, name: 'Troca de Alto-falante', category: 'Áudio', price: 90.00 },
            { id: 6, name: 'Troca de Câmera Traseira', category: 'Câmera', price: 180.00 },
            { id: 7, name: 'Troca de Câmera Frontal', category: 'Câmera', price: 130.00 },
            { id: 8, name: 'Troca de Botão Power', category: 'Hardware', price: 70.00 },
            { id: 9, name: 'Troca de Microfone', category: 'Áudio', price: 85.00 },
            { id: 10, name: 'Software/Desbloqueio', category: 'Software', price: 100.00 }
        ];
    },

    async loadClients() {
        // Simulação - em produção viria do crm.repo.js
        return [
            { id: 1, name: 'João Silva', phone: '(11) 99999-9999', email: 'joao@email.com' },
            { id: 2, name: 'Maria Santos', phone: '(11) 98888-8888', email: 'maria@email.com' },
            { id: 3, name: 'Pedro Oliveira', phone: '(11) 97777-7777', email: 'pedro@email.com' },
            { id: 4, name: 'Ana Costa', phone: '(11) 96666-6666', email: 'ana@email.com' }
        ];
    },

    async loadOrders() {
        // Simulação - em produção viria do os.repo.js
        return [
            {
                id: 'OS-2024-001',
                clientId: 1,
                clientName: 'João Silva',
                entryDate: '2024-01-15',
                device: 'iPhone 12',
                devicePassword: '1234',
                status: 'andamento',
                services: [1, 2],
                serviceValue: 400.00,
                createdAt: '2024-01-15T10:30:00'
            },
            {
                id: 'OS-2024-002',
                clientId: 2,
                clientName: 'Maria Santos',
                entryDate: '2024-01-16',
                device: 'Samsung Galaxy S21',
                devicePassword: '',
                status: 'aberto',
                services: [3],
                serviceValue: 120.00,
                createdAt: '2024-01-16T14:20:00'
            }
        ];
    },

    setupEvents() {
        // Botão nova ordem
        document.getElementById('new-order-btn')?.addEventListener('click', () => {
            this.openOrderModal();
        });

        // Botão imprimir selecionadas
        document.getElementById('print-all-btn')?.addEventListener('click', () => {
            this.printSelectedOrders();
        });

        // Busca
        document.getElementById('search-orders')?.addEventListener('input', (e) => {
            this.filterOrders(e.target.value);
        });

        // Filtros
        document.getElementById('filter-status')?.addEventListener('change', (e) => {
            this.applyFilters();
        });

        document.getElementById('filter-date')?.addEventListener('change', (e) => {
            this.applyFilters();
        });
    },

    renderOrdersList() {
        const container = document.getElementById('orders-list');
        if (!container) return;

        if (!this.currentData || this.currentData.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>Nenhuma ordem de serviço encontrada</h3>
                    <p>Clique em "Nova Ordem" para criar sua primeira OS.</p>
                    <button class="btn btn-primary" id="create-first-order">
                        <i class="fas fa-plus"></i> Criar Primeira Ordem
                    </button>
                </div>
            `;

            document.getElementById('create-first-order')?.addEventListener('click', () => {
                this.openOrderModal();
            });

            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all"></th>
                            <th>OS</th>
                            <th>Cliente</th>
                            <th>Aparelho</th>
                            <th>Data Entrada</th>
                            <th>Serviços</th>
                            <th>Valor</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="orders-table-body">
                        ${this.currentData.map(order => this.renderOrderRow(order)).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Configura evento do checkbox "selecionar todos"
        document.getElementById('select-all')?.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.order-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });

        // Configura eventos das ações
        this.setupRowEvents();

        // Atualiza resumo
        this.updateSummary();
    },

    renderOrderRow(order) {
        const statusColors = {
            'aberto': 'badge-blue',
            'andamento': 'badge-orange',
            'aguardando': 'badge-yellow',
            'finalizado': 'badge-green',
            'entregue': 'badge-gray'
        };

        const statusText = {
            'aberto': 'Em aberto',
            'andamento': 'Em andamento',
            'aguardando': 'Aguardando peças',
            'finalizado': 'Finalizado',
            'entregue': 'Entregue'
        };

        // Busca serviços selecionados
        const services = order.services.map(serviceId => {
            const service = this.allServices.find(s => s.id === serviceId);
            return service ? service.name : 'Serviço não encontrado';
        });

        return `
            <tr data-order-id="${order.id}">
                <td><input type="checkbox" class="order-checkbox" value="${order.id}"></td>
                <td><strong>${order.id}</strong></td>
                <td>
                    <div class="client-info">
                        <strong>${order.clientName}</strong>
                        <small>${this.getClientPhone(order.clientId)}</small>
                    </div>
                </td>
                <td>${order.device}</td>
                <td>${this.formatDate(order.entryDate)}</td>
                <td>
                    <div class="services-tags">
                        ${services.map(service => `<span class="tag tag-sm">${service}</span>`).join('')}
                    </div>
                </td>
                <td><strong>R$ ${order.serviceValue.toFixed(2)}</strong></td>
                <td>
                    <span class="badge ${statusColors[order.status] || 'badge-gray'}">
                        ${statusText[order.status] || order.status}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn btn-icon btn-sm view-order" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-icon btn-sm edit-order" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-icon btn-sm print-order" title="Imprimir">
                        <i class="fas fa-print"></i>
                    </button>
                </td>
            </tr>
        `;
    },

    setupRowEvents() {
        // Visualizar
        document.querySelectorAll('.view-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').dataset.orderId;
                this.viewOrder(orderId);
            });
        });

        // Editar
        document.querySelectorAll('.edit-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').dataset.orderId;
                this.editOrder(orderId);
            });
        });

        // Imprimir
        document.querySelectorAll('.print-order').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const orderId = e.target.closest('tr').dataset.orderId;
                this.printOrder(orderId);
            });
        });
    },

    updateSummary() {
        if (!this.currentData) return;

        const counts = {
            aberto: 0,
            andamento: 0,
            aguardando: 0,
            finalizado: 0,
            entregue: 0
        };

        this.currentData.forEach(order => {
            if (counts[order.status] !== undefined) {
                counts[order.status]++;
            }
        });

        document.getElementById('count-aberto').textContent = counts.aberto;
        document.getElementById('count-andamento').textContent = counts.andamento;
        document.getElementById('count-aguardando').textContent = counts.aguardando;
        document.getElementById('count-finalizado').textContent = counts.finalizado;
    },

    async openOrderModal(orderData = null) {
        const isEdit = orderData !== null;
        
        const modalContent = document.createElement('div');
        modalContent.className = 'order-form-modal';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2><i class="fas ${isEdit ? 'fa-edit' : 'fa-plus'}"></i> ${isEdit ? 'Editar' : 'Nova'} Ordem de Serviço</h2>
                <button class="btn btn-icon modal-close" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <form id="order-form">
                    <!-- Abas do formulário -->
                    <div class="form-tabs">
                        <button type="button" class="form-tab active" data-tab="dados-cliente">Dados do Cliente</button>
                        <button type="button" class="form-tab" data-tab="dados-aparelho">Dados do Aparelho</button>
                        <button type="button" class="form-tab" data-tab="testes">Testes Técnicos</button>
                        <button type="button" class="form-tab" data-tab="servicos">Serviços</button>
                        <button type="button" class="form-tab" data-tab="valores">Valores e Observações</button>
                        <button type="button" class="form-tab" data-tab="termos">Termos</button>
                    </div>

                    <!-- Conteúdo das abas -->
                    <div class="tab-content">
                        <!-- Aba 1: Dados do Cliente -->
                        <div id="dados-cliente" class="tab-pane active">
                            <div class="form-section">
                                <h3><i class="fas fa-user"></i> Dados do Cliente</h3>
                                <div class="form-group">
                                    <label class="form-label required">Cliente</label>
                                    <div class="client-selector">
                                        <select id="client-select" class="form-control" required>
                                            <option value="">Selecione um cliente...</option>
                                            ${this.allClients.map(client => 
                                                `<option value="${client.id}" ${orderData?.clientId === client.id ? 'selected' : ''}>
                                                    ${client.name} - ${client.phone}
                                                </option>`
                                            ).join('')}
                                        </select>
                                        <button type="button" class="btn btn-text" id="new-client-btn">
                                            <i class="fas fa-user-plus"></i> Novo Cliente
                                        </button>
                                    </div>
                                </div>

                                <div class="client-info-card" id="client-info-card" style="display: none;">
                                    <div class="card">
                                        <div class="card-header">
                                            <h4>Informações do Cliente</h4>
                                        </div>
                                        <div class="card-body">
                                            <div class="info-grid">
                                                <div class="info-item">
                                                    <span class="info-label">Nome:</span>
                                                    <span class="info-value" id="client-name">-</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="info-label">Telefone:</span>
                                                    <span class="info-value" id="client-phone">-</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="info-label">Email:</span>
                                                    <span class="info-value" id="client-email">-</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Aba 2: Dados do Aparelho -->
                        <div id="dados-aparelho" class="tab-pane">
                            <div class="form-section">
                                <h3><i class="fas fa-mobile-alt"></i> Dados do Aparelho</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label required">Data de Entrada</label>
                                        <input type="date" id="entry-date" class="form-control" required 
                                               value="${orderData?.entryDate || this.getTodayDate()}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label required">Modelo do Aparelho</label>
                                        <input type="text" id="device-model" class="form-control" required 
                                               value="${orderData?.device || ''}" 
                                               placeholder="Ex: iPhone 12, Samsung Galaxy S21...">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Senha do Aparelho</label>
                                    <input type="text" id="device-password" class="form-control" 
                                           value="${orderData?.devicePassword || ''}" 
                                           placeholder="Caso tenha senha, informe aqui">
                                </div>

                                <h4>Condições Iniciais do Aparelho</h4>
                                <div class="conditions-grid">
                                    <div class="condition-item">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="condition-powered" ${orderData?.conditionPowered ? 'checked' : ''}>
                                            <span>Chegou ligado?</span>
                                        </label>
                                    </div>
                                    <div class="condition-item">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="condition-removed" ${orderData?.conditionRemoved ? 'checked' : ''}>
                                            <span>Retirou chip e capinha?</span>
                                        </label>
                                    </div>
                                    <div class="condition-item">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="condition-maintenance" ${orderData?.conditionMaintenance ? 'checked' : ''}>
                                            <span>Já passou por manutenção?</span>
                                        </label>
                                    </div>
                                    <div class="condition-item">
                                        <label class="checkbox-label">
                                            <input type="checkbox" id="condition-water" ${orderData?.conditionWater ? 'checked' : ''}>
                                            <span>Já teve contato com água?</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="form-group" id="water-time-group" style="display: none;">
                                    <label class="form-label">Há quanto tempo teve contato com água?</label>
                                    <input type="text" id="water-time" class="form-control" 
                                           value="${orderData?.waterTime || ''}" 
                                           placeholder="Ex: 2 dias, 1 semana, 1 mês...">
                                </div>
                            </div>
                        </div>

                        <!-- Aba 3: Testes Técnicos -->
                        <div id="testes" class="tab-pane">
                            <div class="form-section">
                                <h3><i class="fas fa-clipboard-check"></i> Testes de Entrada (Checklist Técnico)</h3>
                                
                                <div class="tests-grid">
                                    ${this.renderTestChecklist(orderData)}
                                </div>

                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="all-tests-possible" ${orderData?.allTestsPossible ? 'checked' : ''}>
                                        <span>Foi possível realizar todos os testes?</span>
                                    </label>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Observações dos Testes</label>
                                    <textarea id="test-notes" class="form-control" rows="3" 
                                              placeholder="Anotações técnicas sobre os testes realizados...">${orderData?.testNotes || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Aba 4: Serviços -->
                        <div id="servicos" class="tab-pane">
                            <div class="form-section">
                                <h3><i class="fas fa-tools"></i> Serviços a Serem Executados</h3>
                                
                                <div class="services-selection">
                                    <div class="services-grid">
                                        ${this.allServices.map(service => `
                                            <label class="service-checkbox">
                                                <input type="checkbox" 
                                                       name="services" 
                                                       value="${service.id}" 
                                                       class="service-item"
                                                       ${orderData?.services?.includes(service.id) ? 'checked' : ''}>
                                                <div class="service-card">
                                                    <div class="service-icon">
                                                        <i class="fas fa-wrench"></i>
                                                    </div>
                                                    <div class="service-info">
                                                        <h4>${service.name}</h4>
                                                        <p>${service.category}</p>
                                                        <span class="service-price">R$ ${service.price.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </label>
                                        `).join('')}
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Descrição dos Serviços Executados</label>
                                    <textarea id="service-description" class="form-control" rows="4" 
                                              placeholder="Descreva detalhadamente os serviços que serão executados...">${orderData?.serviceDescription || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Aba 5: Valores e Observações -->
                        <div id="valores" class="tab-pane">
                            <div class="form-section">
                                <h3><i class="fas fa-dollar-sign"></i> Valores e Observações</h3>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label required">Valor do Serviço (R$)</label>
                                        <div class="input-with-button">
                                            <input type="number" id="service-value" class="form-control" required 
                                                   step="0.01" min="0" value="${orderData?.serviceValue || '0.00'}">
                                            <button type="button" class="btn btn-text" id="calculate-total">
                                                <i class="fas fa-calculator"></i> Calcular Total
                                            </button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Desconto (R$)</label>
                                        <input type="number" id="discount" class="form-control" 
                                               step="0.01" min="0" value="${orderData?.discount || '0.00'}">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Total a Pagar (R$)</label>
                                    <input type="text" id="total-value" class="form-control total-display" readonly 
                                           value="R$ 0,00">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Observações Comerciais</label>
                                    <textarea id="commercial-notes" class="form-control" rows="4" 
                                              placeholder="Anotações comerciais, acordos, prazos...">${orderData?.commercialNotes || ''}</textarea>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Anotações Técnicas</label>
                                    <textarea id="technical-notes" class="form-control" rows="4" 
                                              placeholder="Anotações técnicas internas...">${orderData?.technicalNotes || ''}</textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Aba 6: Termos -->
                        <div id="termos" class="tab-pane">
                            <div class="form-section">
                                <h3><i class="fas fa-file-signature"></i> Termos e Assinatura</h3>
                                
                                <div class="terms-card">
                                    <div class="terms-content">
                                        <p><strong>TERMOS E CONDIÇÕES DE SERVIÇO</strong></p>
                                        <p>1. O prazo estimado para o serviço é de até 15 dias úteis.</p>
                                        <p>2. A iFix não se responsabiliza por dados perdidos durante o serviço.</p>
                                        <p>3. Peças substituídas serão devolvidas ao cliente se solicitado.</p>
                                        <p>4. Após 30 dias da conclusão, aparelhos não retirados serão considerados abandonados.</p>
                                        <p>5. Garantia de 90 dias para os serviços executados.</p>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="checkbox-label">
                                        <input type="checkbox" id="agree-terms" required>
                                        <span>Declaro que li e concordo com os termos acima</span>
                                    </label>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label class="form-label">Data e Hora</label>
                                        <input type="datetime-local" id="signature-date" class="form-control" 
                                               value="${this.getCurrentDateTime()}" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Nome do Cliente (assinatura)</label>
                                        <input type="text" id="client-signature" class="form-control" 
                                               placeholder="Nome completo para assinatura" required>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Assinatura Digital</label>
                                    <div class="signature-pad">
                                        <canvas id="signature-canvas" width="500" height="200"></canvas>
                                        <div class="signature-actions">
                                            <button type="button" class="btn btn-text" id="clear-signature">
                                                <i class="fas fa-eraser"></i> Limpar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-navigation">
                        <button type="button" class="btn btn-secondary" id="prev-tab">
                            <i class="fas fa-arrow-left"></i> Anterior
                        </button>
                        <button type="button" class="btn btn-secondary" id="next-tab">
                            Próximo <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> Cancelar
                </button>
                <button type="button" class="btn btn-primary" id="save-order">
                    <i class="fas fa-save"></i> ${isEdit ? 'Atualizar' : 'Salvar'} Ordem
                </button>
                <button type="button" class="btn btn-orange" id="save-print-order">
                    <i class="fas fa-print"></i> Salvar e Imprimir
                </button>
            </div>
        `;

        openModal(modalContent);
        this.setupOrderFormEvents(orderData);
    },

    renderTestChecklist(orderData) {
        const tests = [
            { id: 'wifi', label: 'Wi-Fi', defaultValue: 'ok' },
            { id: 'bluetooth', label: 'Bluetooth', defaultValue: 'ok' },
            { id: 'vibration', label: 'Motor vibra', defaultValue: 'ok' },
            { id: 'flash', label: 'Flash', defaultValue: 'ok' },
            { id: 'screen', label: 'Tela / Touch', defaultValue: 'ok' },
            { id: 'proximity', label: 'Sensor de presença', defaultValue: 'ok' },
            { id: 'fingerprint', label: 'Digital (biometria)', defaultValue: 'ok' },
            { id: 'sim', label: 'Chip / Ligação', defaultValue: 'ok' },
            { id: 'charging', label: 'Conector de carga', defaultValue: 'ok' },
            { id: 'microphone', label: 'Microfone', defaultValue: 'ok' },
            { id: 'front-camera', label: 'Câmera frontal', defaultValue: 'ok' },
            { id: 'buttons', label: 'Botão power e volume', defaultValue: 'ok' },
            { id: 'data-3g', label: 'Conexão 3G/4G', defaultValue: 'ok' },
            { id: 'back-camera', label: 'Câmera traseira', defaultValue: 'ok' },
            { id: 'speaker', label: 'Alto-falante auricular', defaultValue: 'ok' }
        ];

        return tests.map(test => {
            const value = orderData?.tests?.[test.id] || test.defaultValue;
            return `
                <div class="test-item">
                    <label class="test-label">${test.label}</label>
                    <div class="test-options">
                        <label class="radio-label">
                            <input type="radio" name="test-${test.id}" value="ok" ${value === 'ok' ? 'checked' : ''}>
                            <span class="radio-button ok">OK</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="test-${test.id}" value="nok" ${value === 'nok' ? 'checked' : ''}>
                            <span class="radio-button nok">NOK</span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="test-${test.id}" value="na" ${value === 'na' ? 'checked' : ''}>
                            <span class="radio-button na">N/A</span>
                        </label>
                    </div>
                </div>
            `;
        }).join('');
    },

    setupOrderFormEvents(orderData) {
        // Navegação entre abas
        const tabs = document.querySelectorAll('.form-tab');
        const tabPanes = document.querySelectorAll('.tab-pane');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Remove classe ativa de todas as abas
                tabs.forEach(t => t.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                
                // Adiciona classe ativa na aba clicada
                tab.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });

        // Botões de navegação
        document.getElementById('prev-tab')?.addEventListener('click', () => {
            this.navigateTab(-1);
        });

        document.getElementById('next-tab')?.addEventListener('click', () => {
            this.navigateTab(1);
        });

        // Seleção de cliente
        document.getElementById('client-select')?.addEventListener('change', (e) => {
            this.updateClientInfo(e.target.value);
        });

        // Condição de água
        document.getElementById('condition-water')?.addEventListener('change', (e) => {
            document.getElementById('water-time-group').style.display = 
                e.target.checked ? 'block' : 'none';
        });

        // Calcular total
        document.getElementById('calculate-total')?.addEventListener('click', () => {
            this.calculateTotal();
        });

        // Atualiza total quando serviços ou valores mudam
        document.querySelectorAll('.service-item').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.calculateTotal();
            });
        });

        document.getElementById('service-value')?.addEventListener('input', () => {
            this.calculateTotal();
        });

        document.getElementById('discount')?.addEventListener('input', () => {
            this.calculateTotal();
        });

        // Assinatura digital
        this.setupSignatureCanvas();

        // Salvar ordem
        document.getElementById('save-order')?.addEventListener('click', async () => {
            await this.saveOrder(false);
        });

        // Salvar e imprimir
        document.getElementById('save-print-order')?.addEventListener('click', async () => {
            await this.saveOrder(true);
        });

        // Novo cliente
        document.getElementById('new-client-btn')?.addEventListener('click', () => {
            this.openNewClientModal();
        });

        // Carrega info do cliente se estiver editando
        if (orderData?.clientId) {
            this.updateClientInfo(orderData.clientId);
        }

        // Calcula total inicial
        this.calculateTotal();
    },

    navigateTab(direction) {
        const tabs = Array.from(document.querySelectorAll('.form-tab'));
        const currentTab = document.querySelector('.form-tab.active');
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = currentIndex + direction;

        if (nextIndex >= 0 && nextIndex < tabs.length) {
            tabs[nextIndex].click();
        }
    },

    updateClientInfo(clientId) {
        const client = this.allClients.find(c => c.id == clientId);
        const infoCard = document.getElementById('client-info-card');

        if (client) {
            document.getElementById('client-name').textContent = client.name;
            document.getElementById('client-phone').textContent = client.phone;
            document.getElementById('client-email').textContent = client.email;
            document.getElementById('client-signature').value = client.name;
            infoCard.style.display = 'block';
        } else {
            infoCard.style.display = 'none';
        }
    },

    calculateTotal() {
        // Soma dos serviços selecionados
        let servicesTotal = 0;
        document.querySelectorAll('.service-item:checked').forEach(checkbox => {
            const serviceId = parseInt(checkbox.value);
            const service = this.allServices.find(s => s.id === serviceId);
            if (service) {
                servicesTotal += service.price;
            }
        });

        // Valor manual ou soma dos serviços
        const manualValue = parseFloat(document.getElementById('service-value').value) || 0;
        const serviceValue = manualValue > 0 ? manualValue : servicesTotal;
        
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const total = serviceValue - discount;

        // Atualiza campos
        if (manualValue === 0 && servicesTotal > 0) {
            document.getElementById('service-value').value = servicesTotal.toFixed(2);
        }

        document.getElementById('total-value').value = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    setupSignatureCanvas() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let drawing = false;
        let lastX = 0;
        let lastY = 0;

        // Configura canvas
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Eventos do mouse
        canvas.addEventListener('mousedown', (e) => {
            drawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!drawing) return;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        });

        canvas.addEventListener('mouseup', () => drawing = false);
        canvas.addEventListener('mouseout', () => drawing = false);

        // Eventos touch para dispositivos móveis
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            drawing = true;
            [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
        });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!drawing) return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
            ctx.stroke();
            [lastX, lastY] = [touch.clientX - rect.left, touch.clientY - rect.top];
        });

        canvas.addEventListener('touchend', () => drawing = false);

        // Botão limpar
        document.getElementById('clear-signature')?.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    },

    async saveOrder(printAfterSave = false) {
        try {
            // Coleta dados do formulário
            const formData = this.collectFormData();
            
            // Validação
            if (!this.validateOrderForm(formData)) {
                return;
            }

            // Simula salvamento (em produção, salvaria no os.repo.js)
            const orderId = formData.id || `OS-${new Date().getFullYear()}-${String(this.currentData.length + 1).padStart(3, '0')}`;
            
            const order = {
                ...formData,
                id: orderId,
                updatedAt: new Date().toISOString()
            };

            // Adiciona/atualiza na lista
            if (formData.id) {
                const index = this.currentData.findIndex(o => o.id === formData.id);
                if (index !== -1) {
                    this.currentData[index] = order;
                }
            } else {
                order.createdAt = new Date().toISOString();
                this.currentData.push(order);
            }

            // Atualiza UI
            this.renderOrdersList();
            
            // Fecha modal
            closeModal();
            
            // Mostra notificação
            showNotification(`Ordem ${orderId} ${formData.id ? 'atualizada' : 'criada'} com sucesso!`, 'success');

            // Imprime se solicitado
            if (printAfterSave) {
                setTimeout(() => {
                    this.printOrder(orderId);
                }, 500);
            }

        } catch (error) {
            console.error('Erro ao salvar ordem:', error);
            showNotification('Erro ao salvar ordem de serviço', 'error');
        }
    },

    collectFormData() {
        // Coleta todos os dados do formulário
        const formData = {
            clientId: parseInt(document.getElementById('client-select').value),
            entryDate: document.getElementById('entry-date').value,
            device: document.getElementById('device-model').value,
            devicePassword: document.getElementById('device-password').value,
            
            // Condições iniciais
            conditionPowered: document.getElementById('condition-powered').checked,
            conditionRemoved: document.getElementById('condition-removed').checked,
            conditionMaintenance: document.getElementById('condition-maintenance').checked,
            conditionWater: document.getElementById('condition-water').checked,
            waterTime: document.getElementById('condition-water').checked ? 
                       document.getElementById('water-time').value : null,
            
            // Testes
            tests: {},
            allTestsPossible: document.getElementById('all-tests-possible').checked,
            testNotes: document.getElementById('test-notes').value,
            
            // Serviços
            services: Array.from(document.querySelectorAll('.service-item:checked')).map(cb => parseInt(cb.value)),
            serviceDescription: document.getElementById('service-description').value,
            
            // Valores
            serviceValue: parseFloat(document.getElementById('service-value').value) || 0,
            discount: parseFloat(document.getElementById('discount').value) || 0,
            totalValue: parseFloat(document.getElementById('total-value').value.replace('R$ ', '').replace(',', '.')) || 0,
            
            // Observações
            commercialNotes: document.getElementById('commercial-notes').value,
            technicalNotes: document.getElementById('technical-notes').value,
            
            // Termos
            agreedTerms: document.getElementById('agree-terms').checked,
            signatureDate: document.getElementById('signature-date').value,
            clientSignature: document.getElementById('client-signature').value,
            signatureData: this.getSignatureData()
        };

        // Coleta resultados dos testes
        const testElements = document.querySelectorAll('[name^="test-"]:checked');
        testElements.forEach(element => {
            const testId = element.name.replace('test-', '');
            formData.tests[testId] = element.value;
        });

        return formData;
    },

    validateOrderForm(formData) {
        const errors = [];

        if (!formData.clientId) {
            errors.push('Selecione um cliente');
        }

        if (!formData.device) {
            errors.push('Informe o modelo do aparelho');
        }

        if (!formData.entryDate) {
            errors.push('Informe a data de entrada');
        }

        if (!formData.agreedTerms) {
            errors.push('É necessário concordar com os termos');
        }

        if (errors.length > 0) {
            showNotification(errors.join(', '), 'error');
            return false;
        }

        return true;
    },

    getSignatureData() {
        const canvas = document.getElementById('signature-canvas');
        if (!canvas) return null;
        return canvas.toDataURL();
    },

    async viewOrder(orderId) {
        const order = this.currentData.find(o => o.id === orderId);
        if (!order) return;

        const modalContent = document.createElement('div');
        modalContent.className = 'order-view-modal';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-eye"></i> Visualizar Ordem ${orderId}</h2>
                <div class="header-actions">
                    <button class="btn btn-icon" onclick="this.printOrder('${orderId}')">
                        <i class="fas fa-print"></i>
                    </button>
                    <button class="btn btn-icon modal-close" onclick="closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="modal-body">
                <div class="order-details">
                    ${this.renderOrderDetails(order)}
                </div>
            </div>

            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i> Fechar
                </button>
                <button class="btn btn-primary" onclick="this.editOrder('${orderId}'); closeModal();">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        `;

        openModal(modalContent);
    },

    renderOrderDetails(order) {
        // Busca informações completas
        const client = this.allClients.find(c => c.id === order.clientId);
        const services = order.services.map(id => 
            this.allServices.find(s => s.id === id)
        ).filter(s => s);

        return `
            <div class="details-grid">
                <div class="detail-section">
                    <h3><i class="fas fa-user"></i> Dados do Cliente</h3>
                    <div class="detail-item">
                        <span class="detail-label">Cliente:</span>
                        <span class="detail-value">${client?.name || 'Não encontrado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Telefone:</span>
                        <span class="detail-value">${client?.phone || 'Não informado'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${client?.email || 'Não informado'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-mobile-alt"></i> Dados do Aparelho</h3>
                    <div class="detail-item">
                        <span class="detail-label">Modelo:</span>
                        <span class="detail-value">${order.device}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Data de Entrada:</span>
                        <span class="detail-value">${this.formatDate(order.entryDate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Senha:</span>
                        <span class="detail-value">${order.devicePassword || 'Sem senha'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-tools"></i> Serviços</h3>
                    <div class="services-list">
                        ${services.map(service => `
                            <div class="service-detail">
                                <i class="fas fa-check"></i>
                                <span>${service.name}</span>
                                <span class="service-price">R$ ${service.price.toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Valor Total:</span>
                        <span class="detail-value total">R$ ${order.serviceValue?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3><i class="fas fa-clipboard-check"></i> Status</h3>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="badge ${this.getStatusBadgeClass(order.status)}">
                                ${this.getStatusText(order.status)}
                            </span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Criado em:</span>
                        <span class="detail-value">${this.formatDateTime(order.createdAt)}</span>
                    </div>
                    ${order.updatedAt ? `
                        <div class="detail-item">
                            <span class="detail-label">Atualizado em:</span>
                            <span class="detail-value">${this.formatDateTime(order.updatedAt)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },

    async editOrder(orderId) {
        const order = this.currentData.find(o => o.id === orderId);
        if (order) {
            this.openOrderModal(order);
        }
    },

    async printOrder(orderId) {
        const order = this.currentData.find(o => o.id === orderId);
        if (!order) return;

        // Cria uma nova janela para impressão
        const printWindow = window.open('', '_blank');
        
        // Busca informações completas
        const client = this.allClients.find(c => c.id === order.clientId);
        const services = order.services.map(id => 
            this.allServices.find(s => s.id === id)
        ).filter(s => s);

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Ordem de Serviço ${orderId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                    .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .print-header h1 { color: #F57C00; margin: 0; }
                    .print-header .subtitle { color: #666; }
                    .section { margin-bottom: 25px; }
                    .section-title { background: #f5f5f5; padding: 8px 12px; font-weight: bold; border-left: 4px solid #F57C00; }
                    .row { display: flex; margin-bottom: 8px; }
                    .label { font-weight: bold; width: 200px; }
                    .value { flex: 1; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th { background: #f5f5f5; text-align: left; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 10px; border: 1px solid #ddd; }
                    .total-row { font-weight: bold; background: #f9f9f9; }
                    .signature-box { margin-top: 50px; padding-top: 20px; border-top: 1px solid #000; text-align: center; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
                    @media print {
                        .no-print { display: none; }
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <button class="no-print" onclick="window.print()" style="position: fixed; top: 20px; right: 20px; padding: 10px 20px; background: #F57C00; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Imprimir
                </button>

                <div class="print-header">
                    <h1>ORDEM DE SERVIÇO</h1>
                    <div class="subtitle">
                        <strong>Número:</strong> ${orderId} | 
                        <strong>Data:</strong> ${this.formatDate(order.entryDate)}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">DADOS DO CLIENTE</div>
                    <div class="row"><div class="label">Cliente:</div><div class="value">${client?.name || 'Não informado'}</div></div>
                    <div class="row"><div class="label">Telefone:</div><div class="value">${client?.phone || 'Não informado'}</div></div>
                    <div class="row"><div class="label">Email:</div><div class="value">${client?.email || 'Não informado'}</div></div>
                </div>

                <div class="section">
                    <div class="section-title">DADOS DO APARELHO</div>
                    <div class="row"><div class="label">Modelo:</div><div class="value">${order.device}</div></div>
                    <div class="row"><div class="label">Senha:</div><div class="value">${order.devicePassword || 'Sem senha'}</div></div>
                </div>

                <div class="section">
                    <div class="section-title">SERVIÇOS SOLICITADOS</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Valor (R$)</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${services.map(service => `
                                <tr>
                                    <td>${service.name}</td>
                                    <td>${service.price.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td><strong>TOTAL</strong></td>
                                <td><strong>R$ ${order.serviceValue?.toFixed(2) || '0.00'}</strong></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="section">
                    <div class="section-title">TERMOS E CONDIÇÕES</div>
                    <p>1. Prazo estimado: 15 dias úteis</p>
                    <p>2. Garantia: 90 dias para serviços executados</p>
                    <p>3. Aparelhos não retirados em 30 dias serão considerados abandonados</p>
                    <p>4. A iFix não se responsabiliza por dados perdidos</p>
                </div>

                <div class="signature-box">
                    <p>_________________________________________</p>
                    <p>Assinatura do Cliente</p>
                    <p>Nome: ${client?.name || ''}</p>
                    <p>Data: ${this.formatDate(order.entryDate)}</p>
                </div>

                <div class="footer">
                    <p>iFix Assistência Técnica | CNPJ: 00.000.000/0000-00</p>
                    <p>Endereço: Rua Exemplo, 123 - Centro - Cidade/Estado</p>
                    <p>Telefone: (11) 3333-3333 | www.ifix.com.br</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    };
                </script>
            </body>
            </html>
        `);

        printWindow.document.close();
    },

    printSelectedOrders() {
        const selectedOrders = Array.from(document.querySelectorAll('.order-checkbox:checked'))
            .map(checkbox => checkbox.value);

        if (selectedOrders.length === 0) {
            showNotification('Selecione pelo menos uma ordem para imprimir', 'warning');
            return;
        }

        // Para múltiplas ordens, podemos gerar um PDF ou abrir várias janelas
        selectedOrders.forEach(orderId => {
            this.printOrder(orderId);
        });
    },

    filterOrders(searchTerm) {
        if (!this.currentData) return;

        const filtered = this.currentData.filter(order => {
            return order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   order.device.toLowerCase().includes(searchTerm.toLowerCase());
        });

        this.renderFilteredOrders(filtered);
    },

    renderFilteredOrders(filteredOrders) {
        const tbody = document.getElementById('orders-table-body');
        if (!tbody) return;

        tbody.innerHTML = filteredOrders.map(order => this.renderOrderRow(order)).join('');
        this.setupRowEvents();
    },

    applyFilters() {
        const status = document.getElementById('filter-status').value;
        const date = document.getElementById('filter-date').value;

        let filtered = this.currentData;

        if (status) {
            filtered = filtered.filter(order => order.status === status);
        }

        if (date) {
            filtered = filtered.filter(order => this.filterByDate(order, date));
        }

        this.renderFilteredOrders(filtered);
    },

    filterByDate(order, filterType) {
        const orderDate = new Date(order.entryDate);
        const today = new Date();

        switch(filterType) {
            case 'today':
                return orderDate.toDateString() === today.toDateString();
            case 'week':
                const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                return orderDate >= weekAgo;
            case 'month':
                const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                return orderDate >= monthAgo;
            case 'last-month':
                const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                return orderDate >= startLastMonth && orderDate <= endLastMonth;
            default:
                return true;
        }
    },

    openNewClientModal() {
        // Em produção, integrar com o CRM
        showNotification('Redirecionando para cadastro de cliente...', 'info');
        
        // Simplesmente muda para a página de CRM
        setTimeout(() => {
            window.App.loadPage('crm');
            closeModal();
        }, 1000);
    },

    // Métodos utilitários
    getTodayDate() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    },

    getCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    },

    formatDate(dateString) {
        if (!dateString) return 'Não informado';
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    },

    formatDateTime(dateTimeString) {
        if (!dateTimeString) return 'Não informado';
        const date = new Date(dateTimeString);
        return date.toLocaleString('pt-BR');
    },

    getClientPhone(clientId) {
        const client = this.allClients.find(c => c.id === clientId);
        return client?.phone || 'Não informado';
    },

    getStatusBadgeClass(status) {
        const classes = {
            'aberto': 'badge-blue',
            'andamento': 'badge-orange',
            'aguardando': 'badge-yellow',
            'finalizado': 'badge-green',
            'entregue': 'badge-gray'
        };
        return classes[status] || 'badge-gray';
    },

    getStatusText(status) {
        const texts = {
            'aberto': 'Em aberto',
            'andamento': 'Em andamento',
            'aguardando': 'Aguardando peças',
            'finalizado': 'Finalizado',
            'entregue': 'Entregue'
        };
        return texts[status] || status;
    }
};

export default OrderServicePage;