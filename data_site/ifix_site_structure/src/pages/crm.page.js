// src/pages/crm.page.js
// Tela CRM (Clientes) - Versão melhorada com componentes e arquitetura modular

import { CRMRepo } from "../data/crm.repo.js";
import { Modal } from "../components/modal.js";
import { Form } from "../components/form.js";
import { Table } from "../components/table.js";
import { Card } from "../components/card.js";
import { Tabs } from "../components/tabs.js";

export const CRMPage = (() => {
  let root = null;
  let currentModal = null;
  let refreshTimeout = null;

  const state = {
    filters: {
      search: "",
      status: "active", // active, archived, all
      tags: [],
      sortBy: "updatedAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 20
    },
    stats: {
      total: 0,
      active: 0,
      archived: 0,
      thisMonth: 0
    },
    clients: [],
    pagination: {
      total: 0,
      totalPages: 0,
      currentPage: 1,
      hasNext: false,
      hasPrev: false
    },
    selectedTags: new Set(),
    availableTags: [],
    isLoading: false,
    selectedClient: null,
    bulkAction: {
      selectedIds: new Set(),
      mode: "none" // none, select, edit
    }
  };

  // Campos do formulário de cliente
  const clientFormFields = [
    {
      name: "name",
      label: "Nome Completo *",
      type: "text",
      required: true,
      placeholder: "João Silva",
      validate: (value) => {
        if (value.length < 2) return "Nome muito curto (mín. 2 caracteres)";
        if (value.length > 100) return "Nome muito longo (máx. 100 caracteres)";
        return null;
      },
      span: 2
    },
    {
      name: "email",
      label: "E-mail",
      type: "email",
      placeholder: "joao@exemplo.com",
      validate: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "E-mail inválido";
        return null;
      }
    },
    {
      name: "phone",
      label: "Telefone",
      type: "tel",
      placeholder: "(11) 99999-9999",
      validate: (value) => {
        if (!value) return null;
        const digits = value.replace(/\D/g, "");
        if (digits.length < 10) return "Telefone deve ter pelo menos 10 dígitos";
        if (digits.length > 15) return "Telefone muito longo";
        return null;
      }
    },
    {
      name: "cpfCnpj",
      label: "CPF/CNPJ",
      type: "text",
      placeholder: "Somente números",
      validate: (value) => {
        if (!value) return null;
        const digits = value.replace(/\D/g, "");
        if (![11, 14].includes(digits.length)) {
          return "CPF deve ter 11 dígitos ou CNPJ 14 dígitos";
        }
        return null;
      }
    },
    {
      name: "city",
      label: "Cidade",
      type: "text",
      placeholder: "São Paulo"
    },
    {
      name: "state",
      label: "Estado",
      type: "text",
      placeholder: "SP",
      maxLength: 2
    },
    {
      name: "neighborhood",
      label: "Bairro",
      type: "text",
      placeholder: "Centro"
    },
    {
      name: "address",
      label: "Endereço",
      type: "text",
      placeholder: "Rua, número, complemento",
      span: 2
    },
    {
      name: "tags",
      label: "Tags",
      type: "text",
      placeholder: "vip, iphone, entregador",
      help: "Separe por vírgula"
    },
    {
      name: "notes",
      label: "Observações",
      type: "textarea",
      rows: 4,
      placeholder: "Notas internas sobre o cliente...",
      span: 2
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "active", label: "Ativo" },
        { value: "inactive", label: "Inativo" },
        { value: "archived", label: "Arquivado" }
      ]
    }
  ];

  // Colunas da tabela
  const tableColumns = [
    {
      key: "select",
      label: "",
      width: "40px",
      render: (client) => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "crm-select-checkbox";
        checkbox.dataset.clientId = client.id;
        checkbox.checked = state.bulkAction.selectedIds.has(client.id);
        checkbox.addEventListener("change", (e) => {
          if (e.target.checked) {
            state.bulkAction.selectedIds.add(client.id);
          } else {
            state.bulkAction.selectedIds.delete(client.id);
          }
          updateBulkActions();
        });
        return checkbox;
      }
    },
    {
      key: "name",
      label: "Nome",
      render: (client) => {
        const container = document.createElement("div");
        container.className = "client-name-cell";
        
        const name = document.createElement("div");
        name.className = "client-name";
        name.textContent = client.name || "Sem nome";
        
        const info = document.createElement("div");
        info.className = "client-info";
        
        if (client.email) {
          const email = document.createElement("span");
          email.className = "client-email";
          email.textContent = client.email;
          info.appendChild(email);
        }
        
        if (client.phone) {
          const phone = document.createElement("span");
          phone.className = "client-phone";
          phone.textContent = formatPhone(client.phone);
          if (client.email) phone.textContent = " • " + phone.textContent;
          info.appendChild(phone);
        }
        
        container.appendChild(name);
        container.appendChild(info);
        
        return container;
      }
    },
    {
      key: "location",
      label: "Localização",
      render: (client) => {
        if (!client.city && !client.neighborhood) return "-";
        return [client.city, client.neighborhood].filter(Boolean).join(", ");
      }
    },
    {
      key: "tags",
      label: "Tags",
      render: (client) => {
        const container = document.createElement("div");
        container.className = "tags-container";
        
        const tags = client.tags || [];
        tags.slice(0, 3).forEach(tag => {
          const span = document.createElement("span");
          span.className = "tag";
          span.textContent = tag;
          span.addEventListener("click", () => filterByTag(tag));
          container.appendChild(span);
        });
        
        if (tags.length > 3) {
          const more = document.createElement("span");
          more.className = "tag-more";
          more.textContent = `+${tags.length - 3}`;
          more.title = tags.slice(3).join(", ");
          container.appendChild(more);
        }
        
        return container;
      }
    },
    {
      key: "status",
      label: "Status",
      width: "100px",
      render: (client) => {
        const span = document.createElement("span");
        span.className = `status-badge status-${client.status || "active"}`;
        span.textContent = getStatusLabel(client.status);
        return span;
      }
    },
    {
      key: "updatedAt",
      label: "Atualizado",
      width: "120px",
      render: (client) => formatDate(client.updatedAt, "short")
    },
    {
      key: "actions",
      label: "Ações",
      width: "150px",
      render: (client) => {
        const container = document.createElement("div");
        container.className = "actions-container";
        
        const editBtn = Table.actionButton({
          label: "Editar",
          action: "edit",
          variant: "primary",
          size: "sm"
        });
        editBtn.addEventListener("click", () => openEditModal(client));
        
        const menuBtn = Table.actionButton({
          label: "⋯",
          action: "menu",
          variant: "default",
          size: "sm"
        });
        menuBtn.classList.add("dropdown-toggle");
        menuBtn.addEventListener("click", (e) => showClientMenu(e, client));
        
        container.appendChild(editBtn);
        container.appendChild(menuBtn);
        
        return container;
      }
    }
  ];

  // ==================== FUNÇÕES UTILITÁRIAS ====================
  function formatPhone(phone) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return digits;
  }

  function formatDate(dateStr, format = "full") {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    
    if (format === "short") {
      return date.toLocaleDateString("pt-BR");
    }
    
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getStatusLabel(status) {
    const labels = {
      active: "Ativo",
      inactive: "Inativo",
      archived: "Arquivado"
    };
    return labels[status] || status;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ==================== RENDERIZAÇÃO DA PÁGINA ====================
  async function render() {
    if (!root) return;
    
    await loadStats();
    await loadClients();
    await loadTags();
    
    root.innerHTML = "";
    
    // Container principal
    const container = document.createElement("div");
    container.className = "crm-page";
    
    // Header
    container.appendChild(renderHeader());
    
    // Toolbar
    container.appendChild(renderToolbar());
    
    // Conteúdo principal
    const content = document.createElement("div");
    content.className = "crm-content";
    
    // Sidebar (filtros)
    const sidebar = document.createElement("aside");
    sidebar.className = "crm-sidebar";
    sidebar.appendChild(renderFilters());
    content.appendChild(sidebar);
    
    // Main content
    const main = document.createElement("main");
    main.className = "crm-main";
    
    if (state.isLoading) {
      main.appendChild(renderLoading());
    } else {
      main.appendChild(renderClientsTable());
      main.appendChild(renderPagination());
    }
    
    content.appendChild(main);
    container.appendChild(content);
    
    // Bulk actions bar
    if (state.bulkAction.selectedIds.size > 0) {
      container.appendChild(renderBulkActions());
    }
    
    root.appendChild(container);
    
    // Adiciona estilos
    injectStyles();
  }

  function renderHeader() {
    const header = document.createElement("header");
    header.className = "crm-header";
    
    const title = document.createElement("div");
    title.className = "crm-header__title";
    title.innerHTML = `
      <h1>Clientes (CRM)</h1>
      <p class="subtitle">Gerencie sua base de clientes</p>
    `;
    
    const stats = document.createElement("div");
    stats.className = "crm-header__stats";
    stats.innerHTML = `
      <div class="stat">
        <span class="stat-value">${state.stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value">${state.stats.active}</span>
        <span class="stat-label">Ativos</span>
      </div>
      <div class="stat">
        <span class="stat-value">${state.stats.thisMonth}</span>
        <span class="stat-label">Este mês</span>
      </div>
    `;
    
    const actions = document.createElement("div");
    actions.className = "crm-header__actions";
    
    const exportBtn = document.createElement("button");
    exportBtn.className = "btn btn-secondary";
    exportBtn.innerHTML = '<i class="icon-download"></i> Exportar';
    exportBtn.addEventListener("click", exportClients);
    
    const addBtn = document.createElement("button");
    addBtn.className = "btn btn-primary";
    addBtn.innerHTML = '<i class="icon-plus"></i> Novo Cliente';
    addBtn.addEventListener("click", openCreateModal);
    
    actions.appendChild(exportBtn);
    actions.appendChild(addBtn);
    
    header.appendChild(title);
    header.appendChild(stats);
    header.appendChild(actions);
    
    return header;
  }

  function renderToolbar() {
    const toolbar = document.createElement("div");
    toolbar.className = "crm-toolbar";
    
    // Busca
    const searchContainer = document.createElement("div");
    searchContainer.className = "search-container";
    
    const searchIcon = document.createElement("span");
    searchIcon.className = "search-icon";
    searchIcon.innerHTML = "🔍";
    
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.className = "search-input";
    searchInput.placeholder = "Buscar por nome, email, telefone, tags...";
    searchInput.value = state.filters.search;
    searchInput.addEventListener("input", debounce((e) => {
      state.filters.search = e.target.value;
      state.filters.page = 1;
      refresh();
    }, 300));
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(searchInput);
    
    // Filtros rápidos
    const quickFilters = document.createElement("div");
    quickFilters.className = "quick-filters";
    
    const filterButtons = [
      { label: "Todos", status: "all" },
      { label: "Ativos", status: "active" },
      { label: "Arquivados", status: "archived" }
    ];
    
    filterButtons.forEach(filter => {
      const btn = document.createElement("button");
      btn.className = `filter-btn ${state.filters.status === filter.status ? "active" : ""}`;
      btn.textContent = filter.label;
      btn.dataset.status = filter.status;
      btn.addEventListener("click", () => {
        state.filters.status = filter.status;
        state.filters.page = 1;
        refresh();
      });
      quickFilters.appendChild(btn);
    });
    
    toolbar.appendChild(searchContainer);
    toolbar.appendChild(quickFilters);
    
    return toolbar;
  }

  function renderFilters() {
    const sidebar = document.createElement("div");
    sidebar.className = "filters-sidebar";
    
    const tagsSection = document.createElement("div");
    tagsSection.className = "filters-section";
    tagsSection.innerHTML = '<h3>Tags</h3>';
    
    const tagsList = document.createElement("div");
    tagsList.className = "tags-list";
    
    state.availableTags.forEach(tag => {
      const tagEl = document.createElement("label");
      tagEl.className = "tag-filter";
      
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tag;
      checkbox.checked = state.selectedTags.has(tag);
      checkbox.addEventListener("change", (e) => {
        if (e.target.checked) {
          state.selectedTags.add(tag);
        } else {
          state.selectedTags.delete(tag);
        }
        refresh();
      });
      
      const text = document.createElement("span");
      text.textContent = tag;
      
      tagEl.appendChild(checkbox);
      tagEl.appendChild(text);
      tagsList.appendChild(tagEl);
    });
    
    tagsSection.appendChild(tagsList);
    
    const actionsSection = document.createElement("div");
    actionsSection.className = "filters-section";
    actionsSection.innerHTML = `
      <h3>Ações Rápidas</h3>
      <button class="btn btn-block btn-secondary" id="clearFilters">
        Limpar Filtros
      </button>
      <button class="btn btn-block" id="selectAll">
        Selecionar Todos
      </button>
      <button class="btn btn-block btn-danger" id="bulkArchive">
        Arquivar Selecionados
      </button>
    `;
    
    sidebar.appendChild(tagsSection);
    sidebar.appendChild(actionsSection);
    
    // Event listeners
    setTimeout(() => {
      if (sidebar.querySelector("#clearFilters")) {
        sidebar.querySelector("#clearFilters").addEventListener("click", clearFilters);
      }
      if (sidebar.querySelector("#selectAll")) {
        sidebar.querySelector("#selectAll").addEventListener("click", selectAll);
      }
      if (sidebar.querySelector("#bulkArchive")) {
        sidebar.querySelector("#bulkArchive").addEventListener("click", bulkArchive);
      }
    }, 0);
    
    return sidebar;
  }

  function renderClientsTable() {
    const tableCard = Card.render({
      title: "Clientes",
      subtitle: `${state.pagination.total} clientes encontrados`,
      content: Table.render({
        columns: tableColumns,
        rows: state.clients,
        emptyText: "Nenhum cliente encontrado com os filtros atuais.",
        emptyIcon: "👤",
        selectable: true,
        onRowClick: (client) => openClientDetail(client),
        loading: state.isLoading
      }),
      actions: renderTableActions()
    });
    
    return tableCard;
  }

  function renderTableActions() {
    const container = document.createElement("div");
    container.className = "table-actions";
    
    const sortSelect = document.createElement("select");
    sortSelect.className = "sort-select";
    sortSelect.innerHTML = `
      <option value="updatedAt" ${state.filters.sortBy === "updatedAt" ? "selected" : ""}>Ordenar por: Atualização</option>
      <option value="createdAt" ${state.filters.sortBy === "createdAt" ? "selected" : ""}>Ordenar por: Criação</option>
      <option value="name" ${state.filters.sortBy === "name" ? "selected" : ""}>Ordenar por: Nome</option>
    `;
    sortSelect.addEventListener("change", (e) => {
      state.filters.sortBy = e.target.value;
      refresh();
    });
    
    const orderBtn = document.createElement("button");
    orderBtn.className = "order-btn";
    orderBtn.innerHTML = state.filters.sortOrder === "desc" ? "↓" : "↑";
    orderBtn.title = state.filters.sortOrder === "desc" ? "Ordenação decrescente" : "Ordenação crescente";
    orderBtn.addEventListener("click", () => {
      state.filters.sortOrder = state.filters.sortOrder === "desc" ? "asc" : "desc";
      refresh();
    });
    
    const pageSizeSelect = document.createElement("select");
    pageSizeSelect.className = "page-size-select";
    pageSizeSelect.innerHTML = `
      <option value="10" ${state.filters.pageSize === 10 ? "selected" : ""}>10 por página</option>
      <option value="20" ${state.filters.pageSize === 20 ? "selected" : ""}>20 por página</option>
      <option value="50" ${state.filters.pageSize === 50 ? "selected" : ""}>50 por página</option>
      <option value="100" ${state.filters.pageSize === 100 ? "selected" : ""}>100 por página</option>
    `;
    pageSizeSelect.addEventListener("change", (e) => {
      state.filters.pageSize = parseInt(e.target.value);
      state.filters.page = 1;
      refresh();
    });
    
    container.appendChild(sortSelect);
    container.appendChild(orderBtn);
    container.appendChild(pageSizeSelect);
    
    return container;
  }

  function renderPagination() {
    if (state.pagination.totalPages <= 1) return document.createElement("div");
    
    const pagination = document.createElement("div");
    pagination.className = "pagination";
    
    const prevBtn = document.createElement("button");
    prevBtn.className = "pagination-btn";
    prevBtn.innerHTML = "‹ Anterior";
    prevBtn.disabled = !state.pagination.hasPrev;
    prevBtn.addEventListener("click", () => {
      state.filters.page--;
      refresh();
    });
    
    const nextBtn = document.createElement("button");
    nextBtn.className = "pagination-btn";
    nextBtn.innerHTML = "Próximo ›";
    nextBtn.disabled = !state.pagination.hasNext;
    nextBtn.addEventListener("click", () => {
      state.filters.page++;
      refresh();
    });
    
    const pageInfo = document.createElement("span");
    pageInfo.className = "pagination-info";
    pageInfo.textContent = `Página ${state.filters.page} de ${state.pagination.totalPages}`;
    
    pagination.appendChild(prevBtn);
    pagination.appendChild(pageInfo);
    pagination.appendChild(nextBtn);
    
    return pagination;
  }

  function renderBulkActions() {
    const bar = document.createElement("div");
    bar.className = "bulk-actions-bar";
    
    const selectedCount = document.createElement("span");
    selectedCount.className = "selected-count";
    selectedCount.textContent = `${state.bulkAction.selectedIds.size} selecionados`;
    
    const actions = document.createElement("div");
    actions.className = "bulk-actions";
    
    const actionButtons = [
      { label: "Arquivar", action: "archive", variant: "secondary" },
      { label: "Exportar", action: "export", variant: "secondary" },
      { label: "Adicionar Tag", action: "addTag", variant: "primary" },
      { label: "Limpar Seleção", action: "clear", variant: "ghost" }
    ];
    
    actionButtons.forEach(btnConfig => {
      const btn = document.createElement("button");
      btn.className = `btn btn-${btnConfig.variant}`;
      btn.textContent = btnConfig.label;
      btn.addEventListener("click", () => handleBulkAction(btnConfig.action));
      actions.appendChild(btn);
    });
    
    bar.appendChild(selectedCount);
    bar.appendChild(actions);
    
    return bar;
  }

  function renderLoading() {
    const container = document.createElement("div");
    container.className = "loading-container";
    container.innerHTML = `
      <div class="loading-spinner"></div>
      <p>Carregando clientes...</p>
    `;
    return container;
  }

  // ==================== MODAIS ====================
  function openCreateModal() {
    const form = Form.render({
      fields: clientFormFields,
      submitLabel: "Criar Cliente",
      cancelLabel: "Cancelar",
      onSubmit: async (data) => {
        try {
          await CRMRepo.create(data);
          closeModal();
          showToast("Cliente criado com sucesso!", "success");
          refresh();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
      onCancel: closeModal
    });
    
    currentModal = Modal.create({
      title: "Novo Cliente",
      content: form,
      size: "lg",
      closeOnEsc: true,
      closeOnBackdrop: true,
      onClose: () => {
        currentModal = null;
      }
    });
    
    Modal.open(currentModal);
  }

  function openEditModal(client) {
    const form = Form.render({
      fields: clientFormFields,
      values: client,
      submitLabel: "Salvar Alterações",
      cancelLabel: "Cancelar",
      onSubmit: async (data) => {
        try {
          await CRMRepo.update(client.id, data);
          closeModal();
          showToast("Cliente atualizado com sucesso!", "success");
          refresh();
        } catch (error) {
          showToast(error.message, "error");
        }
      },
      onCancel: closeModal
    });
    
    currentModal = Modal.create({
      title: "Editar Cliente",
      content: form,
      size: "lg",
      closeOnEsc: true,
      closeOnBackdrop: true,
      onClose: () => {
        currentModal = null;
      }
    });
    
    Modal.open(currentModal);
  }

  function openClientDetail(client) {
    const detailContent = document.createElement("div");
    detailContent.className = "client-detail";
    
    detailContent.innerHTML = `
      <div class="client-header">
        <div class="client-avatar">
          ${client.name.charAt(0).toUpperCase()}
        </div>
        <div class="client-info">
          <h2>${escapeHtml(client.name)}</h2>
          <div class="client-meta">
            <span class="status-badge status-${client.status}">
              ${getStatusLabel(client.status)}
            </span>
            <span>Cadastrado em ${formatDate(client.createdAt, "short")}</span>
          </div>
        </div>
      </div>
      
      <div class="client-detail-grid">
        <div class="detail-section">
          <h3>Contato</h3>
          <div class="detail-field">
            <label>E-mail:</label>
            <span>${client.email || "-"}</span>
          </div>
          <div class="detail-field">
            <label>Telefone:</label>
            <span>${formatPhone(client.phone) || "-"}</span>
          </div>
          <div class="detail-field">
            <label>Documento:</label>
            <span>${client.cpfCnpj || "-"}</span>
          </div>
        </div>
        
        <div class="detail-section">
          <h3>Endereço</h3>
          <div class="detail-field">
            <label>Endereço:</label>
            <span>${client.address || "-"}</span>
          </div>
          <div class="detail-field">
            <label>Bairro:</label>
            <span>${client.neighborhood || "-"}</span>
          </div>
          <div class="detail-field">
            <label>Cidade/Estado:</label>
            <span>${[client.city, client.state].filter(Boolean).join("/") || "-"}</span>
          </div>
        </div>
        
        <div class="detail-section full-width">
          <h3>Tags</h3>
          <div class="tags-container">
            ${(client.tags || []).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          </div>
        </div>
        
        ${client.notes ? `
          <div class="detail-section full-width">
            <h3>Observações</h3>
            <div class="notes">${escapeHtml(client.notes)}</div>
          </div>
        ` : ""}
      </div>
    `;
    
    const footer = document.createElement("div");
    footer.className = "client-detail-footer";
    footer.innerHTML = `
      <button class="btn btn-secondary" id="editClientBtn">Editar</button>
      <button class="btn" id="createOrderBtn">Criar OS</button>
      ${client.status === "archived" ? 
        `<button class="btn btn-success" id="restoreClientBtn">Restaurar</button>` : 
        `<button class="btn btn-warning" id="archiveClientBtn">Arquivar</button>`
      }
    `;
    
    detailContent.appendChild(footer);
    
    currentModal = Modal.create({
      title: "Detalhes do Cliente",
      content: detailContent,
      size: "lg",
      closeOnEsc: true,
      closeOnBackdrop: true,
      onClose: () => {
        currentModal = null;
      }
    });
    
    Modal.open(currentModal);
    
    // Event listeners para botões do modal
    setTimeout(() => {
      const editBtn = detailContent.querySelector("#editClientBtn");
      if (editBtn) editBtn.addEventListener("click", () => {
        closeModal();
        openEditModal(client);
      });
      
      const archiveBtn = detailContent.querySelector("#archiveClientBtn");
      if (archiveBtn) archiveBtn.addEventListener("click", async () => {
        if (confirm("Arquivar este cliente?")) {
          await CRMRepo.archive(client.id);
          closeModal();
          showToast("Cliente arquivado", "success");
          refresh();
        }
      });
      
      const restoreBtn = detailContent.querySelector("#restoreClientBtn");
      if (restoreBtn) restoreBtn.addEventListener("click", async () => {
        await CRMRepo.restore(client.id);
        closeModal();
        showToast("Cliente restaurado", "success");
        refresh();
      });
      
      const orderBtn = detailContent.querySelector("#createOrderBtn");
      if (orderBtn) orderBtn.addEventListener("click", () => {
        // Navegar para criação de OS com este cliente pré-selecionado
        showToast("Redirecionando para criação de OS...", "info");
        // Implementar navegação
        closeModal();
      });
    }, 0);
  }

  function showClientMenu(event, client) {
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.style.position = "absolute";
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;
    
    menu.innerHTML = `
      <ul>
        <li><button data-action="view">Ver Detalhes</button></li>
        <li><button data-action="edit">Editar</button></li>
        <li><button data-action="orders">Ver OS</button></li>
        <li><hr></li>
        <li><button data-action="archive">Arquivar</button></li>
        <li><button data-action="delete" class="danger">Excluir</button></li>
      </ul>
    `;
    
    document.body.appendChild(menu);
    
    // Fechar menu ao clicar fora
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener("click", closeMenu);
      }
    };
    
    setTimeout(() => document.addEventListener("click", closeMenu), 0);
    
    // Event listeners do menu
    menu.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        
        switch (action) {
          case "view":
            openClientDetail(client);
            break;
          case "edit":
            openEditModal(client);
            break;
          case "orders":
            // Navegar para página de OS filtrada por cliente
            showToast(`Mostrando OS de ${client.name}`, "info");
            break;
          case "archive":
            if (confirm("Arquivar este cliente?")) {
              await CRMRepo.archive(client.id);
              showToast("Cliente arquivado", "success");
              refresh();
            }
            break;
          case "delete":
            if (confirm("Excluir permanentemente este cliente?")) {
              await CRMRepo.delete(client.id, true);
              showToast("Cliente excluído", "success");
              refresh();
            }
            break;
        }
        
        menu.remove();
        document.removeEventListener("click", closeMenu);
      });
    });
  }

  function closeModal() {
    if (currentModal) {
      Modal.close(currentModal);
      currentModal = null;
    }
  }

  // ==================== AÇÕES ====================
  async function loadStats() {
    try {
      const stats = await CRMRepo.getStats();
      state.stats = {
        total: stats.total || 0,
        active: stats.byStatus?.active || 0,
        archived: stats.byStatus?.archived || 0,
        thisMonth: stats.createdThisMonth || 0
      };
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    }
  }

  async function loadClients() {
    state.isLoading = true;
    
    try {
      const filters = {
        search: state.filters.search,
        status: state.filters.status,
        tags: Array.from(state.selectedTags),
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder,
        page: state.filters.page,
        pageSize: state.filters.pageSize
      };
      
      const result = await CRMRepo.find(filters);
      state.clients = result.items || [];
      state.pagination = {
        total: result.pagination?.total || 0,
        totalPages: result.pagination?.totalPages || 0,
        currentPage: result.pagination?.page || 1,
        hasNext: result.pagination?.hasNext || false,
        hasPrev: result.pagination?.hasPrev || false
      };
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      showToast("Erro ao carregar clientes", "error");
    } finally {
      state.isLoading = false;
    }
  }

  async function loadTags() {
    try {
      // Buscar todas as tags dos clientes
      const allClients = await CRMRepo.find({ status: "all", pageSize: 1000 });
      const tagsSet = new Set();
      
      allClients.items?.forEach(client => {
        (client.tags || []).forEach(tag => tagsSet.add(tag));
      });
      
      state.availableTags = Array.from(tagsSet).sort();
    } catch (error) {
      console.error("Erro ao carregar tags:", error);
    }
  }

  function filterByTag(tag) {
    state.selectedTags.add(tag);
    state.filters.page = 1;
    refresh();
  }

  function clearFilters() {
    state.filters = {
      search: "",
      status: "active",
      tags: [],
      sortBy: "updatedAt",
      sortOrder: "desc",
      page: 1,
      pageSize: 20
    };
    state.selectedTags.clear();
    refresh();
  }

  function selectAll() {
    state.bulkAction.selectedIds = new Set(state.clients.map(c => c.id));
    updateBulkActions();
    showToast(`${state.bulkAction.selectedIds.size} clientes selecionados`, "info");
  }

  async function bulkArchive() {
    if (state.bulkAction.selectedIds.size === 0) return;
    
    if (!confirm(`Arquivar ${state.bulkAction.selectedIds.size} clientes?`)) return;
    
    try {
      for (const id of state.bulkAction.selectedIds) {
        await CRMRepo.archive(id);
      }
      showToast(`${state.bulkAction.selectedIds.size} clientes arquivados`, "success");
      state.bulkAction.selectedIds.clear();
      refresh();
    } catch (error) {
      showToast("Erro ao arquivar clientes", "error");
    }
  }

  function handleBulkAction(action) {
    switch (action) {
      case "archive":
        bulkArchive();
        break;
      case "export":
        exportSelectedClients();
        break;
      case "addTag":
        showAddTagModal();
        break;
      case "clear":
        state.bulkAction.selectedIds.clear();
        updateBulkActions();
        break;
    }
  }

  async function exportClients() {
    try {
      const data = await CRMRepo.export("csv");
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientes-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Exportação iniciada", "success");
    } catch (error) {
      showToast("Erro ao exportar", "error");
    }
  }

  async function exportSelectedClients() {
    if (state.bulkAction.selectedIds.size === 0) return;
    
    try {
      // Em uma implementação real, buscaríamos apenas os selecionados
      const data = await CRMRepo.export("csv");
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clientes-selecionados-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Exportação iniciada", "success");
    } catch (error) {
      showToast("Erro ao exportar", "error");
    }
  }

  function showAddTagModal() {
    const content = document.createElement("div");
    content.innerHTML = `
      <div class="form-group">
        <label>Adicionar tag aos clientes selecionados:</label>
        <input type="text" id="newTagInput" class="form-control" placeholder="Nova tag">
      </div>
      <p class="help-text">A tag será adicionada a todos os ${state.bulkAction.selectedIds.size} clientes selecionados.</p>
    `;
    
    const modal = Modal.create({
      title: "Adicionar Tag",
      content: content,
      footer: `
        <button class="btn" id="cancelTagBtn">Cancelar</button>
        <button class="btn btn-primary" id="saveTagBtn">Adicionar</button>
      `,
      onClose: () => modal.remove()
    });
    
    Modal.open(modal);
    
    setTimeout(() => {
      const input = modal.querySelector("#newTagInput");
      const cancelBtn = modal.querySelector("#cancelTagBtn");
      const saveBtn = modal.querySelector("#saveTagBtn");
      
      if (input) input.focus();
      
      if (cancelBtn) cancelBtn.addEventListener("click", () => Modal.close(modal));
      
      if (saveBtn) saveBtn.addEventListener("click", async () => {
        const tag = input?.value.trim();
        if (!tag) {
          showToast("Digite uma tag", "error");
          return;
        }
        
        try {
          for (const id of state.bulkAction.selectedIds) {
            const client = await CRMRepo.getById(id);
            if (client) {
              const tags = [...new Set([...(client.tags || []), tag])];
              await CRMRepo.update(id, { tags });
            }
          }
          Modal.close(modal);
          showToast(`Tag "${tag}" adicionada`, "success");
          refresh();
        } catch (error) {
          showToast("Erro ao adicionar tag", "error");
        }
      });
    }, 0);
  }

  function updateBulkActions() {
    // Em uma implementação real, atualizaríamos a UI
    if (state.bulkAction.selectedIds.size > 0) {
      render();
    }
  }

  function refresh() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => render(), 50);
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add("show");
    }, 10);
    
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function injectStyles() {
    if (document.getElementById("crm-page-styles")) return;
    
    const styles = document.createElement("style");
    styles.id = "crm-page-styles";
    styles.textContent = `
      .crm-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .crm-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .crm-header__title h1 {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        color: #1f2937;
      }
      
      .crm-header__title .subtitle {
        margin: 5px 0 0;
        color: #6b7280;
        font-size: 14px;
      }
      
      .crm-header__stats {
        display: flex;
        gap: 30px;
        text-align: center;
      }
      
      .stat {
        display: flex;
        flex-direction: column;
      }
      
      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #374151;
      }
      
      .stat-label {
        font-size: 12px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .crm-header__actions {
        display: flex;
        gap: 10px;
      }
      
      .crm-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .search-container {
        position: relative;
        flex: 1;
        max-width: 500px;
      }
      
      .search-icon {
        position: absolute;
        left: 12px;
        top: 50%;
        transform: translateY(-50%);
        color: #9ca3af;
      }
      
      .search-input {
        width: 100%;
        padding: 10px 10px 10px 40px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
      }
      
      .quick-filters {
        display: flex;
        gap: 8px;
      }
      
      .filter-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .filter-btn.active {
        background: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }
      
      .crm-content {
        display: flex;
        gap: 20px;
      }
      
      .crm-sidebar {
        width: 250px;
        flex-shrink: 0;
      }
      
      .filters-section {
        margin-bottom: 20px;
        padding: 15px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      }
      
      .filters-section h3 {
        margin: 0 0 15px 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
      
      .tags-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .tag-filter {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
      }
      
      .tag-filter input[type="checkbox"] {
        margin: 0;
      }
      
      .btn-block {
        width: 100%;
        margin-bottom: 10px;
      }
      
      .crm-main {
        flex: 1;
      }
      
      .client-name-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .client-name {
        font-weight: 600;
        color: #1f2937;
      }
      
      .client-info {
        display: flex;
        gap: 10px;
        font-size: 12px;
        color: #6b7280;
      }
      
      .tags-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      
      .tag {
        padding: 2px 8px;
        background: #e5e7eb;
        border-radius: 12px;
        font-size: 12px;
        color: #374151;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .tag:hover {
        background: #d1d5db;
      }
      
      .tag-more {
        padding: 2px 6px;
        background: #f3f4f6;
        border-radius: 12px;
        font-size: 11px;
        color: #9ca3af;
      }
      
      .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .status-active {
        background: #d1fae5;
        color: #065f46;
      }
      
      .status-inactive {
        background: #fef3c7;
        color: #92400e;
      }
      
      .status-archived {
        background: #f3f4f6;
        color: #6b7280;
      }
      
      .actions-container {
        display: flex;
        gap: 4px;
      }
      
      .table-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .sort-select, .page-size-select {
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        background: white;
        font-size: 13px;
      }
      
      .order-btn {
        padding: 6px 10px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 4px;
        cursor: pointer;
      }
      
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 20px;
        margin-top: 20px;
        padding: 20px;
      }
      
      .pagination-btn {
        padding: 8px 16px;
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .pagination-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .pagination-info {
        color: #6b7280;
        font-size: 14px;
      }
      
      .bulk-actions-bar {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: white;
        border-top: 1px solid #e5e7eb;
        box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
        z-index: 100;
      }
      
      .selected-count {
        font-weight: 600;
        color: #374151;
      }
      
      .bulk-actions {
        display: flex;
        gap: 10px;
      }
      
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px;
        gap: 20px;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .client-detail {
        padding: 10px;
      }
      
      .client-header {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .client-avatar {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-size: 24px;
        font-weight: 600;
      }
      
      .client-info h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        color: #1f2937;
      }
      
      .client-meta {
        display: flex;
        gap: 15px;
        align-items: center;
        font-size: 14px;
        color: #6b7280;
      }
      
      .client-detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .detail-section.full-width {
        grid-column: 1 / -1;
      }
      
      .detail-section h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #374151;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
      }
      
      .detail-field {
        display: flex;
        margin-bottom: 12px;
      }
      
      .detail-field label {
        width: 120px;
        font-weight: 600;
        color: #6b7280;
        font-size: 14px;
      }
      
      .detail-field span {
        flex: 1;
        color: #1f2937;
      }
      
      .notes {
        padding: 15px;
        background: #f9fafb;
        border-radius: 6px;
        white-space: pre-wrap;
        line-height: 1.5;
      }
      
      .client-detail-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
      }
      
      .dropdown-menu {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        min-width: 180px;
        z-index: 1000;
      }
      
      .dropdown-menu ul {
        list-style: none;
        margin: 0;
        padding: 8px 0;
      }
      
      .dropdown-menu li {
        margin: 0;
      }
      
      .dropdown-menu button {
        width: 100%;
        padding: 8px 16px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 14px;
        color: #374151;
      }
      
      .dropdown-menu button:hover {
        background: #f3f4f6;
      }
      
      .dropdown-menu button.danger {
        color: #dc2626;
      }
      
      .dropdown-menu hr {
        margin: 8px 0;
        border: none;
        border-top: 1px solid #e5e7eb;
      }
      
      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: #374151;
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10000;
      }
      
      .toast.show {
        transform: translateY(0);
        opacity: 1;
      }
      
      .toast-success {
        background: #10b981;
      }
      
      .toast-error {
        background: #ef4444;
      }
      
      .toast-info {
        background: #3b82f6;
      }
      
      .toast-warning {
        background: #f59e0b;
      }
      
      @media (max-width: 1200px) {
        .crm-content {
          flex-direction: column;
        }
        
        .crm-sidebar {
          width: 100%;
        }
        
        .crm-header {
          flex-direction: column;
          gap: 20px;
        }
        
        .crm-header__stats {
          order: 3;
          justify-content: center;
          width: 100%;
        }
        
        .crm-header__actions {
          order: 2;
          width: 100%;
          justify-content: center;
        }
      }
      
      @media (max-width: 768px) {
        .crm-toolbar {
          flex-direction: column;
          gap: 15px;
          align-items: stretch;
        }
        
        .quick-filters {
          justify-content: center;
          flex-wrap: wrap;
        }
        
        .client-detail-grid {
          grid-template-columns: 1fr;
        }
        
        .crm-header__stats {
          flex-wrap: wrap;
          justify-content: space-around;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  // ==================== API PÚBLICA ====================
  return {
    async mount({ rootEl }) {
      root = rootEl;
      await CRMRepo.init();
      await render();
    },
    
    unmount() {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      if (currentModal) Modal.close(currentModal);
      root = null;
    },
    
    refresh() {
      refresh();
    },
    
    getState() {
      return { ...state };
    }
  };
})();