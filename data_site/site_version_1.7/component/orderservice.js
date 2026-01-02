// components/orderservice.js
import { db } from '../databank/bankservice.js';

export async function renderOrderService() {
    const contentArea = document.querySelector('#ordensContent');
    
    try {
        const orders = await db.orders;
        const clients = await db.clients;
        const services = await db.services;
        
        contentArea.innerHTML = `
            <div class="os-header mb-4">
                <div class="d-flex justify-between align-center">
                    <div>
                        <h2 class="mb-2">Gestão de Ordens de Serviço</h2>
                        <p class="text-light">Controle de ordens de serviço e acompanhamento</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-secondary" onclick="exportOSList()">
                            <i class="fas fa-file-export"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" onclick="openNewOSModal()">
                            <i class="fas fa-plus"></i>
                            Nova OS
                        </button>
                    </div>
                </div>
            </div>

            <!-- Filtros e Busca -->
            <div class="card mb-4">
                <div class="grid grid-4 gap-3">
                    <div class="form-group">
                        <label class="form-label">Buscar</label>
                        <input type="text" class="form-control" id="orderSearchInput" 
                               placeholder="Protocolo, Cliente, Equipamento..."
                               onkeyup="filterOrders()">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-control" id="statusFilter" onchange="filterOrders()">
                            <option value="">Todos os status</option>
                            <option value="Aguardando análise">Aguardando análise</option>
                            <option value="Em análise">Em análise</option>
                            <option value="Aguardando aprovação">Aguardando aprovação</option>
                            <option value="Em manutenção">Em manutenção</option>
                            <option value="Pronto">Pronto</option>
                            <option value="Entregue">Entregue</option>
                            <option value="Cancelado">Cancelado</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Data Inicial</label>
                        <input type="date" class="form-control" id="dateStartFilter" onchange="filterOrders()">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Data Final</label>
                        <input type="date" class="form-control" id="dateEndFilter" onchange="filterOrders()">
                    </div>
                </div>
            </div>

            <!-- Estatísticas Rápidas -->
            <div class="grid grid-4 mb-4">
                <div class="card">
                    <div class="d-flex align-center justify-between">
                        <div>
                            <h4 class="mb-1">Aguardando</h4>
                            <div class="stat-value text-warning">${countOrdersByStatus(orders, 'Aguardando análise')}</div>
                        </div>
                        <i class="fas fa-clock text-warning" style="font-size: 2rem;"></i>
                    </div>
                </div>
                <div class="card">
                    <div class="d-flex align-center justify-between">
                        <div>
                            <h4 class="mb-1">Em Andamento</h4>
                            <div class="stat-value text-primary">${countOrdersByStatus(orders, ['Em análise', 'Aguardando aprovação', 'Em manutenção'])}</div>
                        </div>
                        <i class="fas fa-tools text-primary" style="font-size: 2rem;"></i>
                    </div>
                </div>
                <div class="card">
                    <div class="d-flex align-center justify-between">
                        <div>
                            <h4 class="mb-1">Prontos</h4>
                            <div class="stat-value text-success">${countOrdersByStatus(orders, 'Pronto')}</div>
                        </div>
                        <i class="fas fa-check-circle text-success" style="font-size: 2rem;"></i>
                    </div>
                </div>
                <div class="card">
                    <div class="d-flex align-center justify-between">
                        <div>
                            <h4 class="mb-1">Entregues</h4>
                            <div class="stat-value text-info">${countOrdersByStatus(orders, 'Entregue')}</div>
                        </div>
                        <i class="fas fa-box text-info" style="font-size: 2rem;"></i>
                    </div>
                </div>
            </div>

            <!-- Tabela de OS -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-clipboard-list"></i>
                        Ordens de Serviço
                    </h3>
                    <div class="d-flex align-center gap-2">
                        <span class="text-light" id="orderCount">${orders.length} ordens encontradas</span>
                        <button class="btn btn-sm btn-outline" onclick="refreshOrders()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Protocolo</th>
                                    <th>Cliente</th>
                                    <th>Equipamento</th>
                                    <th>Status</th>
                                    <th>Data Entrada</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="ordersTableBody">
                                ${renderOrdersTable(orders, clients)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        setupOrderEvents();
        
    } catch (error) {
        console.error('Erro ao renderizar Gestão de OS:', error);
        contentArea.innerHTML = `
            <div class="card">
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #F44336;"></i>
                    <h3 class="mt-3">Erro ao carregar ordens de serviço</h3>
                    <p class="text-light mt-2">${error.message}</p>
                </div>
            </div>
        `;
    }
}

function countOrdersByStatus(orders, status) {
    if (Array.isArray(status)) {
        return orders.filter(order => status.includes(order.status)).length;
    }
    return orders.filter(order => order.status === status).length;
}

function renderOrdersTable(orders, clients) {
    return orders.map(order => {
        const client = clients.find(c => c.id === order.clientId);
        return `
        <tr data-order-id="${order.id}" data-status="${order.status}">
            <td>
                <strong class="text-orange">#${order.protocol}</strong>
            </td>
            <td>
                <div class="d-flex align-center gap-2">
                    <div class="avatar-sm">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div>${client?.name || 'Cliente não encontrado'}</div>
                        <small class="text-light">${client?.phone || ''}</small>
                    </div>
                </div>
            </td>
            <td>
                <div>
                    <div>${order.equipment}</div>
                    <small class="text-light">${order.brand || ''}</small>
                </div>
            </td>
            <td>
                <span class="badge ${getStatusBadgeClass(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>${formatDate(order.date)}</td>
            <td>
                <strong>${formatCurrency(order.value || 0)}</strong>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="viewOrderDetails(${order.id})" title="Detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="editOrder(${order.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="changeOrderStatus(${order.id})" title="Status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="printOS(${order.id})" title="Imprimir">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function getStatusBadgeClass(status) {
    const statusClasses = {
        'Aguardando análise': 'badge-info',
        'Em análise': 'badge-primary',
        'Aguardando aprovação': 'badge-warning',
        'Em manutenção': 'badge-warning',
        'Pronto': 'badge-success',
        'Entregue': 'badge-success',
        'Cancelado': 'badge-danger'
    };
    return statusClasses[status] || 'badge-secondary';
}

function setupOrderEvents() {
    window.filterOrders = function() {
        const searchTerm = document.getElementById('orderSearchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateStart = document.getElementById('dateStartFilter').value;
        const dateEnd = document.getElementById('dateEndFilter').value;
        
        const rows = document.querySelectorAll('#ordersTableBody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const protocol = row.cells[0].textContent.toLowerCase();
            const client = row.cells[1].textContent.toLowerCase();
            const equipment = row.cells[2].textContent.toLowerCase();
            const status = row.dataset.status;
            const dateText = row.cells[4].textContent;
            const rowDate = parseDate(dateText);
            
            let searchMatch = protocol.includes(searchTerm) || 
                             client.includes(searchTerm) || 
                             equipment.includes(searchTerm);
            let statusMatch = !statusFilter || status === statusFilter;
            let dateMatch = true;
            
            if (dateStart && rowDate < new Date(dateStart)) {
                dateMatch = false;
            }
            if (dateEnd && rowDate > new Date(dateEnd)) {
                dateMatch = false;
            }
            
            if (searchMatch && statusMatch && dateMatch) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        document.getElementById('orderCount').textContent = `${visibleCount} ordens encontradas`;
    };
    
    window.refreshOrders = function() {
        renderOrderService();
        system.showSuccess('Lista de OS atualizada!');
    };
    
    window.exportOSList = function() {
        const data = [];
        const rows = document.querySelectorAll('#ordersTableBody tr:not([style*="display: none"])');
        
        rows.forEach(row => {
            data.push({
                protocol: row.cells[0].textContent.trim(),
                cliente: row.cells[1].textContent.trim(),
                equipamento: row.cells[2].textContent.trim(),
                status: row.cells[3].textContent.trim(),
                data: row.cells[4].textContent.trim(),
                valor: row.cells[5].textContent.trim()
            });
        });
        
        // Em um sistema real, aqui seria gerado um arquivo Excel ou PDF
        system.showSuccess(`${data.length} ordens exportadas com sucesso!`);
        console.log('Dados para exportação:', data);
    };
}

window.openNewOSModal = function() {
    system.showModal('newOS', {
        title: 'Nova Ordem de Serviço',
        content: `
            <div class="new-os-wizard">
                <div class="wizard-steps mb-4">
                    <div class="steps">
                        <div class="step active">1. Cliente</div>
                        <div class="step">2. Equipamento</div>
                        <div class="step">3. Diagnóstico</div>
                        <div class="step">4. Serviços</div>
                        <div class="step">5. Finalizar</div>
                    </div>
                </div>
                
                <div class="wizard-content">
                    <div class="step-content active" id="step1">
                        <div class="form-group mb-3">
                            <label class="form-label">Selecionar Cliente</label>
                            <select class="form-control" id="clientSelect">
                                <option value="">Selecione um cliente ou cadastre novo</option>
                                ${db.clients.map(client => `
                                    <option value="${client.id}">${client.name} - ${client.cpf} - ${client.phone}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="text-center">
                            <button class="btn btn-outline" onclick="openNewClientModalFromOS()">
                                <i class="fas fa-user-plus"></i>
                                Cadastrar Novo Cliente
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="wizard-actions mt-4 d-flex justify-between">
                    <button class="btn btn-secondary" disabled>Anterior</button>
                    <button class="btn btn-primary" onclick="nextStep()">Próximo</button>
                </div>
            </div>
        `
    });
};

window.viewOrderDetails = async function(orderId) {
    try {
        const order = db.orders.find(o => o.id === orderId);
        const client = db.clients.find(c => c.id === order.clientId);
        
        if (!order || !client) {
            system.showError('Ordem de serviço não encontrada');
            return;
        }
        
        system.showModal('orderDetails', {
            title: `OS #${order.protocol} - ${order.equipment}`,
            content: `
                <div class="order-details">
                    <div class="grid grid-2 gap-4 mb-4">
                        <!-- Dados do Cliente -->
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title">
                                    <i class="fas fa-user"></i>
                                    Dados do Cliente
                                </h4>
                                <button class="btn btn-sm btn-outline" onclick="editClient(${client.id})">
                                    <i class="fas fa-edit"></i>
                                </button>
                            </div>
                            <div class="card-body">
                                <div class="info-item">
                                    <label>Nome:</label>
                                    <span>${client.name}</span>
                                </div>
                                <div class="info-item">
                                    <label>CPF:</label>
                                    <span>${client.cpf}</span>
                                </div>
                                <div class="info-item">
                                    <label>Telefone:</label>
                                    <span>${client.phone}</span>
                                </div>
                                <div class="info-item">
                                    <label>E-mail:</label>
                                    <span>${client.email || 'Não informado'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Status da OS -->
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title">
                                    <i class="fas fa-info-circle"></i>
                                    Status da Ordem
                                </h4>
                            </div>
                            <div class="card-body">
                                <div class="info-item">
                                    <label>Status Atual:</label>
                                    <span class="badge ${getStatusBadgeClass(order.status)}">${order.status}</span>
                                </div>
                                <div class="info-item">
                                    <label>Protocolo:</label>
                                    <span>${order.protocol}</span>
                                </div>
                                <div class="info-item">
                                    <label>Data de Entrada:</label>
                                    <span>${formatDate(order.date)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Data Prevista:</label>
                                    <span>${order.estimatedDelivery || 'Não definida'}</span>
                                </div>
                                
                                <div class="form-group mt-3">
                                    <label class="form-label">Alterar Status:</label>
                                    <select class="form-control" id="statusChangeSelect">
                                        <option value="Aguardando análise" ${order.status === 'Aguardando análise' ? 'selected' : ''}>Aguardando análise</option>
                                        <option value="Em análise" ${order.status === 'Em análise' ? 'selected' : ''}>Em análise</option>
                                        <option value="Aguardando aprovação" ${order.status === 'Aguardando aprovação' ? 'selected' : ''}>Aguardando aprovação</option>
                                        <option value="Em manutenção" ${order.status === 'Em manutenção' ? 'selected' : ''}>Em manutenção</option>
                                        <option value="Pronto" ${order.status === 'Pronto' ? 'selected' : ''}>Pronto para retirada</option>
                                        <option value="Entregue" ${order.status === 'Entregue' ? 'selected' : ''}>Entregue</option>
                                        <option value="Cancelado" ${order.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                                    </select>
                                </div>
                                <button class="btn btn-primary btn-sm mt-2" onclick="updateOrderStatus(${orderId})">
                                    <i class="fas fa-sync-alt"></i>
                                    Atualizar Status
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dados do Equipamento -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h4 class="card-title">
                                <i class="fas fa-mobile-alt"></i>
                                Dados do Equipamento
                            </h4>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-3 gap-3">
                                <div class="info-item">
                                    <label>Equipamento:</label>
                                    <span>${order.equipment}</span>
                                </div>
                                <div class="info-item">
                                    <label>Marca/Modelo:</label>
                                    <span>${order.brand || 'Não informado'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Cor:</label>
                                    <span>${order.color || 'Não informado'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Senha:</label>
                                    <span>${order.password || 'Não informada'}</span>
                                </div>
                                <div class="info-item">
                                    <label>IMEI/Serial:</label>
                                    <span>${order.imei || 'Não informado'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Acessórios:</label>
                                    <span>${order.accessories || 'Não informados'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Diagnóstico e Serviços -->
                    <div class="grid grid-2 gap-4 mb-4">
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title">
                                    <i class="fas fa-stethoscope"></i>
                                    Diagnóstico
                                </h4>
                            </div>
                            <div class="card-body">
                                <div class="form-group">
                                    <label class="form-label">Defeito Relatado:</label>
                                    <p>${order.reportedIssue || 'Não informado'}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Diagnóstico Técnico:</label>
                                    <p>${order.diagnosis || 'Não informado'}</p>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Observações:</label>
                                    <p>${order.notes || 'Nenhuma observação'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="card">
                            <div class="card-header">
                                <h4 class="card-title">
                                    <i class="fas fa-tools"></i>
                                    Serviços Executados
                                </h4>
                            </div>
                            <div class="card-body">
                                ${order.services && order.services.length > 0 ? 
                                    order.services.map(service => `
                                        <div class="service-item">
                                            <div class="d-flex justify-between">
                                                <strong>${service.name}</strong>
                                                <span class="text-orange">${formatCurrency(service.price)}</span>
                                            </div>
                                            ${service.description ? `<small class="text-light">${service.description}</small>` : ''}
                                        </div>
                                    `).join('') :
                                    '<p class="text-light">Nenhum serviço registrado</p>'
                                }
                                <div class="total-value mt-3 pt-3 border-top">
                                    <div class="d-flex justify-between">
                                        <strong>Valor Total:</strong>
                                        <strong class="text-orange" style="font-size: 1.2rem;">${formatCurrency(order.value || 0)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ações -->
                    <div class="d-flex justify-end gap-2 mt-4">
                        <button class="btn btn-secondary" onclick="system.closeModal('orderDetails')">
                            Fechar
                        </button>
                        <button class="btn btn-primary" onclick="printOS(${orderId})">
                            <i class="fas fa-print"></i>
                            Imprimir OS
                        </button>
                        <button class="btn btn-outline" onclick="editOrder(${orderId})">
                            <i class="fas fa-edit"></i>
                            Editar OS
                        </button>
                    </div>
                </div>
            `
        });
    } catch (error) {
        system.showError('Erro ao carregar detalhes da OS: ' + error.message);
    }
};

window.updateOrderStatus = async function(orderId) {
    const select = document.getElementById('statusChangeSelect');
    const newStatus = select.value;
    
    try {
        await db.updateOrderStatus(orderId, newStatus);
        system.showSuccess(`Status da OS #${orderId} atualizado para "${newStatus}"`);
        system.closeModal('orderDetails');
        renderOrderService();
    } catch (error) {
        system.showError('Erro ao atualizar status: ' + error.message);
    }
};

window.printOS = function(orderId) {
    const order = db.orders.find(o => o.id === orderId);
    const client = db.clients.find(c => c.id === order.clientId);
    
    // Em um sistema real, aqui seria gerado um PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>OS #${order.protocol} - iFix Boituva</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .section { margin-bottom: 20px; }
                    .label { font-weight: bold; }
                    .value { margin-bottom: 10px; }
                    .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
                    .signature { margin-top: 50px; border-top: 1px solid #000; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>iFix Boituva</h1>
                    <h2>Ordem de Serviço #${order.protocol}</h2>
                </div>
                
                <div class="section">
                    <h3>Dados do Cliente</h3>
                    <div class="value"><span class="label">Nome:</span> ${client.name}</div>
                    <div class="value"><span class="label">CPF:</span> ${client.cpf}</div>
                    <div class="value"><span class="label">Telefone:</span> ${client.phone}</div>
                </div>
                
                <div class="section">
                    <h3>Dados do Equipamento</h3>
                    <div class="value"><span class="label">Equipamento:</span> ${order.equipment}</div>
                    <div class="value"><span class="label">Defeito Relatado:</span> ${order.reportedIssue}</div>
                </div>
                
                <div class="section">
                    <h3>Serviços</h3>
                    ${order.services ? order.services.map(s => `
                        <div class="value">• ${s.name}: ${formatCurrency(s.price)}</div>
                    `).join('') : 'Nenhum serviço registrado'}
                    <div class="total">Total: ${formatCurrency(order.value || 0)}</div>
                </div>
                
                <div class="signature">
                    <p>Data: ${new Date().toLocaleDateString('pt-BR')}</p>
                    <p>_________________________________________</p>
                    <p>Assinatura do Cliente</p>
                </div>
                
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() {
                            window.close();
                        }, 1000);
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
};

window.editOrder = function(orderId) {
    system.showModal('editOrder', {
        title: 'Editar Ordem de Serviço',
        content: `
            <div class="text-center" style="padding: 3rem;">
                <i class="fas fa-tools" style="font-size: 3rem; color: var(--color-orange-primary);"></i>
                <h3 class="mt-3">Funcionalidade em Desenvolvimento</h3>
                <p class="text-light mt-2">A edição completa da OS estará disponível em breve.</p>
                <button class="btn btn-primary mt-3" onclick="system.closeModal('editOrder')">
                    Entendi
                </button>
            </div>
        `
    });
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

function parseDate(dateString) {
    const [day, month, year] = dateString.split('/');
    return new Date(year, month - 1, day);
}