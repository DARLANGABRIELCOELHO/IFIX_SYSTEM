// components/crm.js
import { db } from '../databank/bankservice.js';

export async function renderCRM() {
    const contentArea = document.querySelector('#clientesContent');
    
    try {
        const clients = await db.clients;
        
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
                                   id="clientSearchInput"
                                   onkeyup="searchClients()">
                        </div>
                    </div>
                    <div style="width: 200px;">
                        <div class="form-group">
                            <label class="form-label">Ordenar por</label>
                            <select class="form-control" id="clientSortSelect" onchange="sortClients()">
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
    return clients.map(client => `
        <tr data-client-id="${client.id}">
            <td>
                <div class="d-flex align-center gap-2">
                    <div class="avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div><strong>${client.name}</strong></div>
                        <small class="text-light">${client.email || 'Sem e-mail'}</small>
                    </div>
                </div>
            </td>
            <td>${client.cpf}</td>
            <td>
                <div class="d-flex align-center gap-2">
                    <i class="fab fa-whatsapp" style="color: #25D366;"></i>
                    <span>${client.phone}</span>
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
    window.searchClients = function() {
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
    };
    
    window.sortClients = function() {
        const sortBy = document.getElementById('clientSortSelect').value;
        const rows = Array.from(document.querySelectorAll('#clientsTableBody tr'));
        
        rows.sort((a, b) => {
            const idA = parseInt(a.dataset.clientId);
            const idB = parseInt(b.dataset.clientId);
            const clientA = db.clients.find(c => c.id === idA);
            const clientB = db.clients.find(c => c.id === idB);
            
            switch(sortBy) {
                case 'name':
                    return clientA.name.localeCompare(clientB.name);
                case 'date':
                    return new Date(clientB.registrationDate) - new Date(clientA.registrationDate);
                case 'spent':
                    return clientB.totalSpent - clientA.totalSpent;
                default:
                    return 0;
            }
        });
        
        const tableBody = document.getElementById('clientsTableBody');
        rows.forEach(row => tableBody.appendChild(row));
    };
}

window.openNewClientModal = function() {
    const modalHTML = `
        <div class="modal active" id="newClientModal">
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-user-plus"></i>
                        Cadastrar Novo Cliente
                    </h3>
                    <button class="modal-close" onclick="system.closeModal('newClientModal')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="newClientForm" onsubmit="saveNewClient(event)">
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
                                    onclick="system.closeModal('newClientModal')">
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
};

window.saveNewClient = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData.entries());
    
    try {
        const newClient = await db.createClient(clientData);
        system.showSuccess('Cliente cadastrado com sucesso!');
        system.closeModal('newClientModal');
        renderCRM(); // Recarregar a lista
    } catch (error) {
        system.showError('Erro ao cadastrar cliente: ' + error.message);
    }
};

window.viewClientProfile = function(clientId) {
    // Implementar visualização do perfil do cliente
    console.log('Ver perfil do cliente:', clientId);
};

window.editClient = function(clientId) {
    // Implementar edição do cliente
    console.log('Editar cliente:', clientId);
};

window.viewClientHistory = function(clientId) {
    // Implementar histórico do cliente
    console.log('Ver histórico do cliente:', clientId);
};

window.deleteClient = async function(clientId) {
    if (confirm('Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.')) {
        try {
            const deleted = await db.deleteClient(clientId);
            if (deleted) {
                system.showSuccess('Cliente excluído com sucesso!');
                renderCRM(); // Recarregar a lista
            }
        } catch (error) {
            system.showError('Erro ao excluir cliente: ' + error.message);
        }
    }
};

// Funções auxiliares
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
}