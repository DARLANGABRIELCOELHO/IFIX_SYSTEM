// components/crm.js ATUALIZADO
import { db } from '../databank/bankservice.js';

export async function renderCRM() {
    const contentArea = document.querySelector('#clientesContent');
    if (!contentArea) {
        console.error('Área de clientes não encontrada');
        return;
    }
    
    try {
        const clients = db.clients || [];
        
        contentArea.innerHTML = `
            <div class="crm-header mb-4">
                <div class="d-flex justify-between align-center">
                    <div>
                        <h2 class="mb-2">Gestão de Clientes</h2>
                        <p class="text-light">Cadastro e gerenciamento de clientes</p>
                    </div>
                    <button class="btn btn-primary" onclick="openNewClientModal()">
                        <i class="fas fa-plus"></i>
                        Novo Cliente
                    </button>
                </div>
            </div>

            <!-- Barra de Busca -->
            <div class="card mb-4">
                <div class="d-flex gap-3">
                    <div class="flex-1">
                        <div class="form-group">
                            <label class="form-label">Buscar Cliente</label>
                            <input type="text" 
                                   class="form-control" 
                                   placeholder="Nome, CPF ou Telefone"
                                   id="clientSearchInput">
                        </div>
                    </div>
                    <div style="width: 200px;">
                        <div class="form-group">
                            <label class="form-label">Ordenar por</label>
                            <select class="form-control" id="clientSortSelect">
                                <option value="name">Nome A-Z</option>
                                <option value="date">Data de Cadastro</option>
                                <option value="spent">Total Gasto</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabela de Clientes -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-list"></i>
                        Lista de Clientes
                    </h3>
                    <div class="d-flex align-center gap-2">
                        <span class="text-light" id="clientCount">${clients.length} clientes encontrados</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nome do Cliente</th>
                                    <th>Documento (CPF)</th>
                                    <th>WhatsApp</th>
                                    <th>Data de Cadastro</th>
                                    <th>Total Gasto</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="clientsTableBody">
                                ${renderClientsTable(clients)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar eventos após renderizar
        setupClientEvents();
        
    } catch (error) {
        console.error('Erro ao renderizar CRM:', error);
        contentArea.innerHTML = `
            <div class="card">
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #F44336;"></i>
                    <h3 class="mt-3">Erro ao carregar clientes</h3>
                    <p class="text-light mt-2">${error.message}</p>
                </div>
            </div>
        `;
    }
}

function renderClientsTable(clients) {
    if (!clients || clients.length === 0) {
        return `
            <tr>
                <td colspan="6" class="text-center" style="padding: 3rem;">
                    <i class="fas fa-users" style="font-size: 3rem; color: var(--color-gray-light);"></i>
                    <p class="mt-3">Nenhum cliente cadastrado</p>
                </td>
            </tr>
        `;
    }
    
    return clients.map(client => `
        <tr data-client-id="${client.id}">
            <td>
                <div class="d-flex align-center gap-2">
                    <div class="avatar" style="width: 40px; height: 40px; background: var(--color-gray-charcoal); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div><strong>${client.name}</strong></div>
                        <small class="text-light">${client.email || 'Sem e-mail'}</small>
                    </div>
                </div>
            </td>
            <td>${client.cpf || client.cnpj || 'N/D'}</td>
            <td>
                <div class="d-flex align-center gap-2">
                    <i class="fab fa-whatsapp" style="color: #25D366;"></i>
                    <span>${client.phone || 'N/D'}</span>
                </div>
            </td>
            <td>${formatDate(client.registrationDate)}</td>
            <td>
                <strong class="text-orange">${formatCurrency(client.totalSpent)}</strong>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="viewClientProfile(${client.id})" title="Perfil">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editClient(${client.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="viewClientHistory(${client.id})" title="Histórico">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deleteClient(${client.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function setupClientEvents() {
    // Configurar eventos de busca
    const searchInput = document.getElementById('clientSearchInput');
    const sortSelect = document.getElementById('clientSortSelect');
    
    if (searchInput) {
        searchInput.addEventListener('input', searchClients);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', sortClients);
    }
    
    // Expor funções para o escopo global
    window.searchClients = searchClients;
    window.sortClients = sortClients;
    window.openNewClientModal = openNewClientModal;
    window.viewClientProfile = viewClientProfile;
    window.editClient = editClient;
    window.viewClientHistory = viewClientHistory;
    window.deleteClient = deleteClient;
}

function searchClients() {
    const searchTerm = document.getElementById('clientSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#clientsTableBody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const clientName = row.cells[0].textContent.toLowerCase();
        const clientCPF = row.cells[1].textContent;
        const clientPhone = row.cells[2].textContent;
        
        if (clientName.includes(searchTerm) || 
            clientCPF.includes(searchTerm) || 
            clientPhone.includes(searchTerm)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    document.getElementById('clientCount').textContent = `${visibleCount} clientes encontrados`;
}

function sortClients() {
    const sortBy = document.getElementById('clientSortSelect').value;
    const rows = Array.from(document.querySelectorAll('#clientsTableBody tr'));
    
    rows.sort((a, b) => {
        const idA = parseInt(a.dataset.clientId);
        const idB = parseInt(b.dataset.clientId);
        const clientA = db.clients.find(c => c.id === idA);
        const clientB = db.clients.find(c => c.id === idB);
        
        if (!clientA || !clientB) return 0;
        
        switch(sortBy) {
            case 'name':
                return clientA.name.localeCompare(clientB.name);
            case 'date':
                return new Date(clientB.registrationDate) - new Date(clientA.registrationDate);
            case 'spent':
                return (clientB.totalSpent || 0) - (clientA.totalSpent || 0);
            default:
                return 0;
        }
    });
    
    const tableBody = document.getElementById('clientsTableBody');
    if (tableBody) {
        rows.forEach(row => tableBody.appendChild(row));
    }
}

function openNewClientModal() {
    const modalHTML = `
        <div class="modal active" id="newClientModal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-user-plus"></i>
                        Cadastrar Novo Cliente
                    </h3>
                    <button class="modal-close" onclick="window.app.closeModal('newClientModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newClientForm">
                        <div class="grid grid-2 gap-3 mb-3">
                            <div class="form-group">
                                <label class="form-label">Nome Completo *</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">CPF *</label>
                                <input type="text" class="form-control" name="cpf" required
                                       placeholder="000.000.000-00">
                            </div>
                        </div>
                        
                        <div class="grid grid-2 gap-3 mb-3">
                            <div class="form-group">
                                <label class="form-label">Telefone/WhatsApp *</label>
                                <input type="tel" class="form-control" name="phone" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">E-mail</label>
                                <input type="email" class="form-control" name="email">
                            </div>
                        </div>
                        
                        <div class="form-group mb-3">
                            <label class="form-label">Endereço</label>
                            <input type="text" class="form-control" name="address" 
                                   placeholder="Rua, número, bairro, cidade">
                        </div>
                        
                        <div class="form-group mb-4">
                            <label class="form-label">Observações</label>
                            <textarea class="form-control" name="notes" rows="3"></textarea>
                        </div>
                        
                        <div class="d-flex justify-end gap-2">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="window.app.closeModal('newClientModal')">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i>
                                Salvar Cliente
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('modalContainer').innerHTML = modalHTML;
    
    // Adicionar evento de submit
    const form = document.getElementById('newClientForm');
    if (form) {
        form.addEventListener('submit', saveNewClient);
    }
}

async function saveNewClient(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData.entries());
    
    try {
        const newClient = await db.createClient(clientData);
        window.app.showSuccess('Cliente cadastrado com sucesso!');
        window.app.closeModal('newClientModal');
        
        // Recarregar a lista
        if (window.app && window.app.switchTab) {
            window.app.switchTab('clientes');
        } else {
            renderCRM();
        }
    } catch (error) {
        window.app.showError('Erro ao cadastrar cliente: ' + error.message);
    }
}

function viewClientProfile(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) {
        window.app.showError('Cliente não encontrado');
        return;
    }
    
    window.app.showModal('clientProfile', {
        title: `Perfil do Cliente - ${client.name}`,
        content: `
            <div class="client-profile">
                <div class="grid grid-2 gap-4 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">
                                <i class="fas fa-user"></i>
                                Dados Pessoais
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="info-item mb-3">
                                <label class="text-light">Nome:</label>
                                <div>${client.name}</div>
                            </div>
                            <div class="info-item mb-3">
                                <label class="text-light">Documento:</label>
                                <div>${client.cpf || client.cnpj}</div>
                            </div>
                            <div class="info-item mb-3">
                                <label class="text-light">Telefone:</label>
                                <div>${client.phone}</div>
                            </div>
                            <div class="info-item mb-3">
                                <label class="text-light">E-mail:</label>
                                <div>${client.email || 'Não informado'}</div>
                            </div>
                            <div class="info-item">
                                <label class="text-light">Endereço:</label>
                                <div>${client.address || 'Não informado'}</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="card-header">
                            <h4 class="card-title">
                                <i class="fas fa-chart-bar"></i>
                                Estatísticas
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="info-item mb-3">
                                <label class="text-light">Total Gasto:</label>
                                <div class="text-orange">${formatCurrency(client.totalSpent)}</div>
                            </div>
                            <div class="info-item mb-3">
                                <label class="text-light">Data de Cadastro:</label>
                                <div>${formatDate(client.registrationDate)}</div>
                            </div>
                            <div class="info-item mb-3">
                                <label class="text-light">Categoria:</label>
                                <div>
                                    <span class="badge ${client.category === 'vip' ? 'badge-primary' : 'badge-info'}">
                                        ${client.category || 'regular'}
                                    </span>
                                </div>
                            </div>
                            <div class="info-item">
                                <label class="text-light">Observações:</label>
                                <div>${client.notes || 'Nenhuma observação'}</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="d-flex justify-end gap-2">
                    <button class="btn btn-secondary" onclick="window.app.closeModal('clientProfile')">
                        Fechar
                    </button>
                    <button class="btn btn-primary" onclick="editClient(${clientId})">
                        <i class="fas fa-edit"></i>
                        Editar Cliente
                    </button>
                </div>
            </div>
        `
    });
}

function editClient(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    if (!client) {
        window.app.showError('Cliente não encontrado');
        return;
    }
    
    window.app.showModal('editClient', {
        title: `Editar Cliente - ${client.name}`,
        content: `
            <div class="edit-client">
                <form id="editClientForm">
                    <div class="grid grid-2 gap-3 mb-3">
                        <div class="form-group">
                            <label class="form-label">Nome Completo *</label>
                            <input type="text" class="form-control" name="name" value="${client.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">CPF</label>
                            <input type="text" class="form-control" name="cpf" value="${client.cpf || ''}">
                        </div>
                    </div>
                    
                    <div class="grid grid-2 gap-3 mb-3">
                        <div class="form-group">
                            <label class="form-label">Telefone *</label>
                            <input type="tel" class="form-control" name="phone" value="${client.phone}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">E-mail</label>
                            <input type="email" class="form-control" name="email" value="${client.email || ''}">
                        </div>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label class="form-label">Endereço</label>
                        <input type="text" class="form-control" name="address" value="${client.address || ''}">
                    </div>
                    
                    <div class="form-group mb-4">
                        <label class="form-label">Observações</label>
                        <textarea class="form-control" name="notes" rows="3">${client.notes || ''}</textarea>
                    </div>
                    
                    <div class="d-flex justify-end gap-2">
                        <button type="button" class="btn btn-secondary" onclick="window.app.closeModal('editClient')">
                            Cancelar
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Atualizar Cliente
                        </button>
                    </div>
                </form>
            </div>
        `
    });
    
    // Adicionar evento de submit
    setTimeout(() => {
        const form = document.getElementById('editClientForm');
        if (form) {
            form.addEventListener('submit', (e) => updateClient(e, clientId));
        }
    }, 100);
}

async function updateClient(event, clientId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData.entries());
    
    try {
        const updatedClient = await db.updateClient(clientId, clientData);
        window.app.showSuccess('Cliente atualizado com sucesso!');
        window.app.closeModal('editClient');
        
        // Recarregar a lista
        if (window.app && window.app.switchTab) {
            window.app.switchTab('clientes');
        } else {
            renderCRM();
        }
    } catch (error) {
        window.app.showError('Erro ao atualizar cliente: ' + error.message);
    }
}

function viewClientHistory(clientId) {
    const client = db.clients.find(c => c.id === clientId);
    const clientOrders = db.orders.filter(o => o.clientId === clientId);
    
    if (!client) {
        window.app.showError('Cliente não encontrado');
        return;
    }
    
    window.app.showModal('clientHistory', {
        title: `Histórico - ${client.name}`,
        content: `
            <div class="client-history">
                <div class="card mb-4">
                    <div class="card-header">
                        <h4 class="card-title">
                            <i class="fas fa-history"></i>
                            Histórico de Ordens de Serviço
                        </h4>
                    </div>
                    <div class="card-body">
                        ${clientOrders.length > 0 ? `
                            <div class="table-container">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Protocolo</th>
                                            <th>Equipamento</th>
                                            <th>Status</th>
                                            <th>Data</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${clientOrders.map(order => `
                                            <tr>
                                                <td>
                                                    <strong>#${order.protocol}</strong>
                                                </td>
                                                <td>${order.equipment}</td>
                                                <td>
                                                    <span class="badge ${getStatusBadgeClass(order.status)}">
                                                        ${order.status}
                                                    </span>
                                                </td>
                                                <td>${formatDate(order.date)}</td>
                                                <td>${formatCurrency(order.value)}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        ` : `
                            <div class="text-center" style="padding: 2rem;">
                                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: var(--color-gray-light);"></i>
                                <p class="mt-3">Nenhuma ordem de serviço encontrada</p>
                            </div>
                        `}
                    </div>
                </div>
                
                <div class="d-flex justify-end">
                    <button class="btn btn-secondary" onclick="window.app.closeModal('clientHistory')">
                        Fechar
                    </button>
                </div>
            </div>
        `
    });
}

async function deleteClient(clientId) {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    try {
        const deleted = await db.deleteClient(clientId);
        if (deleted) {
            window.app.showSuccess('Cliente excluído com sucesso!');
            
            // Recarregar a lista
            if (window.app && window.app.switchTab) {
                window.app.switchTab('clientes');
            } else {
                renderCRM();
            }
        }
    } catch (error) {
        window.app.showError('Erro ao excluir cliente: ' + error.message);
    }
}

// Funções auxiliares
function formatCurrency(value) {
    if (value === undefined || value === null) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    if (!date) return '--/--/----';
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'Pronto': 'badge-success',
        'Em manutenção': 'badge-warning',
        'Aguardando análise': 'badge-info',
        'Aguardando aprovação': 'badge-primary',
        'Entregue': 'badge-success',
        'Cancelado': 'badge-danger'
    };
    return statusClasses[status] || 'badge-secondary';
}