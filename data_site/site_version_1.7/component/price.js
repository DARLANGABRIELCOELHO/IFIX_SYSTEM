// components/price.js
import { db } from '../databank/bankservice.js';

export async function renderPriceManagement() {
    const contentArea = document.querySelector('#precosContent');
    
    try {
        const services = await db.services;
        
        contentArea.innerHTML = `
            <div class="price-header mb-4">
                <div class="d-flex justify-between align-center">
                    <div>
                        <h2 class="mb-2">Gestão de Preços</h2>
                        <p class="text-light">Cadastro e manutenção de serviços e valores</p>
                    </div>
                    <button class="btn btn-primary" onclick="openNewServiceModal()">
                        <i class="fas fa-plus"></i>
                        Novo Serviço
                    </button>
                </div>
            </div>

            <!-- Tabela de Serviços -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-tags"></i>
                        Lista de Serviços
                    </h3>
                    <div class="d-flex align-center gap-2">
                        <span class="text-light">${services.length} serviços cadastrados</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Nome do Serviço</th>
                                    <th>Categoria</th>
                                    <th>Preço</th>
                                    <th>Tempo Estimado</th>
                                    <th>Margem</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="servicesTableBody">
                                ${renderServicesTable(services)}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        setupPriceEvents();
        
    } catch (error) {
        console.error('Erro ao renderizar Gestão de Preços:', error);
        contentArea.innerHTML = `
            <div class="card">
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #F44336;"></i>
                    <h3 class="mt-3">Erro ao carregar serviços</h3>
                    <p class="text-light mt-2">${error.message}</p>
                </div>
            </div>
        `;
    }
}

function renderServicesTable(services) {
    return services.map(service => {
        const margin = service.cost ? ((service.price - service.cost) / service.cost * 100).toFixed(1) : 'N/A';
        
        return `
        <tr data-service-id="${service.id}">
            <td>
                <div><strong>${service.name}</strong></div>
                <small class="text-light">${service.description || ''}</small>
            </td>
            <td>
                <span class="badge badge-primary">${service.category}</span>
            </td>
            <td>
                <strong class="text-orange">${formatCurrency(service.price)}</strong>
            </td>
            <td>${service.estimatedTime}</td>
            <td>
                <span class="${margin !== 'N/A' && margin > 50 ? 'text-success' : 'text-light'}">
                    ${margin !== 'N/A' ? `${margin}%` : 'N/A'}
                </span>
            </td>
            <td>
                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-outline" onclick="editService(${service.id})" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="duplicateService(${service.id})" title="Duplicar">
                        <i class="fas fa-copy"></i>
                    </button>
                    <button class="btn btn-sm btn-outline text-danger" onclick="deleteService(${service.id})" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

function setupPriceEvents() {
    window.openNewServiceModal = function() {
        const modalHTML = `
            <div class="modal active" id="newServiceModal">
                <div class="modal-content" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-tag"></i>
                            Cadastrar Novo Serviço
                        </h3>
                        <button class="modal-close" onclick="system.closeModal('newServiceModal')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="newServiceForm" onsubmit="saveNewService(event)">
                            <div class="grid grid-2 gap-3 mb-3">
                                <div class="form-group">
                                    <label class="form-label">Nome do Serviço *</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Categoria *</label>
                                    <select class="form-control" name="category" required>
                                        <option value="">Selecione...</option>
                                        <option value="Display">Display</option>
                                        <option value="Bateria">Bateria</option>
                                        <option value="Conector">Conector</option>
                                        <option value="Câmera">Câmera</option>
                                        <option value="Áudio">Áudio</option>
                                        <option value="Software">Software</option>
                                        <option value="Limpeza">Limpeza</option>
                                        <option value="Preventiva">Manutenção Preventiva</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="grid grid-3 gap-3 mb-3">
                                <div class="form-group">
                                    <label class="form-label">Preço de Venda (R$) *</label>
                                    <input type="number" class="form-control" name="price" step="0.01" min="0" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Custo (R$)</label>
                                    <input type="number" class="form-control" name="cost" step="0.01" min="0">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Tempo Estimado *</label>
                                    <input type="text" class="form-control" name="estimatedTime" required 
                                           placeholder="Ex: 2 horas">
                                </div>
                            </div>
                            
                            <div class="form-group mb-3">
                                <label class="form-label">Descrição Detalhada</label>
                                <textarea class="form-control" name="description" rows="3" 
                                          placeholder="Descreva o serviço em detalhes..."></textarea>
                            </div>
                            
                            <div class="form-group mb-4">
                                <label class="form-label">Observações Técnicas</label>
                                <textarea class="form-control" name="technicalNotes" rows="2"
                                          placeholder="Informações técnicas importantes..."></textarea>
                            </div>
                            
                            <div class="d-flex justify-end gap-2">
                                <button type="button" class="btn btn-secondary" 
                                        onclick="system.closeModal('newServiceModal')">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save"></i>
                                    Salvar Serviço
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHTML;
    };
    
    window.saveNewService = async function(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const serviceData = Object.fromEntries(formData.entries());
        
        serviceData.price = parseFloat(serviceData.price);
        serviceData.cost = serviceData.cost ? parseFloat(serviceData.cost) : 0;
        
        try {
            const newService = await db.createService(serviceData);
            system.showSuccess('Serviço cadastrado com sucesso!');
            system.closeModal('newServiceModal');
            renderPriceManagement();
        } catch (error) {
            system.showError('Erro ao cadastrar serviço: ' + error.message);
        }
    };
    
    window.editService = async function(serviceId) {
        try {
            const service = db.services.find(s => s.id === serviceId);
            if (!service) {
                system.showError('Serviço não encontrado');
                return;
            }
            
            const modalHTML = `
                <div class="modal active" id="editServiceModal">
                    <div class="modal-content" style="max-width: 700px;">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                <i class="fas fa-edit"></i>
                                Editar Serviço
                            </h3>
                            <button class="modal-close" onclick="system.closeModal('editServiceModal')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="editServiceForm" onsubmit="updateService(event, ${serviceId})">
                                <div class="grid grid-2 gap-3 mb-3">
                                    <div class="form-group">
                                        <label class="form-label">Nome do Serviço *</label>
                                        <input type="text" class="form-control" name="name" 
                                               value="${service.name}" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Categoria *</label>
                                        <select class="form-control" name="category" required>
                                            <option value="Display" ${service.category === 'Display' ? 'selected' : ''}>Display</option>
                                            <option value="Bateria" ${service.category === 'Bateria' ? 'selected' : ''}>Bateria</option>
                                            <option value="Conector" ${service.category === 'Conector' ? 'selected' : ''}>Conector</option>
                                            <option value="Câmera" ${service.category === 'Câmera' ? 'selected' : ''}>Câmera</option>
                                            <option value="Áudio" ${service.category === 'Áudio' ? 'selected' : ''}>Áudio</option>
                                            <option value="Software" ${service.category === 'Software' ? 'selected' : ''}>Software</option>
                                            <option value="Limpeza" ${service.category === 'Limpeza' ? 'selected' : ''}>Limpeza</option>
                                            <option value="Preventiva" ${service.category === 'Preventiva' ? 'selected' : ''}>Preventiva</option>
                                            <option value="Outros" ${service.category === 'Outros' ? 'selected' : ''}>Outros</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="grid grid-3 gap-3 mb-3">
                                    <div class="form-group">
                                        <label class="form-label">Preço de Venda (R$) *</label>
                                        <input type="number" class="form-control" name="price" 
                                               value="${service.price}" step="0.01" min="0" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Custo (R$)</label>
                                        <input type="number" class="form-control" name="cost" 
                                               value="${service.cost || 0}" step="0.01" min="0">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Tempo Estimado *</label>
                                        <input type="text" class="form-control" name="estimatedTime" 
                                               value="${service.estimatedTime}" required>
                                    </div>
                                </div>
                                
                                <div class="form-group mb-3">
                                    <label class="form-label">Descrição Detalhada</label>
                                    <textarea class="form-control" name="description" rows="3">${service.description || ''}</textarea>
                                </div>
                                
                                <div class="form-group mb-4">
                                    <label class="form-label">Observações Técnicas</label>
                                    <textarea class="form-control" name="technicalNotes" rows="2">${service.technicalNotes || ''}</textarea>
                                </div>
                                
                                <div class="d-flex justify-end gap-2">
                                    <button type="button" class="btn btn-secondary" 
                                            onclick="system.closeModal('editServiceModal')">
                                        Cancelar
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        <i class="fas fa-save"></i>
                                        Atualizar Serviço
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('modalContainer').innerHTML = modalHTML;
        } catch (error) {
            system.showError('Erro ao carregar serviço: ' + error.message);
        }
    };
    
    window.updateService = async function(event, serviceId) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const serviceData = Object.fromEntries(formData.entries());
        
        serviceData.price = parseFloat(serviceData.price);
        serviceData.cost = serviceData.cost ? parseFloat(serviceData.cost) : 0;
        
        try {
            const updatedService = await db.updateService(serviceId, serviceData);
            system.showSuccess('Serviço atualizado com sucesso!');
            system.closeModal('editServiceModal');
            renderPriceManagement();
        } catch (error) {
            system.showError('Erro ao atualizar serviço: ' + error.message);
        }
    };
    
    window.duplicateService = async function(serviceId) {
        const service = db.services.find(s => s.id === serviceId);
        if (!service) {
            system.showError('Serviço não encontrado');
            return;
        }
        
        const newService = {
            ...service,
            id: undefined,
            name: `${service.name} (Cópia)`
        };
        
        try {
            await db.createService(newService);
            system.showSuccess('Serviço duplicado com sucesso!');
            renderPriceManagement();
        } catch (error) {
            system.showError('Erro ao duplicar serviço: ' + error.message);
        }
    };
    
    window.deleteService = async function(serviceId) {
        if (confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
            try {
                const index = db.services.findIndex(s => s.id === serviceId);
                if (index !== -1) {
                    db.services.splice(index, 1);
                    system.showSuccess('Serviço excluído com sucesso!');
                    renderPriceManagement();
                }
            } catch (error) {
                system.showError('Erro ao excluir serviço: ' + error.message);
            }
        }
    };
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}