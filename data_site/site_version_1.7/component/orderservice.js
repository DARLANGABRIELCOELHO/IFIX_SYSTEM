// components/orderservice.js
window.OrderServiceModule = (function() {
    let selectedOSId = null;
    
    const module = {
        render() {
            return `
                <div class="os-module">
                    <div class="module-header">
                        <h2>Ordem de Serviço</h2>
                        <div class="header-actions">
                            <button id="newOSBtn" class="btn btn-primary">
                                <span>➕ Nova OS</span>
                            </button>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="card">
                                <div class="card-header">
                                    <h3 class="card-title">Ordens de Serviço</h3>
                                    <div class="card-filters">
                                        <div class="search-box">
                                            <input type="text" id="osSearch" class="form-control" 
                                                   placeholder="Buscar por ID, CPF, telefone...">
                                            <span>🔍</span>
                                        </div>
                                        <select id="statusFilter" class="form-control">
                                            <option value="">Todos os status</option>
                                            <option value="aguardando_analise">Aguardando análise</option>
                                            <option value="em_analise">Em análise</option>
                                            <option value="aguardando_aprovacao">Aguardando aprovação</option>
                                            <option value="em_manutencao">Em manutenção</option>
                                            <option value="pronto">Pronto</option>
                                            <option value="entregue">Entregue</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="table-container">
                                    <table id="osTable">
                                        <thead>
                                            <tr>
                                                <th>Protocolo</th>
                                                <th>Cliente</th>
                                                <th>Equipamento</th>
                                                <th>Status</th>
                                                <th>Data Entrada</th>
                                                <th>Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody id="osTableBody">
                                            <!-- Dados carregados dinamicamente -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Modal de Detalhes da OS -->
                    <div id="osModal" class="modal">
                        <div class="modal-overlay"></div>
                        <div class="modal-content wide-modal">
                            <div class="modal-header">
                                <h3>Detalhes da Ordem de Serviço</h3>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body" id="osModalBody">
                                <!-- Conteúdo dinâmico -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- Modal de Nova OS -->
                    <div id="newOSModal" class="modal">
                        <div class="modal-overlay"></div>
                        <div class="modal-content extra-wide-modal">
                            <div class="modal-header">
                                <h3>Nova Ordem de Serviço</h3>
                                <button class="modal-close">&times;</button>
                            </div>
                            <div class="modal-body">
                                <form id="newOSForm">
                                    <div class="os-form-container">
                                        <!-- O formulário será carregado aqui -->
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        initialize() {
            this.loadOS();
            this.setupEventListeners();
        },
        
        loadOS(search = '', status = '') {
            const orders = window.osData.getOrders({ search, status });
            const tbody = document.getElementById('osTableBody');
            
            if (orders.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center">Nenhuma ordem de serviço encontrada</td>
                    </tr>
                `;
                return;
            }
            
            tbody.innerHTML = orders.map(order => `
                <tr>
                    <td><strong>${order.protocol || order.id}</strong></td>
                    <td>
                        <div>${order.clientName || 'N/A'}</div>
                        <small>${order.clientPhone || ''}</small>
                    </td>
                    <td>${order.deviceModel || 'N/A'}</td>
                    <td>
                        <span class="badge badge-${this.getStatusColor(order.status)}">
                            ${this.getStatusText(order.status)}
                        </span>
                    </td>
                    <td>${this.formatDate(order.createdAt)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary view-os" data-id="${order.id}">
                            👁️ Ver
                        </button>
                        <button class="btn btn-sm btn-secondary edit-os" data-id="${order.id}">
                            ✏️ Editar
                        </button>
                    </td>
                </tr>
            `).join('');
        },
        
        getStatusColor(status) {
            const statusMap = {
                'aguardando_analise': 'warning',
                'em_analise': 'info',
                'aguardando_aprovacao': 'warning',
                'em_manutencao': 'orange',
                'pronto': 'success',
                'entregue': 'gray'
            };
            return statusMap[status] || 'gray';
        },
        
        getStatusText(status) {
            const statusMap = {
                'aguardando_analise': 'Aguardando análise',
                'em_analise': 'Em análise',
                'aguardando_aprovacao': 'Aguardando aprovação',
                'em_manutencao': 'Em manutenção',
                'pronto': 'Pronto',
                'entregue': 'Entregue'
            };
            return statusMap[status] || 'Desconhecido';
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        },
        
        setupEventListeners() {
            // Busca de OS
            const searchInput = document.getElementById('osSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const status = document.getElementById('statusFilter').value;
                    this.loadOS(e.target.value, status);
                });
            }
            
            // Filtro de status
            const statusFilter = document.getElementById('statusFilter');
            if (statusFilter) {
                statusFilter.addEventListener('change', (e) => {
                    const search = document.getElementById('osSearch').value;
                    this.loadOS(search, e.target.value);
                });
            }
            
            // Nova OS
            const newOSBtn = document.getElementById('newOSBtn');
            if (newOSBtn) {
                newOSBtn.addEventListener('click', () => {
                    this.openNewOSModal();
                });
            }
            
            // Delegar eventos para os botões de ação na tabela
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('view-os') || 
                    e.target.parentElement.classList.contains('view-os')) {
                    const osId = e.target.dataset.id || e.target.parentElement.dataset.id;
                    this.viewOSDetails(osId);
                }
                
                if (e.target.classList.contains('edit-os') || 
                    e.target.parentElement.classList.contains('edit-os')) {
                    const osId = e.target.dataset.id || e.target.parentElement.dataset.id;
                    this.editOS(osId);
                }
            });
            
            // Configurar modais
            this.setupModalCloseListeners();
        },
        
        viewOSDetails(osId) {
            const order = window.osData.orders.find(o => o.id === osId);
            if (!order) return;
            
            const modalBody = document.getElementById('osModalBody');
            modalBody.innerHTML = `
                <div class="os-details">
                    <div class="row">
                        <div class="col-12 col-md-6">
                            <div class="detail-section">
                                <h4>📋 Ficha do Cliente</h4>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Nome:</strong> ${order.clientName || 'N/A'}
                                    </div>
                                    <div class="detail-item">
                                        <strong>WhatsApp:</strong> ${order.clientPhone || 'N/A'}
                                    </div>
                                    <div class="detail-item">
                                        <strong>CPF:</strong> ${order.clientDocument || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 col-md-6">
                            <div class="detail-section">
                                <h4>🔄 Controle de Status</h4>
                                <div class="form-group">
                                    <label class="form-label">Status Atual</label>
                                    <select id="updateStatus" class="form-control">
                                        ${window.osData.statusOptions.map(status => `
                                            <option value="${status.id}" ${order.status === status.id ? 'selected' : ''}>
                                                ${status.name}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Equipamento</label>
                                    <input type="text" id="updateDeviceModel" class="form-control" 
                                           value="${order.deviceModel || ''}">
                                </div>
                                <button id="saveStatusBtn" class="btn btn-primary">Atualizar</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📝 Laudo de Entrada (Checklist)</h4>
                        <div class="checklist-grid">
                            ${this.renderChecklist(order.checklist || {})}
                        </div>
                    </div>
                    
                    <div class="detail-section">
                        <h4>🔧 Defeito e Diagnóstico Preliminar</h4>
                        <div class="form-group">
                            <label class="form-label">Serviços:</label>
                            <div class="services-list">
                                ${(order.services || []).map(service => `<span class="service-tag">${service}</span>`).join('')}
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Notas Internas:</label>
                            <p>${order.internalNotes || 'Nenhuma nota interna.'}</p>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Total Estimado:</label>
                            <h3>R$ ${order.serviceValue?.toFixed(2) || '0,00'}</h3>
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button id="markAsReadyBtn" class="btn btn-success" 
                                ${order.status === 'pronto' ? 'disabled' : ''}>
                            ✅ Marcar como Pronto
                        </button>
                        <button id="deliverDeviceBtn" class="btn btn-primary" 
                                ${order.status !== 'pronto' ? 'disabled' : ''}>
                            📦 Entregar Aparelho
                        </button>
                        <button id="printOSBtn" class="btn btn-secondary">🖨️ Imprimir OS</button>
                    </div>
                </div>
            `;
            
            // Configurar eventos dos botões
            selectedOSId = osId;
            this.setupOSModalEvents(order);
            this.openOSModal();
        },
        
        renderChecklist(checklist) {
            const checklistItems = [
                { key: 'wifi', label: 'Wi-Fi' },
                { key: 'bluetooth', label: 'Bluetooth' },
                { key: 'vibration_motor', label: 'Motor vibra' },
                { key: 'flash', label: 'Flash' },
                { key: 'screen_touch', label: 'Tela / Touch' },
                { key: 'proximity_sensor', label: 'Sensor de presença' },
                { key: 'fingerprint', label: 'Digital (biometria)' },
                { key: 'sim_calling', label: 'Chip / Ligação' },
                { key: 'charging_port', label: 'Conector de carga' },
                { key: 'microphone', label: 'Microfone' },
                { key: 'front_camera', label: 'Câmera frontal' },
                { key: 'power_volume_buttons', label: 'Botão power e volume' },
                { key: 'network_3g', label: 'Conexão 3G' },
                { key: 'rear_camera', label: 'Câmera traseira' },
                { key: 'earpiece_speaker', label: 'Alto-falante auricular' }
            ];
            
            return checklistItems.map(item => `
                <div class="checklist-item">
                    <strong>${item.label}:</strong>
                    <span class="checklist-value ${checklist[item.key] === 'OK' ? 'check-ok' : 'check-nok'}">
                        ${checklist[item.key] || 'N/A'}
                    </span>
                </div>
            `).join('');
        },
        
        setupOSModalEvents(order) {
            // Atualizar status
            const saveStatusBtn = document.getElementById('saveStatusBtn');
            if (saveStatusBtn) {
                saveStatusBtn.addEventListener('click', () => {
                    const newStatus = document.getElementById('updateStatus').value;
                    const deviceModel = document.getElementById('updateDeviceModel').value;
                    this.updateOSStatus(newStatus, deviceModel);
                });
            }
            
            // Marcar como pronto
            const markAsReadyBtn = document.getElementById('markAsReadyBtn');
            if (markAsReadyBtn) {
                markAsReadyBtn.addEventListener('click', () => {
                    this.markAsReady();
                });
            }
            
            // Entregar aparelho
            const deliverDeviceBtn = document.getElementById('deliverDeviceBtn');
            if (deliverDeviceBtn) {
                deliverDeviceBtn.addEventListener('click', () => {
                    this.deliverDevice();
                });
            }
            
            // Imprimir OS
            const printOSBtn = document.getElementById('printOSBtn');
            if (printOSBtn) {
                printOSBtn.addEventListener('click', () => {
                    this.printOS(order);
                });
            }
        },
        
        updateOSStatus(newStatus, deviceModel) {
            if (!selectedOSId) return;
            
            const updates = { 
                status: newStatus,
                deviceModel: deviceModel 
            };
            
            const result = window.osData.updateOrder(selectedOSId, updates);
            
            if (result) {
                alert('Status atualizado com sucesso!');
                this.loadOS();
                this.closeOSModal();
            } else {
                alert('Erro ao atualizar status');
            }
        },
        
        markAsReady() {
            if (!selectedOSId) return;
            
            const result = window.osData.updateOrder(selectedOSId, { status: 'pronto' });
            
            if (result) {
                alert('OS marcada como pronta!');
                this.loadOS();
                this.closeOSModal();
            } else {
                alert('Erro ao atualizar OS');
            }
        },
        
        deliverDevice() {
            if (!selectedOSId) return;
            
            const result = window.osData.updateOrder(selectedOSId, { status: 'entregue' });
            
            if (result) {
                alert('Aparelho marcado como entregue!');
                this.loadOS();
                this.closeOSModal();
            } else {
                alert('Erro ao atualizar OS');
            }
        },
        
        printOS(order) {
            // Em uma aplicação real, isso geraria um PDF
            // Por enquanto, apenas abrimos uma nova janela com os dados formatados
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                    <head>
                        <title>OS ${order.protocol || order.id}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .header { text-align: center; margin-bottom: 30px; }
                            .section { margin-bottom: 20px; }
                            .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                            .footer { margin-top: 50px; text-align: center; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h1>Ordem de Serviço - IFIX</h1>
                            <h2>${order.protocol || order.id}</h2>
                        </div>
                        
                        <div class="section">
                            <h3>Dados do Cliente</h3>
                            <div class="grid">
                                <div><strong>Nome:</strong> ${order.clientName || 'N/A'}</div>
                                <div><strong>Telefone:</strong> ${order.clientPhone || 'N/A'}</div>
                                <div><strong>CPF:</strong> ${order.clientDocument || 'N/A'}</div>
                                <div><strong>Data:</strong> ${this.formatDate(order.createdAt)}</div>
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Aparelho</h3>
                            <p><strong>Modelo:</strong> ${order.deviceModel || 'N/A'}</p>
                            <p><strong>Senha:</strong> ${order.devicePassword || 'Não informada'}</p>
                        </div>
                        
                        <div class="section">
                            <h3>Serviços</h3>
                            <ul>
                                ${order.services ? order.services.map(s => `<li>${s}</li>`).join('') : '<li>Nenhum serviço especificado</li>'}
                            </ul>
                        </div>
                        
                        <div class="section">
                            <h3>Checklist de Entrada</h3>
                            <div class="grid">
                                ${Object.entries(order.checklist || {}).map(([key, value]) => `
                                    <div><strong>${key}:</strong> ${value}</div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="section">
                            <h3>Valor</h3>
                            <p><strong>Total:</strong> R$ ${order.serviceValue?.toFixed(2) || '0,00'}</p>
                        </div>
                        
                        <div class="footer">
                            <p>_________________________________</p>
                            <p>Assinatura do Cliente</p>
                            <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        
                        <script>
                            window.onload = function() {
                                window.print();
                            }
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        },
        
        openNewOSModal() {
            const formContainer = document.querySelector('#newOSForm .os-form-container');
            formContainer.innerHTML = this.renderNewOSForm();
            this.setupNewOSFormEvents();
            this.openNewOSModalWindow();
        },
        
        renderNewOSForm() {
            return `
                <div class="row">
                    <div class="col-12 col-md-6">
                        <div class="form-section">
                            <h4>📱 Dados do Cliente</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Buscar Cliente Existente</label>
                                <select id="existingClient" class="form-control">
                                    <option value="">Selecione um cliente...</option>
                                    ${window.crmData.clients.map(client => `
                                        <option value="${client.id}">
                                            ${client.name} - ${client.phone}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Nome Completo *</label>
                                <input type="text" id="clientName" class="form-control" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Telefone (WhatsApp) *</label>
                                <input type="tel" id="clientPhone" class="form-control" required>
                            </div>

                            <div class="form-group">
                                <label class="form-label">CPF/CNPJ</label>
                                <input type="text" id="clientDocument" class="form-control">
                            </div>
                        </div>
                    </div>

                    <div class="col-12 col-md-6">
                        <div class="form-section">
                            <h4>📲 Dados do Aparelho</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Modelo do iPhone *</label>
                                <select id="deviceModel" class="form-control" required>
                                    <option value="">Selecione o modelo...</option>
                                    ${window.phoneData.models.map(model => `
                                        <option value="${model}">${model}</option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Senha do Aparelho</label>
                                <input type="text" id="devicePassword" class="form-control">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Data de Entrada</label>
                                <input type="date" id="entryDate" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="form-section">
                            <h4>🔍 Condições Iniciais do Aparelho</h4>
                            
                            <div class="row">
                                <div class="col-12 col-md-3">
                                    <div class="form-group">
                                        <label class="form-label">Chegou ligado?</label>
                                        <select id="arrivedOn" class="form-control">
                                            <option value="">Selecione</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Não">Não</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-3">
                                    <div class="form-group">
                                        <label class="form-label">Retirou chip e capinha?</label>
                                        <select id="removedCase" class="form-control">
                                            <option value="">Selecione</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Não">Não</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-3">
                                    <div class="form-group">
                                        <label class="form-label">Já passou por manutenção?</label>
                                        <select id="previousRepair" class="form-control">
                                            <option value="">Selecione</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Não">Não</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="col-12 col-md-3">
                                    <div class="form-group">
                                        <label class="form-label">Contato com água?</label>
                                        <select id="waterDamage" class="form-control">
                                            <option value="">Selecione</option>
                                            <option value="Sim">Sim</option>
                                            <option value="Não">Não</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group" id="waterTimeGroup" style="display: none;">
                                <label class="form-label">Há quanto tempo?</label>
                                <input type="text" id="waterTime" class="form-control">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="form-section">
                            <h4>✅ Testes de Entrada (Checklist Técnico)</h4>
                            
                            <div class="checklist-grid-form">
                                ${this.renderChecklistInputs()}
                            </div>

                            <div class="form-group">
                                <label class="form-label">Foi possível realizar todos os testes?</label>
                                <select id="allTestsCompleted" class="form-control">
                                    <option value="">Selecione</option>
                                    <option value="Sim">Sim</option>
                                    <option value="Não">Não</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12">
                        <div class="form-section">
                            <h4>🔧 Serviços e Diagnóstico</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Serviços Solicitados</label>
                                <select id="services" class="form-control" multiple style="height: 120px;">
                                    ${window.phoneData.services.map(service => `
                                        <option value="${service}">${service}</option>
                                    `).join('')}
                                </select>
                                <small class="form-hint">Pressione Ctrl para selecionar múltiplos serviços</small>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Diagnóstico Preliminar</label>
                                <textarea id="preliminaryDiagnosis" class="form-control" rows="3"></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Notas Internas</label>
                                <textarea id="internalNotes" class="form-control" rows="3"></textarea>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Observações</label>
                                <textarea id="observations" class="form-control" rows="3"></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-12 col-md-6">
                        <div class="form-section">
                            <h4>💰 Valores</h4>
                            
                            <div class="form-group">
                                <label class="form-label">Valor do Serviço (R$)</label>
                                <input type="number" id="serviceValue" class="form-control" step="0.01" min="0">
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">💾 Salvar OS</button>
                    <button type="button" class="btn btn-secondary cancel-new-os">❌ Cancelar</button>
                </div>
            `;
        },
        
        renderChecklistInputs() {
            const checklistItems = [
                { id: 'wifi', label: 'Wi-Fi' },
                { id: 'bluetooth', label: 'Bluetooth' },
                { id: 'vibration_motor', label: 'Motor vibra' },
                { id: 'flash', label: 'Flash' },
                { id: 'screen_touch', label: 'Tela / Touch' },
                { id: 'proximity_sensor', label: 'Sensor de presença' },
                { id: 'fingerprint', label: 'Digital (biometria)' },
                { id: 'sim_calling', label: 'Chip / Ligação' },
                { id: 'charging_port', label: 'Conector de carga' },
                { id: 'microphone', label: 'Microfone' },
                { id: 'front_camera', label: 'Câmera frontal' },
                { id: 'power_volume_buttons', label: 'Botão power e volume' },
                { id: 'network_3g', label: 'Conexão 3G' },
                { id: 'rear_camera', label: 'Câmera traseira' },
                { id: 'earpiece_speaker', label: 'Alto-falante auricular' }
            ];

            return checklistItems.map(item => `
                <div class="checklist-input">
                    <label>${item.label}</label>
                    <select id="checklist_${item.id}" class="form-control">
                        <option value="">Selecione</option>
                        <option value="OK">OK</option>
                        <option value="NOK">NOK</option>
                    </select>
                </div>
            `).join('');
        },
        
        setupNewOSFormEvents() {
            // Preencher dados do cliente existente
            const existingClientSelect = document.getElementById('existingClient');
            if (existingClientSelect) {
                existingClientSelect.addEventListener('change', (e) => {
                    const clientId = e.target.value;
                    if (clientId) {
                        const client = window.crmData.clients.find(c => c.id === clientId);
                        if (client) {
                            document.getElementById('clientName').value = client.name;
                            document.getElementById('clientPhone').value = client.phone;
                            document.getElementById('clientDocument').value = client.document || '';
                        }
                    }
                });
            }
            
            // Mostrar/ocultar campo de tempo de contato com água
            const waterDamageSelect = document.getElementById('waterDamage');
            if (waterDamageSelect) {
                waterDamageSelect.addEventListener('change', (e) => {
                    const waterTimeGroup = document.getElementById('waterTimeGroup');
                    waterTimeGroup.style.display = e.target.value === 'Sim' ? 'block' : 'none';
                });
            }
            
            // Cancelar nova OS
            const cancelBtn = document.querySelector('.cancel-new-os');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.closeNewOSModal();
                });
            }
            
            // Salvar nova OS
            const form = document.getElementById('newOSForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveNewOS();
                });
            }
        },
        
        saveNewOS() {
            // Coletar dados do formulário
            const checklist = {};
            const checklistItems = [
                'wifi', 'bluetooth', 'vibration_motor', 'flash', 'screen_touch',
                'proximity_sensor', 'fingerprint', 'sim_calling', 'charging_port',
                'microphone', 'front_camera', 'power_volume_buttons', 'network_3g',
                'rear_camera', 'earpiece_speaker'
            ];
            
            checklistItems.forEach(item => {
                const value = document.getElementById(`checklist_${item}`).value;
                if (value) {
                    checklist[item] = value;
                }
            });
            
            const osData = {
                clientName: document.getElementById('clientName').value,
                clientPhone: document.getElementById('clientPhone').value,
                clientDocument: document.getElementById('clientDocument').value,
                deviceModel: document.getElementById('deviceModel').value,
                devicePassword: document.getElementById('devicePassword').value,
                entryDate: document.getElementById('entryDate').value,
                arrivedOn: document.getElementById('arrivedOn').value,
                removedCase: document.getElementById('removedCase').value,
                previousRepair: document.getElementById('previousRepair').value,
                waterDamage: document.getElementById('waterDamage').value,
                waterTime: document.getElementById('waterTime').value,
                allTestsCompleted: document.getElementById('allTestsCompleted').value,
                services: Array.from(document.getElementById('services').selectedOptions).map(opt => opt.value),
                preliminaryDiagnosis: document.getElementById('preliminaryDiagnosis').value,
                internalNotes: document.getElementById('internalNotes').value,
                observations: document.getElementById('observations').value,
                serviceValue: parseFloat(document.getElementById('serviceValue').value) || 0,
                checklist: checklist,
                status: 'aguardando_analise',
                protocol: 'OS-' + new Date().getTime()
            };
            
            // Salvar a OS
            const result = window.osData.addOrder(osData);
            
            if (result) {
                // Adicionar ao histórico do cliente se existir
                const existingClientSelect = document.getElementById('existingClient');
                if (existingClientSelect.value) {
                    const client = window.crmData.clients.find(c => c.id === existingClientSelect.value);
                    if (client) {
                        window.crmData.addMaintenanceToClient(client.id, {
                            service: osData.services.join(', '),
                            value: osData.serviceValue,
                            osLink: result.id,
                            date: new Date().toISOString()
                        });
                    }
                }
                
                alert('Ordem de serviço criada com sucesso!');
                this.loadOS();
                this.closeNewOSModal();
            } else {
                alert('Erro ao criar ordem de serviço');
            }
        },
        
        editOS(osId) {
            // Implementação similar ao viewOSDetails, mas em modo de edição
            // Por simplicidade, vamos redirecionar para visualização
            this.viewOSDetails(osId);
        },
        
        setupModalCloseListeners() {
            // Modal de detalhes da OS
            const osModal = document.getElementById('osModal');
            if (osModal) {
                osModal.querySelector('.modal-close').addEventListener('click', () => {
                    this.closeOSModal();
                });
                
                osModal.querySelector('.modal-overlay').addEventListener('click', () => {
                    this.closeOSModal();
                });
            }
            
            // Modal de nova OS
            const newOSModal = document.getElementById('newOSModal');
            if (newOSModal) {
                newOSModal.querySelector('.modal-close').addEventListener('click', () => {
                    this.closeNewOSModal();
                });
                
                newOSModal.querySelector('.modal-overlay').addEventListener('click', () => {
                    this.closeNewOSModal();
                });
            }
        },
        
        openOSModal() {
            const modal = document.getElementById('osModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        },
        
        closeOSModal() {
            const modal = document.getElementById('osModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
            selectedOSId = null;
        },
        
        openNewOSModalWindow() {
            const modal = document.getElementById('newOSModal');
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        },
        
        closeNewOSModal() {
            const modal = document.getElementById('newOSModal');
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    };
    
    return module;
})();