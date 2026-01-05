// src/pages/orderservice.page.js - VERSÃO MELHORADA
import { OSRepo } from '../data/os.repo.js';
import { CRMRepo } from '../data/crm.repo.js';
import { PriceRepo } from '../data/price.repo.js';
import { Table } from '../components/table.js';
import { OrderModal } from '../components/order-modal.js';
import { FilterBar } from '../components/filter-bar.js';
import { formatService } from '../services/format.service.js';
import { PDFService } from '../services/pdf.service.js';
import { ExportService } from '../services/export.service.js';
import { Toast } from '../components/toast.js';

export const OrderServicePage = (() => {
  const state = {
    filters: {
      status: '',
      dateRange: '',
      search: '',
      technician: ''
    },
    sort: {
      field: 'createdAt',
      direction: 'desc'
    },
    selectedOrders: new Set(),
    pagination: {
      currentPage: 1,
      pageSize: 50,
      totalItems: 0,
      totalPages: 0
    }
  };

  let root = null;
  let table = null;
  let orderModal = null;
  let filterBar = null;

  async function init() {
    root.innerHTML = `
      <div class="orders-page">
        <header class="page-header">
          <div class="header-left">
            <h1><i class="fas fa-clipboard-list"></i> Ordens de Serviço</h1>
            <div class="selected-actions" id="selectedActions" style="display: none;">
              <span class="selected-count">0 selecionadas</span>
              <button class="btn btn-sm btn-outline" id="btnBulkStatus">
                <i class="fas fa-edit"></i> Alterar Status
              </button>
              <button class="btn btn-sm btn-outline btn-danger" id="btnBulkDelete">
                <i class="fas fa-trash"></i> Excluir
              </button>
            </div>
          </div>
          <div class="header-actions">
            <button class="btn btn-primary" id="btnNewOrder">
              <i class="fas fa-plus-circle"></i> Nova OS
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
          <div id="orderFilters"></div>
          <div class="table-container" id="orderTable"></div>
          <div id="orderSummary"></div>
          <div id="orderPagination"></div>
        </div>
      </div>
    `;

    await renderFilters();
    await renderTable();
    await renderSummary();
    await renderPagination();
    bindEvents();
  }

  async function renderFilters() {
    const container = root.querySelector('#orderFilters');
    
    try {
      const technicians = await OSRepo.getTechnicians();
      
      filterBar = FilterBar.create({
        filters: [
          {
            type: 'search',
            placeholder: 'Buscar por cliente, OS, aparelho...',
            onSearch: onSearch,
            icon: 'search'
          },
          {
            type: 'select',
            name: 'status',
            label: 'Status',
            options: [
              { value: '', label: 'Todos os status' },
              { value: 'ABERTA', label: 'Abertas', badge: 'primary' },
              { value: 'EM ANDAMENTO', label: 'Em Andamento', badge: 'warning' },
              { value: 'AGUARDANDO PEÇA', label: 'Aguardando Peça', badge: 'info' },
              { value: 'FINALIZADA', label: 'Finalizadas', badge: 'success' },
              { value: 'ENTREGUE', label: 'Entregues', badge: 'secondary' },
              { value: 'CANCELADA', label: 'Canceladas', badge: 'danger' }
            ],
            onChange: onFilterChange
          },
          {
            type: 'select',
            name: 'technician',
            label: 'Técnico',
            options: [
              { value: '', label: 'Todos os técnicos' },
              ...technicians.map(t => ({ value: t.id, label: t.name }))
            ],
            onChange: onFilterChange
          },
          {
            type: 'date-range',
            name: 'dateRange',
            label: 'Período',
            presets: [
              { label: 'Hoje', value: 'today' },
              { label: 'Esta semana', value: 'week' },
              { label: 'Este mês', value: 'month' },
              { label: 'Últimos 30 dias', value: '30days' }
            ],
            onChange: onFilterChange
          }
        ],
        onClear: onClearFilters,
        showClearButton: true
      });

      container.appendChild(filterBar.element);
    } catch (error) {
      console.error('Erro ao carregar filtros:', error);
      Toast.error('Erro ao carregar filtros');
    }
  }

  async function renderTable() {
    const container = root.querySelector('#orderTable');
    
    table = Table.create({
      id: 'ordersTable',
      columns: [
        { 
          id: 'select', 
          label: '<input type="checkbox" id="selectAll">', 
          render: renderCheckbox,
          width: '50px',
          align: 'center'
        },
        { 
          id: 'id', 
          label: 'OS #', 
          sortable: true,
          render: renderOrderId,
          width: '120px'
        },
        { 
          id: 'client', 
          label: 'Cliente',
          render: renderClient,
          sortable: true
        },
        { 
          id: 'device', 
          label: 'Aparelho',
          render: renderDevice
        },
        { 
          id: 'services', 
          label: 'Serviços',
          render: renderServices,
          width: '200px'
        },
        { 
          id: 'total', 
          label: 'Total',
          sortable: true,
          render: renderTotal,
          width: '120px',
          align: 'right'
        },
        { 
          id: 'status', 
          label: 'Status',
          sortable: true,
          render: renderStatus,
          width: '150px'
        },
        { 
          id: 'technician', 
          label: 'Técnico',
          render: renderTechnician,
          width: '150px'
        },
        { 
          id: 'createdAt', 
          label: 'Data',
          sortable: true,
          render: renderDate,
          width: '120px'
        },
        { 
          id: 'actions', 
          label: 'Ações',
          render: renderActions,
          width: '120px',
          align: 'center'
        }
      ],
      onRowClick: onRowClick,
      onSort: onTableSort,
      emptyMessage: 'Nenhuma ordem de serviço encontrada',
      loadingMessage: 'Carregando ordens...',
      rowClass: (row) => {
        if (row.priority === 'URGENTE') return 'row-urgent';
        if (row.status === 'CANCELADA') return 'row-canceled';
        return '';
      }
    });

    container.appendChild(table.element);
    await loadOrders();
  }

  async function renderSummary() {
    const container = root.querySelector('#orderSummary');
    container.innerHTML = `
      <div class="summary-cards">
        <div class="summary-card" data-status="ABERTA">
          <div class="summary-icon bg-primary">
            <i class="fas fa-clock"></i>
          </div>
          <div class="summary-content">
            <div class="summary-count" id="countAberta">0</div>
            <div class="summary-label">Em Aberto</div>
          </div>
        </div>
        <div class="summary-card" data-status="EM ANDAMENTO">
          <div class="summary-icon bg-warning">
            <i class="fas fa-tools"></i>
          </div>
          <div class="summary-content">
            <div class="summary-count" id="countAndamento">0</div>
            <div class="summary-label">Em Andamento</div>
          </div>
        </div>
        <div class="summary-card" data-status="AGUARDANDO PEÇA">
          <div class="summary-icon bg-info">
            <i class="fas fa-box"></i>
          </div>
          <div class="summary-content">
            <div class="summary-count" id="countAguardando">0</div>
            <div class="summary-label">Aguardando Peça</div>
          </div>
        </div>
        <div class="summary-card" data-status="FINALIZADA">
          <div class="summary-icon bg-success">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="summary-content">
            <div class="summary-count" id="countFinalizada">0</div>
            <div class="summary-label">Finalizadas</div>
          </div>
        </div>
        <div class="summary-card" data-status="TOTAL">
          <div class="summary-icon bg-secondary">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <div class="summary-content">
            <div class="summary-count" id="countTotal">0</div>
            <div class="summary-label">Total</div>
            <div class="summary-value" id="totalValue">R$ 0,00</div>
          </div>
        </div>
      </div>
    `;
  }

  async function renderPagination() {
    const container = root.querySelector('#orderPagination');
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
      <input type="checkbox" class="order-select" value="${row.id}" 
             ${state.selectedOrders.has(row.id) ? 'checked' : ''}
             data-id="${row.id}">
    `;
  }

  function renderOrderId(row) {
    const priorityBadge = row.priority === 'URGENTE' 
      ? '<span class="badge badge-danger badge-sm"><i class="fas fa-exclamation"></i></span> '
      : '';
    
    return `
      <div class="order-id">
        <div>
          ${priorityBadge}
          <strong class="order-number">#${String(row.id).padStart(6, '0')}</strong>
        </div>
        <small class="text-muted">${formatService.formatDate(row.createdAt, 'DD/MM/YYYY HH:mm')}</small>
      </div>
    `;
  }

  function renderClient(row) {
    return `
      <div class="client-info">
        <div class="client-name">${row.clientName}</div>
        <div class="client-contact">
          ${row.clientPhone ? `<i class="fas fa-phone"></i> ${formatService.formatPhone(row.clientPhone)}` : ''}
          ${row.clientEmail ? `<br><i class="fas fa-envelope"></i> ${row.clientEmail}` : ''}
        </div>
      </div>
    `;
  }

  function renderDevice(row) {
    return `
      <div class="device-info">
        <div class="device-model">${row.deviceModel || '-'}</div>
        <div class="device-details">
          ${row.deviceBrand ? `<span class="badge badge-light">${row.deviceBrand}</span>` : ''}
          ${row.deviceSerial ? `<span class="badge badge-light">S/N: ${row.deviceSerial}</span>` : ''}
        </div>
      </div>
    `;
  }

  function renderServices(row) {
    if (!row.services || row.services.length === 0) return '-';
    
    const servicesHtml = row.services.slice(0, 3).map(s => 
      `<span class="badge badge-outline badge-sm">${s.name}</span>`
    ).join('');
    
    const extraCount = row.services.length > 3 
      ? `<span class="badge badge-secondary badge-sm">+${row.services.length - 3}</span>`
      : '';
    
    return `<div class="services-list">${servicesHtml}${extraCount}</div>`;
  }

  function renderTotal(row) {
    return `
      <div class="text-right">
        <strong>${formatService.formatCurrency(row.total)}</strong>
        ${row.discount > 0 ? `<small class="text-danger d-block">-${formatService.formatCurrency(row.discount)}</small>` : ''}
      </div>
    `;
  }

  function renderStatus(row) {
    const statusConfig = {
      'ABERTA': { class: 'badge-primary', icon: 'clock' },
      'EM ANDAMENTO': { class: 'badge-warning', icon: 'tools' },
      'AGUARDANDO PEÇA': { class: 'badge-info', icon: 'box' },
      'FINALIZADA': { class: 'badge-success', icon: 'check-circle' },
      'ENTREGUE': { class: 'badge-secondary', icon: 'check-double' },
      'CANCELADA': { class: 'badge-danger', icon: 'times-circle' }
    };

    const config = statusConfig[row.status] || { class: 'badge-secondary', icon: 'question' };

    return `
      <span class="badge ${config.class} badge-pill">
        <i class="fas fa-${config.icon}"></i> ${row.status}
      </span>
    `;
  }

  function renderTechnician(row) {
    return row.technicianName || '-';
  }

  function renderDate(row) {
    return formatService.formatDate(row.createdAt, 'DD/MM/YYYY');
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
        <button class="btn btn-outline" data-action="print" data-id="${row.id}" title="Imprimir">
          <i class="fas fa-print"></i>
        </button>
        <button class="btn btn-outline btn-danger" data-action="delete" data-id="${row.id}" title="Excluir">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    `;
  }

  async function loadOrders() {
    try {
      table.showLoading();
      
      const response = await OSRepo.list({
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
      
      updateSummary(response.data || response);
      updateSelectedActions();
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      Toast.error('Erro ao carregar ordens de serviço');
      table.showEmpty();
    }
  }

  function updateSummary(orders) {
    const counts = {
      ABERTA: 0,
      'EM ANDAMENTO': 0,
      'AGUARDANDO PEÇA': 0,
      FINALIZADA: 0,
      ENTREGUE: 0,
      CANCELADA: 0,
      TOTAL: orders.length
    };

    let totalValue = 0;

    orders.forEach(order => {
      counts[order.status] = (counts[order.status] || 0) + 1;
      totalValue += order.total || 0;
    });

    document.getElementById('countAberta').textContent = counts.ABERTA;
    document.getElementById('countAndamento').textContent = counts['EM ANDAMENTO'];
    document.getElementById('countAguardando').textContent = counts['AGUARDANDO PEÇA'];
    document.getElementById('countFinalizada').textContent = counts.FINALIZADA;
    document.getElementById('countTotal').textContent = counts.TOTAL;
    document.getElementById('totalValue').textContent = formatService.formatCurrency(totalValue);
  }

  function bindEvents() {
    // Novo pedido
    root.querySelector('#btnNewOrder').addEventListener('click', () => {
      openOrderModal();
    });

    // Atualizar
    root.querySelector('#btnRefresh').addEventListener('click', () => {
      loadOrders();
      Toast.success('Lista atualizada');
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
      if (e.target.id === 'selectAll') {
        const checkboxes = root.querySelectorAll('.order-select');
        checkboxes.forEach(cb => {
          cb.checked = e.target.checked;
          const orderId = cb.value;
          if (e.target.checked) {
            state.selectedOrders.add(orderId);
          } else {
            state.selectedOrders.delete(orderId);
          }
        });
        updateSelectedActions();
      }

      if (e.target.classList.contains('order-select')) {
        const orderId = e.target.value;
        if (e.target.checked) {
          state.selectedOrders.add(orderId);
        } else {
          state.selectedOrders.delete(orderId);
          root.querySelector('#selectAll').checked = false;
        }
        updateSelectedActions();
      }
    });

    // Delegação de eventos da tabela
    root.querySelector('#ordersTable').addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const orderId = button.dataset.id;

      switch(action) {
        case 'view': onView(orderId); break;
        case 'edit': onEdit(orderId); break;
        case 'print': onPrint(orderId); break;
        case 'delete': onDelete(orderId); break;
      }
    });

    // Ações em lote
    root.querySelector('#btnBulkStatus').addEventListener('click', onBulkStatus);
    root.querySelector('#btnBulkDelete').addEventListener('click', onBulkDelete);
  }

  function bindPaginationEvents() {
    root.querySelector('#btnFirstPage')?.addEventListener('click', () => {
      state.pagination.currentPage = 1;
      loadOrders();
    });

    root.querySelector('#btnPrevPage')?.addEventListener('click', () => {
      if (state.pagination.currentPage > 1) {
        state.pagination.currentPage--;
        loadOrders();
      }
    });

    root.querySelector('#btnNextPage')?.addEventListener('click', () => {
      if (state.pagination.currentPage < state.pagination.totalPages) {
        state.pagination.currentPage++;
        loadOrders();
      }
    });

    root.querySelector('#btnLastPage')?.addEventListener('click', () => {
      state.pagination.currentPage = state.pagination.totalPages;
      loadOrders();
    });

    root.querySelector('#pageSizeSelect')?.addEventListener('change', (e) => {
      state.pagination.pageSize = parseInt(e.target.value);
      state.pagination.currentPage = 1;
      loadOrders();
    });
  }

  function updateSelectedActions() {
    const selectedActions = root.querySelector('#selectedActions');
    const selectedCount = root.querySelector('.selected-count');
    const count = state.selectedOrders.size;
    
    if (count > 0) {
      selectedActions.style.display = 'flex';
      selectedCount.textContent = `${count} selecionada(s)`;
    } else {
      selectedActions.style.display = 'none';
    }
  }

  async function openOrderModal(order = null) {
    try {
      orderModal = OrderModal.create({
        order: order,
        clients: await CRMRepo.list({ status: 'active' }),
        services: await PriceRepo.list(),
        onSave: async (data) => {
          try {
            if (order) {
              await OSRepo.update(order.id, data);
              Toast.success('Ordem atualizada com sucesso');
            } else {
              await OSRepo.create(data);
              Toast.success('Ordem criada com sucesso');
            }
            orderModal.close();
            await loadOrders();
          } catch (error) {
            console.error('Erro ao salvar ordem:', error);
            Toast.error('Erro ao salvar ordem');
          }
        },
        onPrint: (orderId) => {
          onPrint(orderId);
        },
        onCancel: (orderId) => {
          onCancelOrder(orderId);
        }
      });

      orderModal.open();
    } catch (error) {
      console.error('Erro ao abrir modal:', error);
      Toast.error('Erro ao carregar dados do modal');
    }
  }

  async function onView(orderId) {
    try {
      const order = await OSRepo.getById(orderId);
      if (order) {
        openOrderModal(order);
        orderModal.setViewMode(true);
      }
    } catch (error) {
      console.error('Erro ao visualizar ordem:', error);
      Toast.error('Erro ao carregar ordem');
    }
  }

  async function onEdit(orderId) {
    try {
      const order = await OSRepo.getById(orderId);
      if (order) {
        openOrderModal(order);
      }
    } catch (error) {
      console.error('Erro ao editar ordem:', error);
      Toast.error('Erro ao carregar ordem');
    }
  }

  async function onPrint(orderId) {
    try {
      const order = await OSRepo.getById(orderId);
      if (order) {
        const pdf = await PDFService.generateOrder(order);
        pdf.print();
        Toast.success('PDF gerado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      Toast.error('Erro ao gerar PDF');
    }
  }

  async function onDelete(orderId) {
    if (!confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
      return;
    }

    try {
      await OSRepo.delete(orderId);
      Toast.success('Ordem excluída com sucesso');
      await loadOrders();
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      Toast.error('Erro ao excluir ordem');
    }
  }

  async function onCancelOrder(orderId) {
    if (!confirm('Tem certeza que deseja cancelar esta ordem de serviço?')) {
      return;
    }

    try {
      await OSRepo.updateStatus(orderId, 'CANCELADA');
      Toast.success('Ordem cancelada com sucesso');
      await loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
      Toast.error('Erro ao cancelar ordem');
    }
  }

  async function onBulkStatus() {
    if (state.selectedOrders.size === 0) {
      Toast.warning('Nenhuma ordem selecionada');
      return;
    }

    const newStatus = prompt('Digite o novo status (ABERTA, EM ANDAMENTO, FINALIZADA, etc.):');
    if (!newStatus) return;

    try {
      await OSRepo.bulkUpdateStatus(Array.from(state.selectedOrders), newStatus);
      Toast.success(`${state.selectedOrders.size} ordens atualizadas`);
      state.selectedOrders.clear();
      await loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status em lote:', error);
      Toast.error('Erro ao atualizar status');
    }
  }

  async function onBulkDelete() {
    if (state.selectedOrders.size === 0) {
      Toast.warning('Nenhuma ordem selecionada');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${state.selectedOrders.size} ordem(ns) de serviço?`)) {
      return;
    }

    try {
      await OSRepo.bulkDelete(Array.from(state.selectedOrders));
      Toast.success(`${state.selectedOrders.size} ordens excluídas`);
      state.selectedOrders.clear();
      await loadOrders();
    } catch (error) {
      console.error('Erro ao excluir ordens em lote:', error);
      Toast.error('Erro ao excluir ordens');
    }
  }

  async function onExport(format) {
    try {
      table.showLoading();
      const orders = await OSRepo.listAll(state.filters, state.sort);
      
      switch(format) {
        case 'csv':
          ExportService.toCSV(orders, 'ordens-de-servico');
          break;
        case 'excel':
          ExportService.toExcel(orders, 'ordens-de-servico');
          break;
        case 'pdf':
          const pdf = await PDFService.generateOrdersReport(orders);
          pdf.save('ordens-de-servico.pdf');
          break;
      }
      
      Toast.success(`Exportação ${format.toUpperCase()} concluída`);
    } catch (error) {
      console.error('Erro na exportação:', error);
      Toast.error('Erro na exportação');
    } finally {
      await loadOrders();
    }
  }

  function onSearch(query) {
    state.filters.search = query;
    state.pagination.currentPage = 1;
    loadOrders();
  }

  function onFilterChange(name, value) {
    state.filters[name] = value;
    state.pagination.currentPage = 1;
    loadOrders();
  }

  function onClearFilters() {
    state.filters = {
      status: '',
      dateRange: '',
      search: '',
      technician: ''
    };
    state.pagination.currentPage = 1;
    filterBar.clear();
    loadOrders();
  }

  function onTableSort(field, direction) {
    state.sort.field = field;
    state.sort.direction = direction;
    loadOrders();
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
      if (orderModal) {
        orderModal.close();
      }
      
      // Limpar eventos
      root.innerHTML = '';
      
      root = null;
      table = null;
      orderModal = null;
      filterBar = null;
    }
  };
})();