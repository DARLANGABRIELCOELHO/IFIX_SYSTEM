// components/crm.js
window.CRMModule = (function() {
    let selectedClientId = null;
    
    const module = {
        render() {
            return `
                <div class="crm-module">
                    <div class="module-header">
                        <h2>CRM - Clientes</h2>
                        <div class="header-actions">
                            <button id="newClientBtn" class="btn btn-primary">
                                <span>➕ Novo Cliente</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12 col-md-8">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Lista de Clientes</h3>
                                    <div class="search-box">
                                        <input type="text" id="clientSearch" class="form-control" 
                                               placeholder="Buscar por nome, CPF, telefone...">
                                        <span>🔍</span>
                                    </div>
                                </div>
                                <div class="table-container">
                                    <table id="clientsTable">
                                        <thead>
                                            <tr>
                                                <th>Nome</th>
                                                <th>Documento</th>
                                                <th>Telefone</th>
                                                <th>Data Cadastro</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="clientsTableBody">
                                            <!-- Dados carregados dinamicamente -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 col-md-4">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Cadastro Rápido</h3>
                                </div>
                                <div class="card-body">
                                    <form id="quickClientForm">
                                        <div class="form-group">
                                            <label class="form-label">Nome Completo *</label>
                                            <input type="text" id="clientName" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Documento (CPF/CNPJ)</label>
                                            <input type="text" id="clientDocument" class="form-control">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Telefone (WhatsApp) *</label>
                                            <input type="tel" id="clientPhone" class="form-control" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">E-mail</label>
                                            <input type="email" id="clientEmail" class="form-control">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Endereço</label>
                                            <input type="text" id="clientAddress" class="form-control" 
                                                   placeholder="Digite o endereço...">
                                        </div>
                                        <div class="form-actions">
                                            <button type="submit" class="btn btn-primary">Salvar Cliente</button>
                                            <button type="button" id="clearFormBtn" class="btn btn-secondary">Limpar</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Modal de Detalhes do Cliente -->
                    <div id="clientModal" class="modal">
                        <div class="modal-overlay"></div>
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3>Detalhes do Cliente</h3>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body" id="clientModalBody">
                                <!-- Conteúdo dinâmico -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        initialize() {
            this.loadClients();
            this.setupEventListeners();
        },
        
        loadClients(search = '') {
            const clients = window.crmData.getClients(search);
            const tbody = document.getElementById('clientsTableBody');
            
            if (clients.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center">Nenhum cliente encontrado</td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = clients.map(client => `
                <tr>
                    <td><strong>${client.name || 'N/A'}</strong></td>
                    <td>${client.document || 'N/A'}</td>
                    <td>
                        <div>${client.phone || 'N/A'}</div>
                        ${client.email ? `<small>${client.email}</small>` : ''}
                    </td>
                    <td>${this.formatDate(client.createdAt)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-client" data-id="${client.id}">
                            👁️ Perfil
                        </button>
                        <button class="btn btn-sm btn-secondary edit-client" data-id="${client.id}">
                            ✏️ Editar
                        </button>
                    </td>
                </tr>
            `).join('');
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        },
        
        setupEventListeners() {
            // Busca de clientes
            const searchInput = document.getElementById('clientSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    this.loadClients(e.target.value);
                });
            }
            
            // Novo cliente
            const newClientBtn = document.getElementById('newClientBtn');
            if (newClientBtn) {
                newClientBtn.addEventListener('click', () => {
                    this.openClientModal();
                });
            }
            
            // Formulário rápido
            const quickClientForm = document.getElementById('quickClientForm');
            if (quickClientForm) {
                quickClientForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveClient();
                });
            }
            
            // Limpar formulário
            const clearFormBtn = document.getElementById('clearFormBtn');
            if (clearFormBtn) {
                clearFormBtn.addEventListener('click', () => {
                    document.getElementById('quickClientForm').reset();
                });
            }
            
            // Delegar eventos para os botões de ação na tabela
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-client') || 
                    e.target.parentElement.classList.contains('view-client')) {
                    const clientId = e.target.dataset.id || e.target.parentElement.dataset.id;
                    this.viewClientDetails(clientId);
                }
                
                if (e.target.classList.contains('edit-client') || 
                    e.target.parentElement.classList.contains('edit-client')) {
                    const clientId = e.target.dataset.id || e.target.parentElement.dataset.id;
                    this.editClient(clientId);
                }
            });
            
            // Auto-complete de endereço
            const addressInput = document.getElementById('clientAddress');
            if (addressInput) {
                addressInput.addEventListener('input', this.handleAddressAutocomplete);
            }
        },
        
        handleAddressAutocomplete(e) {
            // Em produção, integrar com API de CEP
            const value = e.target.value;
            if (value.length > 5) {
                // Simular sugestões
                console.log('Buscando endereços para:', value);
            }
        },
        
        saveClient() {
            const clientData = {
                name: document.getElementById('clientName').value,
                document: document.getElementById('clientDocument').value,
                phone: document.getElementById('clientPhone').value,
                email: document.getElementById('clientEmail').value,
                address: document.getElementById('clientAddress').value,
                totalSpent: 0,
                maintenanceHistory: []
            };
            
            const result = window.crmData.addClient(clientData);
            
            if (result) {
                alert('Cliente salvo com sucesso!');
                this.loadClients();
                document.getElementById('quickClientForm').reset();
            } else {
                alert('Erro ao salvar cliente');
            }
        },
        
        viewClientDetails(clientId) {
            const client = window.crmData.clients.find(c => c.id === clientId);
            if (!client) return;
            
            const modalBody = document.getElementById('clientModalBody');
            modalBody.innerHTML = `
                <div class="client-details">
                    <div class="detail-section">
                        <div class="section-header">
                            <h4>Dados Pessoais</h4>
                            <button class="btn btn-sm btn-primary" onclick="CRMModule.editClient('${clientId}')">
                                Editar
                            </button>
                        </div>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Nome:</strong> ${client.name || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Documento:</strong> ${client.document || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Telefone:</strong> ${client.phone || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>E-mail:</strong> ${client.email || 'N/A'}
                            </div>
                            <div class="detail-item">
                                <strong>Endereço:</strong> ${client.address || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Total Gasto: R$ ${client.totalSpent?.toFixed(2) || '0,00'}</h4>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Histórico de Manutenção</h4>
                        <div class="history-list">
                            ${this.renderMaintenanceHistory(client.maintenanceHistory || [])}
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-primary" onclick="window.print()">📄 Imprimir Ficha</button>
                        <button class="btn btn-secondary close-modal">Fechar</button>
                    </div>
                </div>
            `;
            
            this.openModal();
        },
        
        renderMaintenanceHistory(history) {
            if (history.length === 0) {
                return '<p class="text-center">Nenhuma manutenção registrada</p>';
            }
            
            return history.map(item => `
                <div class="history-item">
                    <div class="history-date">${this.formatDate(item.date)}</div>
                    <div class="history-service">${item.service || 'Serviço não especificado'}</div>
                    <div class="history-value">R$ ${item.value?.toFixed(2) || '0,00'}</div>
                    ${item.osLink ? `<a href="#" class="history-link" data-os="${item.osLink}">Ver OS</a>` : ''}
                </div>
            `).join('');
        },
        
        editClient(clientId) {
            const client = window.crmData.clients.find(c => c.id === clientId);
            if (!client) return;
            
            selectedClientId = clientId;
            
            const modalBody = document.getElementById('clientModalBody');
            modalBody.innerHTML = `
                <div class="client-edit-form">
                    <h4>Editar Cliente</h4>
                    <form id="editClientForm">
                        <div class="form-group">
                            <label class="form-label">Nome Completo *</label>
                            <input type="text" id="editClientName" class="form-control" 
                                   value="${client.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Documento (CPF/CNPJ)</label>
                            <input type="text" id="editClientDocument" class="form-control" 
                                   value="${client.document || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone (WhatsApp) *</label>
                            <input type="tel" id="editClientPhone" class="form-control" 
                                   value="${client.phone || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">E-mail</label>
                            <input type="email" id="editClientEmail" class="form-control" 
                                   value="${client.email || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Endereço</label>
                            <input type="text" id="editClientAddress" class="form-control" 
                                   value="${client.address || ''}">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Atualizar</button>
                            <button type="button" class="btn btn-secondary cancel-edit">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Configurar eventos do formulário de edição
            const editForm = document.getElementById('editClientForm');
            if (editForm) {
                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.updateClient();
                });
            }
            
            document.querySelector('.cancel-edit').addEventListener('click', () => {
                this.viewClientDetails(clientId);
            });
            
            this.openModal();
        },
        
        updateClient() {
            const clientData = {
                name: document.getElementById('editClientName').value,
                document: document.getElementById('editClientDocument').value,
                phone: document.getElementById('editClientPhone').value,
                email: document.getElementById('editClientEmail').value,
                address: document.getElementById('editClientAddress').value
            };
            
            const result = window.crmData.updateClient(selectedClientId, clientData);
            
            if (result) {
                alert('Cliente atualizado com sucesso!');
                this.loadClients();
                this.closeModal();
            } else {
                alert('Erro ao atualizar cliente');
            }
        },
        
        openClientModal() {
            const modalBody = document.getElementById('clientModalBody');
            modalBody.innerHTML = `
                <div class="client-edit-form">
                    <h4>Novo Cliente</h4>
                    <form id="newClientFormModal">
                        <div class="form-group">
                            <label class="form-label">Nome Completo *</label>
                            <input type="text" id="newClientName" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Documento (CPF/CNPJ)</label>
                            <input type="text" id="newClientDocument" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Telefone (WhatsApp) *</label>
                            <input type="tel" id="newClientPhone" class="form-control" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">E-mail</label>
                            <input type="email" id="newClientEmail" class="form-control">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Endereço</label>
                            <input type="text" id="newClientAddress" class="form-control">
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Salvar</button>
                            <button type="button" class="btn btn-secondary cancel-new">Cancelar</button>
                        </div>
                    </form>
                </div>
            `;
            
            // Configurar eventos do formulário novo
            const newForm = document.getElementById('newClientFormModal');
            if (newForm) {
                newForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveClientFromModal();
                });
            }
            
            document.querySelector('.cancel-new').addEventListener('click', () => {
                this.closeModal();
            });
            
            this.openModal();
        },
        
        saveClientFromModal() {
            const clientData = {
                name: document.getElementById('newClientName').value,
                document: document.getElementById('newClientDocument').value,
                phone: document.getElementById('newClientPhone').value,
                email: document.getElementById('newClientEmail').value,
                address: document.getElementById('newClientAddress').value,
                totalSpent: 0,
                maintenanceHistory: []
            };
            
            const result = window.crmData.addClient(clientData);
            
            if (result) {
                alert('Cliente salvo com sucesso!');
                this.loadClients();
                this.closeModal();
            } else {
                alert('Erro ao salvar cliente');
            }
        },
        
        openModal() {
            const modal = document.getElementById('clientModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Configurar botão de fechar
            modal.querySelector('.modal-close').addEventListener('click', () => {
                this.closeModal();
            });
            
            modal.querySelector('.modal-overlay').addEventListener('click', () => {
                this.closeModal();
            });
        },
        
        closeModal() {
            const modal = document.getElementById('clientModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            selectedClientId = null;
        }
    };
    
    return module;
})();