// src/pages/price.page.js - VERSÃO OTIMIZADA
import { PriceRepo } from '../data/price.repo.js';
import { Table } from '../components/table.js';
import { Modal } from '../components/modal.js';
import { Form } from '../components/form.js';
import { FilterBar } from '../components/filter-bar.js';
import { formatService } from '../services/format.service.js';
import { ExportService } from '../services/export.service.js';
import { Toast } from '../components/toast.js';
import { validateService } from '../services/validate.service.js';

export const PricePage = (() => {
  const state = {
    filters: {
      brand: '',
      model: '',
      category: '',
      search: '',
      active: ''
    },
    sort: {
      field: 'brand',
      direction: 'asc'
    },
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0
    },
    selectedPrices: new Set(),
    brands: [],
    models: [],
    categories: []
  };

  let root = null;
  let table = null;
  let priceModal = null;
  let filterBar = null;

  async function init() {
    root.innerHTML = `
      <div class="price-page">
        <header class="page-header">
          <div class="header-left">
            <h1><i class="fas fa-tags"></i> Catálogo de Preços</h1>
            <p class="subtitle">Gerencie serviços, valores e condições de pagamento</p>
            <div class="selected-actions" id="selectedActions" style="display: none;">
              <span class="selected-count">0 selecionados</span>
              <button class="btn btn-sm btn-outline" id="btnBulkStatus">
                <i class="fas fa-toggle-on"></i> Alterar Status
              </button>
              <button class="btn btn-sm btn-outline btn-danger" id="btnBulkDelete">
                <i class="fas fa-trash"></i> Excluir
              </button>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="btnAddPrice">
              <i class="fas fa-plus-circle"></i> Novo Serviço
            </button>
            <div class="dropdown">
              <button class="btn btn-secondary dropdown-toggle" data-toggle="dropdown">
                <i class="fas fa-download"></i> Exportar
              </button>
              <div class="dropdown-menu">
                <a class="dropdown-item" href="#" data-export="csv">CSV</a>
                <a class="dropdown-item" href="#" data-export="excel">Excel</a>
                <a class="dropdown-item" href="#" data-export="pdf">PDF</a>
              </div>
            </div>
            <button class="btn btn-icon" id="btnRefresh" title="Atualizar">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </header>

        <div class="page-content">
          <div id="priceFilters"></div>
          <div id="priceStats"></div>
          <div class="table-container" id="priceTable"></div>
          <div id="pricePagination"></div>
        </div>
      </div>
    `;

    await loadInitialData();
    await renderFilters();
    await renderStats();
    await renderTable();
    await renderPagination();
    bindEvents();
  }

  async function loadInitialData() {
    try {
      const [brands, categories] = await Promise.all([
        PriceRepo.getBrands(),
        PriceRepo.getCategories()
      ]);
      
      state.brands = brands;
      state.categories = categories;
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      Toast.error('Erro ao carregar dados iniciais');
    }
  }

  async function renderFilters() {
    const container = root.querySelector('#priceFilters');
    
    filterBar = FilterBar.create({
      filters: [
        {
          type: 'search',
          placeholder: 'Buscar por serviço, marca, modelo...',
          onSearch: onSearch,
          icon: 'search'
        },
        {
          type: 'select',
          name: 'brand',
          label: 'Marca',
          options: [
            { value: '', label: 'Todas as marcas' },
            ...state.brands.map(brand => ({ value: brand, label: brand }))
          ],
          onChange: async (name, value) => {
            state.filters.brand = value;
            if (value) {
              state.models = await PriceRepo.getModels(value);
              filterBar.updateFilter('model', {
                options: [
                  { value: '', label: 'Todos os modelos' },
                  ...state.models.map(model => ({ value: model, label: model }))
                ],
                disabled: false
              });
            } else {
              state.models = [];
              filterBar.updateFilter('model', {
                options: [{ value: '', label: 'Todos os modelos' }],
                disabled: true
              });
            }
            state.filters.model = '';
            state.pagination.currentPage = 1;
            await loadPrices();
          }
        },
        {
          type: 'select',
          name: 'model',
          label: 'Modelo',
          options: [{ value: '', label: 'Todos os modelos' }],
          disabled: true,
          onChange: onFilterChange
        },
        {
          type: 'select',
          name: 'category',
          label: 'Categoria',
          options: [
            { value: '', label: 'Todas as categorias' },
            ...state.categories.map(cat => ({ value: cat, label: cat }))
          ],
          onChange: onFilterChange
        },
        {
          type: 'select',
          name: 'active',
          label: 'Status',
          options: [
            { value: '', label: 'Todos' },
            { value: 'true', label: 'Ativos' },
            { value: 'false', label: 'Inativos' }
          ],
          onChange: onFilterChange
        }
      ],
      onClear: onClearFilters,
      showClearButton: true
    });

    container.appendChild(filterBar.element);
  }

  async function renderStats() {
    const container = root.querySelector('#priceStats');
    
    try {
      const stats = await PriceRepo.getStats();
      
      container.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon bg-primary">
              <i class="fas fa-boxes"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${stats.totalItems || 0}</div>
              <div class="stat-label">Serviços Cadastrados</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-success">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${stats.activeItems || 0}</div>
              <div class="stat-label">Serviços Ativos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-warning">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${formatService.formatCurrency(stats.avgPrice || 0)}</div>
              <div class="stat-label">Preço Médio</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-info">
              <i class="fas fa-layer-group"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${stats.totalBrands || 0}</div>
              <div class="stat-label">Marcas</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon bg-secondary">
              <i class="fas fa-folder"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">${stats.totalCategories || 0}</div>
              <div class="stat-label">Categorias</div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      container.innerHTML = '';
    }
  }

  async function renderTable() {
    const container = root.querySelector('#priceTable');
    
    table = Table.create({
      id: 'priceTable',
      columns: [
        { 
          id: 'select', 
          label: '<input type="checkbox" id="selectAllPrices">', 
          render: renderCheckbox,
          width: '50px',
          align: 'center'
        },
        { 
          id: 'brand', 
          label: 'Marca', 
          sortable: true,
          render: renderBrand,
          width: '120px'
        },
        { 
          id: 'model', 
          label: 'Modelo',
          sortable: true,
          width: '150px'
        },
        { 
          id: 'service', 
          label: 'Serviço',
          sortable: true,
          render: renderService
        },
        { 
          id: 'category', 
          label: 'Categoria',
          sortable: true,
          render: renderCategory,
          width: '150px'
        },
        { 
          id: 'price', 
          label: 'Preço',
          sortable: true,
          render: renderPrice,
          width: '150px',
          align: 'right'
        },
        { 
          id: 'paymentMethods', 
          label: 'Pagamento',
          render: renderPaymentMethods,
          width: '180px'
        },
        { 
          id: 'status', 
          label: 'Status',
          sortable: true,
          render: renderStatus,
          width: '120px'
        },
        { 
          id: 'actions', 
          label: 'Ações',
          render: renderActions,
          width: '140px',
          align: 'center'
        }
      ],
      onRowClick: onRowClick,
      onSort: onTableSort,
      emptyMessage: 'Nenhum preço cadastrado',
      loadingMessage: 'Carregando preços...',
      rowClass: (row) => {
        if (!row.active) return 'row-inactive';
        if (row.promoPrice) return 'row-promo';
        return '';
      }
    });

    container.appendChild(table.element);
    await loadPrices();
  }

  async function renderPagination() {
    const container = root.querySelector('#pricePagination');
    if (!container) return;

    const totalPages = state.pagination.totalPages;
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="pagination">
        <button class="btn btn-sm btn-outline ${state.pagination.currentPage === 1 ? 'disabled' : ''}" 
                id="btnFirstPage" ${state.pagination.currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-double-left"></i>
        </button>
        <button class="btn btn-sm btn-outline ${state.pagination.currentPage === 1 ? 'disabled' : ''}" 
                id="btnPrevPage" ${state.pagination.currentPage === 1 ? 'disabled' : ''}>
          <i class="fas fa-angle-left"></i>
        </button>
        
        <div class="pagination-info">
          Página <strong>${state.pagination.currentPage}</strong> de <strong>${totalPages}</strong>
          <span class="text-muted">(${state.pagination.totalItems} registros)</span>
        </div>
        
        <button class="btn btn-sm btn-outline ${state.pagination.currentPage === totalPages ? 'disabled' : ''}" 
                id="btnNextPage" ${state.pagination.currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-right"></i>
        </button>
        <button class="btn btn-sm btn-outline ${state.pagination.currentPage === totalPages ? 'disabled' : ''}" 
                id="btnLastPage" ${state.pagination.currentPage === totalPages ? 'disabled' : ''}>
          <i class="fas fa-angle-double-right"></i>
        </button>
        
        <div class="page-size-selector">
          <label>Exibir:</label>
          <select id="pageSizeSelect" class="form-select form-select-sm">
            <option value="20" ${state.pagination.pageSize === 20 ? 'selected' : ''}>20</option>
            <option value="50" ${state.pagination.pageSize === 50 ? 'selected' : ''}>50</option>
            <option value="100" ${state.pagination.pageSize === 100 ? 'selected' : ''}>100</option>
            <option value="200" ${state.pagination.pageSize === 200 ? 'selected' : ''}>200</option>
          </select>
        </div>
      </div>
    `;

    bindPaginationEvents();
  }

  function renderCheckbox(row) {
    return `
      <input type="checkbox" class="price-select" value="${row.id}" 
             ${state.selectedPrices.has(row.id) ? 'checked' : ''}
             data-id="${row.id}">
    `;
  }

  function renderBrand(row) {
    return `
      <div class="brand-info">
        <div class="brand-name">${row.brand}</div>
        ${row.deviceType ? `<small class="text-muted">${row.deviceType}</small>` : ''}
      </div>
    `;
  }

  function renderService(row) {
    return `
      <div class="service-info">
        <div class="service-name">${row.service}</div>
        ${row.description ? `<small class="text-muted">${row.description}</small>` : ''}
      </div>
    `;
  }

  function renderCategory(row) {
    const categoryColors = {
      'Manutenção': 'primary',
      'Troca de Peça': 'info',
      'Limpeza': 'success',
      'Software': 'warning',
      'Diagnóstico': 'secondary',
      'Garantia': 'danger'
    };
    
    const color = categoryColors[row.category] || 'secondary';
    
    return `
      <span class="badge badge-${color}">
        <i class="fas fa-folder"></i> ${row.category}
      </span>
    `;
  }

  function renderPrice(row) {
    const hasPromo = row.promoPrice && row.promoPrice < row.price;
    const finalPrice = hasPromo ? row.promoPrice : row.price;
    
    return `
      <div class="price-cell">
        ${hasPromo ? `
          <div class="price-original text-muted" style="text-decoration: line-through; font-size: 0.85em;">
            ${formatService.formatCurrency(row.price)}
          </div>
        ` : ''}
        <div class="price-final ${hasPromo ? 'text-success' : ''}">
          <strong>${formatService.formatCurrency(finalPrice)}</strong>
        </div>
        ${row.estimatedTime ? `
          <div class="price-details">
            <small class="text-muted">
              <i class="fas fa-clock"></i> ${row.estimatedTime} ${row.estimatedTime === 1 ? 'dia' : 'dias'}
            </small>
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderPaymentMethods(row) {
    if (!row.paymentMethods || row.paymentMethods.length === 0) {
      return '<span class="text-muted">-</span>';
    }
    
    const methodIcons = {
      'PIX': { icon: 'qrcode', color: 'success' },
      'DINHEIRO': { icon: 'money-bill-wave', color: 'primary' },
      'CREDITO': { icon: 'credit-card', color: 'info' },
      'DEBITO': { icon: 'credit-card', color: 'warning' },
      'BOLETO': { icon: 'barcode', color: 'secondary' },
      'TRANSFERÊNCIA': { icon: 'exchange-alt', color: 'dark' }
    };
    
    return row.paymentMethods.map(method => {
      const config = methodIcons[method] || { icon: 'money-check', color: 'secondary' };
      return `
        <span class="badge badge-${config.color} badge-sm mr-1" title="${method}">
          <i class="fas fa-${config.icon}"></i>
        </span>
      `;
    }).join('');
  }

  function renderStatus(row) {
    if (row.active) {
      return `
        <span class="badge badge-success badge-pill">
          <i class="fas fa-check-circle"></i> Ativo
        </span>
      `;
    } else {
      return `
        <span class="badge badge-secondary badge-pill">
          <i class="fas fa-times-circle"></i> Inativo
        </span>
      `;
    }
  }

  function renderActions(row) {
    return `
      <div class="btn-group btn-group-sm">
        <button class="btn btn-outline" data-action="view" data-id="${row.id}" title="Visualizar">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn btn-outline" data-action="edit" data-id="${row.id}" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-outline" data-action="duplicate" data-id="${row.id}" title="Duplicar">
          <i class="fas fa-copy"></i>
        </button>
        <button class="btn btn-outline btn-danger" data-action="delete" data-id="${row.id}" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }

  async function loadPrices() {
    try {
      table.showLoading();
      
      const response = await PriceRepo.list({
        filters: state.filters,
        sort: state.sort,
        page: state.pagination.currentPage,
        pageSize: state.pagination.pageSize
      });

      table.update(response.data || response);
      
      if (response.pagination) {
        state.pagination = {
          ...state.pagination,
          ...response.pagination
        };
        await renderPagination();
      }
      
      updateSelectedActions();
    } catch (error) {
      console.error('Erro ao carregar preços:', error);
      Toast.error('Erro ao carregar catálogo de preços');
      table.showEmpty();
    }
  }

  function bindEvents() {
    // Novo preço
    root.querySelector('#btnAddPrice').addEventListener('click', () => {
      openPriceModal();
    });

    // Atualizar
    root.querySelector('#btnRefresh').addEventListener('click', async () => {
      await loadPrices();
      await renderStats();
      Toast.success('Catálogo atualizado');
    });

    // Exportar
    root.querySelectorAll('[data-export]').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.preventDefault();
        const format = e.target.dataset.export;
        await onExport(format);
      });
    });

    // Selecionar todos
    root.addEventListener('change', (e) => {
      if (e.target.id === 'selectAllPrices') {
        const checkboxes = root.querySelectorAll('.price-select');
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked;
          const priceId = cb.value;
          if (e.target.checked) {
            state.selectedPrices.add(priceId);
          } else {
            state.selectedPrices.delete(priceId);
          }
        });
        updateSelectedActions();
      }

      if (e.target.classList.contains('price-select')) {
        const priceId = e.target.value;
        if (e.target.checked) {
          state.selectedPrices.add(priceId);
        } else {
          state.selectedPrices.delete(priceId);
          root.querySelector('#selectAllPrices').checked = false;
        }
        updateSelectedActions();
      }
    });

    // Delegação de eventos da tabela
    root.querySelector('#priceTable').addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const priceId = button.dataset.id;

      switch(action) {
        case 'view': onView(priceId); break;
        case 'edit': onEdit(priceId); break;
        case 'duplicate': onDuplicate(priceId); break;
        case 'delete': onDelete(priceId); break;
      }
    });

    // Ações em lote
    root.querySelector('#btnBulkStatus').addEventListener('click', onBulkStatus);
    root.querySelector('#btnBulkDelete').addEventListener('click', onBulkDelete);
  }

  function bindPaginationEvents() {
    root.querySelector('#btnFirstPage')?.addEventListener('click', () => {
      state.pagination.currentPage = 1;
      loadPrices();
    });

    root.querySelector('#btnPrevPage')?.addEventListener('click', () => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        loadPrices();
      }
    });

    root.querySelector('#btnNextPage')?.addEventListener('click', () => {
      if (state.pagination.currentPage < state.pagination.totalPages) {
        state.pagination.currentPage++;
        loadPrices();
      }
    });

    root.querySelector('#btnLastPage')?.addEventListener('click', () => {
      state.pagination.currentPage = state.pagination.totalPages;
      loadPrices();
    });

    root.querySelector('#pageSizeSelect')?.addEventListener('change', (e) => {
      state.pagination.pageSize = parseInt(e.target.value);
      state.pagination.currentPage = 1;
      loadPrices();
    });
  }

  function updateSelectedActions() {
    const selectedActions = root.querySelector('#selectedActions');
    const selectedCount = root.querySelector('.selected-count');
    const count = state.selectedPrices.size;
    
    if (count > 0) {
      selectedActions.style.display = 'flex';
      selectedCount.textContent = `${count} selecionado(s)`;
    } else {
      selectedActions.style.display = 'none';
    }
  }

  async function openPriceModal(price = null) {
    const isEdit = !!price;
    
    try {
      const form = Form.create({
        id: 'priceForm',
        layout: 'grid',
        columns: 2,
        fields: [
          {
            type: 'select',
            name: 'brand',
            label: 'Marca *',
            required: true,
            options: [
              { value: '', label: 'Selecione uma marca' },
              ...state.brands.map(brand => ({ value: brand, label: brand }))
            ],
            value: price?.brand || '',
            validation: { required: true }
          },
          {
            type: 'text',
            name: 'model',
            label: 'Modelo *',
            required: true,
            value: price?.model || '',
            validation: { required: true, minLength: 2 }
          },
          {
            type: 'select',
            name: 'category',
            label: 'Categoria *',
            required: true,
            options: [
              { value: '', label: 'Selecione uma categoria' },
              ...state.categories.map(cat => ({ value: cat, label: cat }))
            ],
            value: price?.category || '',
            validation: { required: true }
          },
          {
            type: 'select',
            name: 'deviceType',
            label: 'Tipo de Aparelho',
            options: [
              { value: '', label: 'Qualquer' },
              { value: 'CELULAR', label: 'Celular' },
              { value: 'TABLET', label: 'Tablet' },
              { value: 'NOTEBOOK', label: 'Notebook' },
              { value: 'COMPUTADOR', label: 'Computador' },
              { value: 'IMPRESSORA', label: 'Impressora' }
            ],
            value: price?.deviceType || ''
          },
          {
            type: 'text',
            name: 'service',
            label: 'Serviço *',
            required: true,
            value: price?.service || '',
            validation: { required: true, minLength: 3 }
          },
          {
            type: 'textarea',
            name: 'description',
            label: 'Descrição',
            value: price?.description || '',
            rows: 2,
            placeholder: 'Descrição detalhada do serviço...'
          },
          {
            type: 'number',
            name: 'price',
            label: 'Preço (R$) *',
            required: true,
            min: 0,
            step: 0.01,
            value: price?.price || 0,
            validation: { required: true, min: 0.01 }
          },
          {
            type: 'number',
            name: 'promoPrice',
            label: 'Preço Promocional (R$)',
            min: 0,
            step: 0.01,
            value: price?.promoPrice || '',
            placeholder: 'Opcional'
          },
          {
            type: 'number',
            name: 'estimatedTime',
            label: 'Tempo Estimado (dias)',
            value: price?.estimatedTime || 1,
            min: 1,
            max: 30
          },
          {
            type: 'number',
            name: 'warranty',
            label: 'Garantia (dias)',
            value: price?.warranty || 90,
            min: 0
          },
          {
            type: 'checkbox-group',
            name: 'paymentMethods',
            label: 'Formas de Pagamento',
            options: [
              { value: 'PIX', label: 'PIX', checked: true },
              { value: 'DINHEIRO', label: 'Dinheiro', checked: true },
              { value: 'CREDITO', label: 'Cartão Crédito', checked: false },
              { value: 'DEBITO', label: 'Cartão Débito', checked: false },
              { value: 'BOLETO', label: 'Boleto', checked: false },
              { value: 'TRANSFERÊNCIA', label: 'Transferência', checked: false }
            ],
            value: price?.paymentMethods || ['PIX', 'DINHEIRO']
          },
          {
            type: 'switch',
            name: 'active',
            label: 'Ativo',
            value: price?.active !== false,
            help: 'Serviços inativos não aparecem nas consultas'
          }
        ],
        onSubmit: (formData) => savePrice(isEdit, price?.id, formData)
      });

      priceModal = Modal.create({
        title: isEdit ? 'Editar Serviço' : 'Novo Serviço',
        size: 'lg',
        content: form.element,
        onConfirm: () => form.submit(),
        onClose: () => priceModal.close(),
        confirmText: isEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'
      });

      priceModal.open();
    } catch (error) {
      console.error('Erro ao abrir modal:', error);
      Toast.error('Erro ao carregar formulário');
    }
  }

  async function savePrice(isEdit, priceId, formData) {
    try {
      // Validar dados
      if (!formData.brand || !formData.model || !formData.service || !formData.category) {
        Toast.warning('Preencha todos os campos obrigatórios');
        return;
      }

      if (formData.price <= 0) {
        Toast.warning('O preço deve ser maior que zero');
        return;
      }

      if (formData.promoPrice && formData.promoPrice >= formData.price) {
        Toast.warning('O preço promocional deve ser menor que o preço normal');
        return;
      }

      // Processar dados
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        promoPrice: formData.promoPrice ? parseFloat(formData.promoPrice) : null,
        estimatedTime: parseInt(formData.estimatedTime) || 1,
        warranty: parseInt(formData.warranty) || 90,
        active: formData.active === 'true' || formData.active === true
      };

      if (isEdit) {
        await PriceRepo.update(priceId, data);
        Toast.success('Serviço atualizado com sucesso');
      } else {
        await PriceRepo.create(data);
        Toast.success('Serviço cadastrado com sucesso');
      }
      
      priceModal.close();
      await loadPrices();
      await renderStats();
    } catch (error) {
      console.error('Erro ao salvar preço:', error);
      Toast.error('Erro ao salvar serviço');
    }
  }

  async function onView(priceId) {
    try {
      const price = await PriceRepo.getById(priceId);
      if (price) {
        openPriceModal(price);
        // Desabilitar campos no modo visualização
        const form = document.getElementById('priceForm');
        if (form) {
          Array.from(form.elements).forEach(element => {
            element.disabled = true;
          });
        }
      }
    } catch (error) {
      console.error('Erro ao visualizar serviço:', error);
      Toast.error('Erro ao carregar serviço');
    }
  }

  async function onEdit(priceId) {
    try {
      const price = await PriceRepo.getById(priceId);
      if (price) {
        openPriceModal(price);
      }
    } catch (error) {
      console.error('Erro ao editar serviço:', error);
      Toast.error('Erro ao carregar serviço');
    }
  }

  async function onDuplicate(priceId) {
    try {
      const price = await PriceRepo.getById(priceId);
      if (price) {
        const duplicate = { ...price, id: undefined };
        openPriceModal(duplicate);
      }
    } catch (error) {
      console.error('Erro ao duplicar serviço:', error);
      Toast.error('Erro ao duplicar serviço');
    }
  }

  async function onDelete(priceId) {
    if (!confirm('Tem certeza que deseja excluir este serviço?\nEsta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await PriceRepo.remove(priceId);
      Toast.success('Serviço excluído com sucesso');
      await loadPrices();
      await renderStats();
    } catch (error) {
      console.error('Erro ao excluir serviço:', error);
      Toast.error('Erro ao excluir serviço');
    }
  }

  async function onBulkStatus() {
    if (state.selectedPrices.size === 0) {
      Toast.warning('Nenhum serviço selecionado');
      return;
    }

    const newStatus = confirm('Deseja ativar os serviços selecionados?')
      ? 'true'
      : 'false';

    try {
      await PriceRepo.bulkUpdateStatus(Array.from(state.selectedPrices), newStatus === 'true');
      Toast.success(`${state.selectedPrices.size} serviços atualizados`);
      state.selectedPrices.clear();
      await loadPrices();
      await renderStats();
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      Toast.error('Erro ao atualizar status');
    }
  }

  async function onBulkDelete() {
    if (state.selectedPrices.size === 0) {
      Toast.warning('Nenhum serviço selecionado');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${state.selectedPrices.size} serviço(s)?\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await PriceRepo.bulkDelete(Array.from(state.selectedPrices));
      Toast.success(`${state.selectedPrices.size} serviços excluídos`);
      state.selectedPrices.clear();
      await loadPrices();
      await renderStats();
    } catch (error) {
      console.error('Erro ao excluir serviços em lote:', error);
      Toast.error('Erro ao excluir serviços');
    }
  }

  async function onExport(format) {
    try {
      table.showLoading();
      const prices = await PriceRepo.listAll(state.filters, state.sort);
      
      switch(format) {
        case 'csv':
          ExportService.toCSV(prices, 'catalogo-precos');
          break;
        case 'excel':
          ExportService.toExcel(prices, 'catalogo-precos');
          break;
        case 'pdf':
          const pdf = await PDFService.generatePriceCatalog(prices);
          pdf.save('catalogo-precos.pdf');
          break;
      }
      
      Toast.success(`Exportação ${format.toUpperCase()} concluída`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      Toast.error('Erro na exportação');
    } finally {
      await loadPrices();
    }
  }

  function onSearch(query) {
    state.filters.search = query;
    state.pagination.currentPage = 1;
    loadPrices();
  }

  function onFilterChange(name, value) {
    state.filters[name] = value;
    state.pagination.currentPage = 1;
    loadPrices();
  }

  function onClearFilters() {
    state.filters = {
      brand: '',
      model: '',
      category: '',
      search: '',
      active: ''
    };
    state.pagination.currentPage = 1;
    
    if (filterBar) {
      filterBar.clear();
      filterBar.updateFilter('model', {
        options: [{ value: '', label: 'Todos os modelos' }],
        disabled: true
      });
    }
    
    loadPrices();
  }

  function onTableSort(field, direction) {
    state.sort.field = field;
    state.sort.direction = direction;
    loadPrices();
  }

  function onRowClick(row, event) {
    // Não faz nada se clicou em checkbox ou botão de ação
    if (event.target.closest('input[type="checkbox"]') || 
        event.target.closest('[data-action]')) {
      return;
    }
    onView(row.id);
  }

  return {
    async mount({ rootEl }) {
      root = rootEl;
      await init();
    },

    unmount() {
      if (priceModal) {
        priceModal.close();
      }
      
      // Limpar eventos
      root.innerHTML = '';
      
      root = null;
      table = null;
      priceModal = null;
      filterBar = null;
    }
  };
})();