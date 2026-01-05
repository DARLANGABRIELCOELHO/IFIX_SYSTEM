// src/pages/dashboard.page.js
// Dashboard completo com KPIs, gráficos e widgets interativos

import { OSRepo } from "../data/os.repo.js";
import { CRMRepo } from "../data/crm.repo.js";
import { PriceRepo } from "../data/price.repo.js";
import { Card } from "../components/card.js";
import { Table } from "../components/table.js";
import { Tabs } from "../components/tabs.js";
import { Modal } from "../components/modal.js";

export const DashboardPage = (() => {
  let root = null;
  let refreshInterval = null;
  let currentModal = null;

  const state = {
    period: "month", // day, week, month, year
    osStats: null,
    crmStats: null,
    priceStats: null,
    recentOrders: [],
    recentClients: [],
    lowStockItems: [],
    overdueOrders: [],
    financialSummary: null,
    isLoading: true,
    activeTab: "overview"
  };

  // ==================== RENDERIZAÇÃO DA PÁGINA ====================
  async function render() {
    if (!root) return;
    
    state.isLoading = true;
    renderSkeleton();
    
    await Promise.all([
      loadOSStats(),
      loadCRMStats(),
      loadPriceStats(),
      loadRecentData()
    ]);
    
    state.isLoading = false;
    
    root.innerHTML = "";
    
    // Container principal
    const container = document.createElement("div");
    container.className = "dashboard-page";
    
    // Header
    container.appendChild(renderHeader());
    
    // Tabs
    const tabs = Tabs.render({
      tabs: [
        { id: "overview", label: "Visão Geral", active: true },
        { id: "orders", label: "Ordens" },
        { id: "clients", label: "Clientes" },
        { id: "inventory", label: "Estoque" },
        { id: "financial", label: "Financeiro" }
      ],
      onChange: (tabId) => {
        state.activeTab = tabId;
        renderTabContent(container);
      }
    });
    container.appendChild(tabs);
    
    // Conteúdo da tab atual
    renderTabContent(container);
    
    root.appendChild(container);
    
    // Inicia auto-refresh
    startAutoRefresh();
    
    // Adiciona estilos
    injectStyles();
  }

  function renderHeader() {
    const header = document.createElement("header");
    header.className = "dashboard-header";
    
    const title = document.createElement("div");
    title.className = "dashboard-title";
    title.innerHTML = `
      <h1>Dashboard</h1>
      <p class="subtitle">Visão geral do sistema iFix</p>
    `;
    
    const controls = document.createElement("div");
    controls.className = "dashboard-controls";
    
    // Seletor de período
    const periodSelect = document.createElement("select");
    periodSelect.className = "period-select";
    periodSelect.innerHTML = `
      <option value="day" ${state.period === "day" ? "selected" : ""}>Hoje</option>
      <option value="week" ${state.period === "week" ? "selected" : ""}>Esta Semana</option>
      <option value="month" ${state.period === "month" ? "selected" : ""}>Este Mês</option>
      <option value="year" ${state.period === "year" ? "selected" : ""}>Este Ano</option>
    `;
    periodSelect.addEventListener("change", (e) => {
      state.period = e.target.value;
      refresh();
    });
    
    // Botão de refresh
    const refreshBtn = document.createElement("button");
    refreshBtn.className = "btn btn-secondary";
    refreshBtn.innerHTML = '<i class="icon-refresh"></i> Atualizar';
    refreshBtn.addEventListener("click", refresh);
    
    // Botão de relatório
    const reportBtn = document.createElement("button");
    reportBtn.className = "btn btn-primary";
    reportBtn.innerHTML = '<i class="icon-download"></i> Relatório';
    reportBtn.addEventListener("click", generateReport);
    
    controls.appendChild(periodSelect);
    controls.appendChild(refreshBtn);
    controls.appendChild(reportBtn);
    
    header.appendChild(title);
    header.appendChild(controls);
    
    return header;
  }

  function renderTabContent(container) {
    const existingContent = container.querySelector(".tab-content");
    if (existingContent) existingContent.remove();
    
    const content = document.createElement("div");
    content.className = "tab-content";
    
    switch (state.activeTab) {
      case "overview":
        content.appendChild(renderOverview());
        break;
      case "orders":
        content.appendChild(renderOrdersTab());
        break;
      case "clients":
        content.appendChild(renderClientsTab());
        break;
      case "inventory":
        content.appendChild(renderInventoryTab());
        break;
      case "financial":
        content.appendChild(renderFinancialTab());
        break;
    }
    
    container.appendChild(content);
  }

  function renderOverview() {
    const grid = document.createElement("div");
    grid.className = "dashboard-grid";
    
    // KPIs principais
    const kpis = document.createElement("div");
    kpis.className = "kpi-grid";
    kpis.appendChild(renderKPIs());
    grid.appendChild(kpis);
    
    // Gráficos e widgets
    const widgets = document.createElement("div");
    widgets.className = "widgets-grid";
    
    // Widget de receita
    widgets.appendChild(renderRevenueWidget());
    
    // Widget de ordens por status
    widgets.appendChild(renderOrdersByStatusWidget());
    
    // Widget de clientes recentes
    widgets.appendChild(renderRecentClientsWidget());
    
    // Widget de estoque baixo
    widgets.appendChild(renderLowStockWidget());
    
    grid.appendChild(widgets);
    
    return grid;
  }

  function renderKPIs() {
    const kpis = [
      {
        title: "Receita do Mês",
        value: state.osStats?.financial?.revenue || 0,
        format: "currency",
        trend: "+12%",
        icon: "💰",
        color: "revenue"
      },
      {
        title: "Ordens em Andamento",
        value: state.osStats?.distribution?.byStatus?.["in_progress"] || 0,
        subtitle: `de ${state.osStats?.total || 0} ordens`,
        icon: "⚙️",
        color: "orders"
      },
      {
        title: "Clientes Ativos",
        value: state.crmStats?.byStatus?.active || 0,
        subtitle: `+${state.crmStats?.createdThisMonth || 0} este mês`,
        icon: "👥",
        color: "clients"
      },
      {
        title: "Estoque Baixo",
        value: state.priceStats?.stock?.low || 0,
        subtitle: "itens precisam de reposição",
        icon: "📦",
        color: "inventory"
      },
      {
        title: "Ordens Atrasadas",
        value: state.osStats?.metrics?.overdueCount || 0,
        icon: "⏰",
        color: "warning"
      },
      {
        title: "Ticket Médio",
        value: state.osStats?.financial?.averageTicket || 0,
        format: "currency",
        subtitle: "por ordem finalizada",
        icon: "📊",
        color: "info"
      }
    ];
    
    const container = document.createElement("div");
    container.className = "kpi-container";
    
    kpis.forEach(kpi => {
      const card = Card.render({
        className: `kpi-card kpi-${kpi.color}`,
        content: `
          <div class="kpi-content">
            <div class="kpi-icon">${kpi.icon}</div>
            <div class="kpi-text">
              <div class="kpi-title">${kpi.title}</div>
              <div class="kpi-value">${formatValue(kpi.value, kpi.format)}</div>
              ${kpi.subtitle ? `<div class="kpi-subtitle">${kpi.subtitle}</div>` : ""}
              ${kpi.trend ? `<div class="kpi-trend ${kpi.trend.startsWith("+") ? "positive" : "negative"}">${kpi.trend}</div>` : ""}
            </div>
          </div>
        `
      });
      container.appendChild(card);
    });
    
    return container;
  }

  function renderRevenueWidget() {
    const revenueData = generateRevenueChartData();
    
    const content = document.createElement("div");
    content.className = "chart-container";
    
    // Título e controles
    const header = document.createElement("div");
    header.className = "chart-header";
    header.innerHTML = `
      <h3>Receita (Últimos 30 dias)</h3>
      <div class="chart-legend">
        <span class="legend-item"><span class="legend-color revenue"></span> Receita</span>
        <span class="legend-item"><span class="legend-color orders"></span> Ordens</span>
      </div>
    `;
    
    // Gráfico simples (em produção, usar biblioteca como Chart.js)
    const chart = document.createElement("div");
    chart.className = "simple-chart";
    
    // Barras do gráfico
    const bars = document.createElement("div");
    bars.className = "chart-bars";
    
    revenueData.forEach(day => {
      const barContainer = document.createElement("div");
      barContainer.className = "bar-container";
      
      const revenueBar = document.createElement("div");
      revenueBar.className = "bar revenue-bar";
      revenueBar.style.height = `${Math.min(100, (day.revenue / 1000) * 10)}%`;
      revenueBar.title = `R$ ${day.revenue.toFixed(2)}`;
      
      const ordersBar = document.createElement("div");
      ordersBar.className = "bar orders-bar";
      ordersBar.style.height = `${Math.min(100, day.orders * 10)}%`;
      ordersBar.title = `${day.orders} ordens`;
      
      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = day.label;
      
      barContainer.appendChild(revenueBar);
      barContainer.appendChild(ordersBar);
      barContainer.appendChild(label);
      bars.appendChild(barContainer);
    });
    
    // Eixo Y
    const yAxis = document.createElement("div");
    yAxis.className = "chart-y-axis";
    yAxis.innerHTML = `
      <div>R$ 1000</div>
      <div>R$ 750</div>
      <div>R$ 500</div>
      <div>R$ 250</div>
      <div>R$ 0</div>
    `;
    
    chart.appendChild(yAxis);
    chart.appendChild(bars);
    
    // Resumo
    const summary = document.createElement("div");
    summary.className = "chart-summary";
    summary.innerHTML = `
      <div class="summary-item">
        <div class="summary-label">Total 30 dias:</div>
        <div class="summary-value">${formatCurrency(revenueData.reduce((sum, day) => sum + day.revenue, 0))}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Média diária:</div>
        <div class="summary-value">${formatCurrency(revenueData.reduce((sum, day) => sum + day.revenue, 0) / revenueData.length)}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">Crescimento:</div>
        <div class="summary-value positive">+15.2%</div>
      </div>
    `;
    
    content.appendChild(header);
    content.appendChild(chart);
    content.appendChild(summary);
    
    return Card.render({
      title: "Desempenho Financeiro",
      content: content,
      actions: [{
        label: "Ver Detalhes",
        action: "view-details",
        variant: "primary"
      }]
    });
  }

  function renderOrdersByStatusWidget() {
    const statusData = state.osStats?.distribution?.byStatus || {};
    const total = Object.values(statusData).reduce((sum, val) => sum + val, 0);
    
    const content = document.createElement("div");
    content.className = "status-chart";
    
    // Doughnut chart simples
    const chart = document.createElement("div");
    chart.className = "doughnut-chart";
    
    // Legenda
    const legend = document.createElement("div");
    legend.className = "status-legend";
    
    const statuses = [
      { id: "open", label: "Abertas", color: "#3b82f6" },
      { id: "in_progress", label: "Em Andamento", color: "#f59e0b" },
      { id: "waiting_parts", label: "Aguardando Peças", color: "#ef4444" },
      { id: "ready", label: "Prontas", color: "#10b981" },
      { id: "delivered", label: "Entregues", color: "#8b5cf6" }
    ];
    
    statuses.forEach(status => {
      const count = statusData[status.id] || 0;
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
      
      const item = document.createElement("div");
      item.className = "legend-item";
      item.innerHTML = `
        <span class="legend-color" style="background: ${status.color}"></span>
        <span class="legend-label">${status.label}</span>
        <span class="legend-value">${count} (${percentage}%)</span>
      `;
      legend.appendChild(item);
    });
    
    content.appendChild(chart);
    content.appendChild(legend);
    
    // Métricas
    const metrics = document.createElement("div");
    metrics.className = "status-metrics";
    metrics.innerHTML = `
      <div class="metric">
        <div class="metric-value">${state.osStats?.metrics?.averageTurnaround || 0}h</div>
        <div class="metric-label">Tempo Médio</div>
      </div>
      <div class="metric">
        <div class="metric-value">${state.osStats?.metrics?.completionRate?.toFixed(1) || 0}%</div>
        <div class="metric-label">Taxa de Conclusão</div>
      </div>
      <div class="metric">
        <div class="metric-value">${state.osStats?.metrics?.overdueCount || 0}</div>
        <div class="metric-label">Atrasadas</div>
      </div>
    `;
    
    content.appendChild(metrics);
    
    return Card.render({
      title: "Status das Ordens",
      content: content
    });
  }

  function renderRecentClientsWidget() {
    const columns = [
      {
        key: "name",
        label: "Cliente",
        render: (client) => `
          <div class="client-row">
            <div class="client-avatar-small">${client.name?.charAt(0) || "?"}</div>
            <div>
              <div class="client-name">${client.name || "Sem nome"}</div>
              <div class="client-email">${client.email || ""}</div>
            </div>
          </div>
        `
      },
      {
        key: "createdAt",
        label: "Cadastrado",
        render: (client) => formatDate(client.createdAt, "short")
      },
      {
        key: "orders",
        label: "OS",
        render: (client) => client.statistics?.orderCount || 0
      }
    ];
    
    const table = Table.render({
      columns: columns,
      rows: state.recentClients.slice(0, 5),
      emptyText: "Nenhum cliente recente",
      onRowClick: (client) => openClientQuickView(client)
    });
    
    return Card.render({
      title: "Clientes Recentes",
      subtitle: "Últimos 5 cadastrados",
      content: table,
      actions: [{
        label: "Ver Todos",
        action: "view-all-clients",
        variant: "primary"
      }]
    });
  }

  function renderLowStockWidget() {
    if (state.lowStockItems.length === 0) {
      return Card.render({
        title: "Estoque",
        content: '<div class="empty-state">✅ Estoque em dia</div>'
      });
    }
    
    const items = state.lowStockItems.slice(0, 5);
    
    const content = document.createElement("div");
    content.className = "low-stock-list";
    
    items.forEach(item => {
      const row = document.createElement("div");
      row.className = "stock-item";
      row.innerHTML = `
        <div class="stock-info">
          <div class="stock-name">${item.name}</div>
          <div class="stock-details">${item.brand} ${item.model}</div>
        </div>
        <div class="stock-alert">
          <span class="stock-quantity">${item.stock} unidades</span>
          <span class="stock-status critical">CRÍTICO</span>
        </div>
      `;
      row.addEventListener("click", () => openStockAlert(item));
      content.appendChild(row);
    });
    
    if (state.lowStockItems.length > 5) {
      const more = document.createElement("div");
      more.className = "stock-more";
      more.textContent = `+${state.lowStockItems.length - 5} itens com estoque baixo`;
      content.appendChild(more);
    }
    
    return Card.render({
      title: "Alerta de Estoque",
      subtitle: "Itens que precisam de reposição",
      content: content,
      className: "stock-alert-widget"
    });
  }

  function renderOrdersTab() {
    const container = document.createElement("div");
    container.className = "orders-tab";
    
    // Filtros rápidos
    const filters = document.createElement("div");
    filters.className = "quick-filters";
    
    const statusFilters = [
      { label: "Todas", status: "all" },
      { label: "Abertas", status: "open" },
      { label: "Em Andamento", status: "in_progress" },
      { label: "Atrasadas", status: "overdue" },
      { label: "Prontas", status: "ready" }
    ];
    
    statusFilters.forEach(filter => {
      const btn = document.createElement("button");
      btn.className = "filter-btn";
      btn.textContent = filter.label;
      btn.addEventListener("click", () => filterOrders(filter.status));
      filters.appendChild(btn);
    });
    
    container.appendChild(filters);
    
    // Tabela de ordens
    const columns = [
      { key: "number", label: "Número" },
      { key: "clientName", label: "Cliente" },
      {
        key: "device",
        label: "Equipamento",
        render: (order) => `${order.deviceBrand || ""} ${order.deviceModel || ""}`.trim()
      },
      {
        key: "status",
        label: "Status",
        render: (order) => {
          const span = document.createElement("span");
          span.className = `order-status status-${order.status}`;
          span.textContent = getOrderStatusLabel(order.status);
          return span;
        }
      },
      {
        key: "total",
        label: "Valor",
        render: (order) => formatCurrency(order.total)
      },
      {
        key: "receivedAt",
        label: "Recebido",
        render: (order) => formatDate(order.receivedAt, "short")
      }
    ];
    
    const table = Table.render({
      columns: columns,
      rows: state.recentOrders,
      emptyText: "Nenhuma ordem encontrada",
      onRowClick: (order) => openOrderDetail(order)
    });
    
    container.appendChild(Card.render({
      title: "Ordens de Serviço",
      content: table,
      actions: [{
        label: "Nova OS",
        action: "new-order",
        variant: "primary"
      }]
    }));
    
    return container;
  }

  function renderClientsTab() {
    const container = document.createElement("div");
    
    // Métricas de clientes
    const metrics = document.createElement("div");
    metrics.className = "client-metrics-grid";
    
    const metricCards = [
      {
        title: "Total de Clientes",
        value: state.crmStats?.total || 0,
        trend: "+5%",
        icon: "👥"
      },
      {
        title: "Novos este Mês",
        value: state.crmStats?.createdThisMonth || 0,
        trend: "+12%",
        icon: "🆕"
      },
      {
        title: "Clientes Ativos",
        value: state.crmStats?.byStatus?.active || 0,
        percentage: state.crmStats?.total ? ((state.crmStats.byStatus?.active / state.crmStats.total) * 100).toFixed(1) : 0
      },
      {
        title: "Ticket Médio por Cliente",
        value: calculateAverageClientValue(),
        format: "currency",
        icon: "💰"
      }
    ];
    
    metricCards.forEach(metric => {
      const card = Card.render({
        className: "client-metric-card",
        content: `
          <div class="metric-content">
            ${metric.icon ? `<div class="metric-icon">${metric.icon}</div>` : ""}
            <div class="metric-text">
              <div class="metric-title">${metric.title}</div>
              <div class="metric-value">${formatValue(metric.value, metric.format)}</div>
              ${metric.trend ? `<div class="metric-trend positive">${metric.trend}</div>` : ""}
              ${metric.percentage ? `<div class="metric-percentage">${metric.percentage}% do total</div>` : ""}
            </div>
          </div>
        `
      });
      metrics.appendChild(card);
    });
    
    container.appendChild(metrics);
    
    // Distribuição por cidade
    if (state.crmStats?.byCity) {
      const cities = Object.entries(state.crmStats.byCity)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      if (cities.length > 0) {
        const cityChart = document.createElement("div");
        cityChart.className = "city-distribution";
        
        const cityList = document.createElement("div");
        cityList.className = "city-list";
        
        cities.forEach(([city, count]) => {
          const percentage = (count / state.crmStats.total * 100).toFixed(1);
          const bar = document.createElement("div");
          bar.className = "city-bar";
          bar.innerHTML = `
            <div class="city-name">${city}</div>
            <div class="city-bar-container">
              <div class="city-bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="city-count">${count} (${percentage}%)</div>
          `;
          cityList.appendChild(bar);
        });
        
        cityChart.appendChild(Card.render({
          title: "Top Cidades",
          content: cityList
        }));
        
        container.appendChild(cityChart);
      }
    }
    
    return container;
  }

  function renderInventoryTab() {
    const container = document.createElement("div");
    
    // Alertas de estoque
    if (state.lowStockItems.length > 0) {
      const alertCard = Card.render({
        title: "⚠️ Alertas de Estoque",
        className: "inventory-alert",
        content: `
          <div class="alert-content">
            <p><strong>${state.lowStockItems.length} itens</strong> estão com estoque baixo ou crítico.</p>
            <div class="alert-actions">
              <button class="btn btn-warning" id="viewLowStock">Ver Itens</button>
              <button class="btn btn-primary" id="generatePurchaseList">Gerar Lista de Compra</button>
            </div>
          </div>
        `
      });
      container.appendChild(alertCard);
      
      setTimeout(() => {
        const viewBtn = alertCard.querySelector("#viewLowStock");
        const purchaseBtn = alertCard.querySelector("#generatePurchaseList");
        
        if (viewBtn) viewBtn.addEventListener("click", () => openLowStockModal());
        if (purchaseBtn) purchaseBtn.addEventListener("click", generatePurchaseList);
      }, 0);
    }
    
    // Estatísticas de estoque
    if (state.priceStats) {
      const statsGrid = document.createElement("div");
      statsGrid.className = "inventory-stats-grid";
      
      const stats = [
        {
          title: "Valor Total em Estoque",
          value: state.priceStats.stock?.value || 0,
          format: "currency",
          icon: "💰"
        },
        {
          title: "Total de Itens",
          value: state.priceStats.total || 0,
          icon: "📦"
        },
        {
          title: "Itens com Estoque Baixo",
          value: state.priceStats.stock?.low || 0,
          color: "warning",
          icon: "⚠️"
        },
        {
          title: "Itens Sem Estoque",
          value: state.priceStats.stock?.out || 0,
          color: "danger",
          icon: "❌"
        }
      ];
      
      stats.forEach(stat => {
        const card = Card.render({
          className: `inventory-stat-card ${stat.color ? `stat-${stat.color}` : ""}`,
          content: `
            <div class="inventory-stat">
              ${stat.icon ? `<div class="stat-icon">${stat.icon}</div>` : ""}
              <div class="stat-info">
                <div class="stat-title">${stat.title}</div>
                <div class="stat-value">${formatValue(stat.value, stat.format)}</div>
              </div>
            </div>
          `
        });
        statsGrid.appendChild(card);
      });
      
      container.appendChild(statsGrid);
    }
    
    // Itens mais vendidos
    const topItemsCard = Card.render({
      title: "Itens Mais Utilizados",
      content: `
        <div class="top-items-list">
          <div class="top-item">
            <div class="item-name">Tela iPhone 11</div>
            <div class="item-stats">
              <span class="item-count">48 vezes</span>
              <span class="item-trend positive">+12%</span>
            </div>
          </div>
          <div class="top-item">
            <div class="item-name">Bateria Samsung A12</div>
            <div class="item-stats">
              <span class="item-count">32 vezes</span>
              <span class="item-trend positive">+8%</span>
            </div>
          </div>
          <div class="top-item">
            <div class="item-name">Conector de Carga</div>
            <div class="item-stats">
              <span class="item-count">28 vezes</span>
              <span class="item-trend negative">-3%</span>
            </div>
          </div>
        </div>
      `
    });
    
    container.appendChild(topItemsCard);
    
    return container;
  }

  function renderFinancialTab() {
    const container = document.createElement("div");
    
    // Resumo financeiro
    const summary = Card.render({
      title: "Resumo Financeiro",
      content: `
        <div class="financial-summary">
          <div class="summary-row">
            <div class="summary-label">Receita Total:</div>
            <div class="summary-value positive">${formatCurrency(state.osStats?.financial?.revenue || 0)}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">Receita Pendente:</div>
            <div class="summary-value warning">${formatCurrency(state.osStats?.financial?.pending || 0)}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">Ticket Médio:</div>
            <div class="summary-value">${formatCurrency(state.osStats?.financial?.averageTicket || 0)}</div>
          </div>
          <div class="summary-row">
            <div class="summary-label">Custo de Estoque:</div>
            <div class="summary-value">${formatCurrency(state.priceStats?.stock?.value || 0)}</div>
          </div>
        </div>
      `
    });
    
    container.appendChild(summary);
    
    // Métodos de pagamento
    const paymentMethods = Card.render({
      title: "Métodos de Pagamento",
      content: `
        <div class="payment-methods">
          <div class="method">
            <div class="method-name">Pix</div>
            <div class="method-bar">
              <div class="method-fill" style="width: 45%"></div>
            </div>
            <div class="method-percentage">45%</div>
          </div>
          <div class="method">
            <div class="method-name">Cartão de Crédito</div>
            <div class="method-bar">
              <div class="method-fill" style="width: 30%"></div>
            </div>
            <div class="method-percentage">30%</div>
          </div>
          <div class="method">
            <div class="method-name">Dinheiro</div>
            <div class="method-bar">
              <div class="method-fill" style="width: 20%"></div>
            </div>
            <div class="method-percentage">20%</div>
          </div>
          <div class="method">
            <div class="method-name">Outros</div>
            <div class="method-bar">
              <div class="method-fill" style="width: 5%"></div>
            </div>
            <div class="method-percentage">5%</div>
          </div>
        </div>
      `
    });
    
    container.appendChild(paymentMethods);
    
    return container;
  }

  function renderSkeleton() {
    root.innerHTML = `
      <div class="dashboard-page">
        <header class="dashboard-header skeleton">
          <div class="dashboard-title">
            <div class="skeleton-text" style="width: 200px; height: 32px;"></div>
            <div class="skeleton-text" style="width: 150px; height: 16px;"></div>
          </div>
          <div class="dashboard-controls">
            <div class="skeleton-text" style="width: 100px; height: 36px;"></div>
            <div class="skeleton-text" style="width: 100px; height: 36px;"></div>
            <div class="skeleton-text" style="width: 100px; height: 36px;"></div>
          </div>
        </header>
        
        <div class="skeleton-tabs">
          <div class="skeleton-text" style="width: 80px; height: 40px;"></div>
          <div class="skeleton-text" style="width: 80px; height: 40px;"></div>
          <div class="skeleton-text" style="width: 80px; height: 40px;"></div>
          <div class="skeleton-text" style="width: 80px; height: 40px;"></div>
        </div>
        
        <div class="dashboard-grid skeleton">
          <div class="skeleton-card" style="height: 200px;"></div>
          <div class="skeleton-card" style="height: 200px;"></div>
          <div class="skeleton-card" style="height: 200px;"></div>
          <div class="skeleton-card" style="height: 200px;"></div>
          <div class="skeleton-card" style="height: 400px; grid-column: span 2;"></div>
          <div class="skeleton-card" style="height: 400px; grid-column: span 2;"></div>
        </div>
      </div>
    `;
  }

  // ==================== FUNÇÕES UTILITÁRIAS ====================
  async function loadOSStats() {
    try {
      state.osStats = await OSRepo.getStats(state.period);
    } catch (error) {
      console.error("Erro ao carregar estatísticas de OS:", error);
      state.osStats = {
        total: 0,
        financial: { revenue: 0, pending: 0, averageTicket: 0 },
        distribution: { byStatus: {} },
        metrics: { overdueCount: 0, completionRate: 0, averageTurnaround: 0 }
      };
    }
  }

  async function loadCRMStats() {
    try {
      state.crmStats = await CRMRepo.getStats();
    } catch (error) {
      console.error("Erro ao carregar estatísticas de CRM:", error);
      state.crmStats = {
        total: 0,
        byStatus: {},
        byCity: {},
        createdThisMonth: 0,
        recentlyUpdated: 0
      };
    }
  }

  async function loadPriceStats() {
    try {
      state.priceStats = await PriceRepo.getStats();
    } catch (error) {
      console.error("Erro ao carregar estatísticas de preços:", error);
      state.priceStats = {
        total: 0,
        stock: { total: 0, value: 0, low: 0, out: 0 }
      };
    }
  }

  async function loadRecentData() {
    try {
      // Ordens recentes
      const ordersResult = await OSRepo.find({
        page: 1,
        pageSize: 10,
        sortBy: "receivedAt",
        sortOrder: "desc"
      });
      state.recentOrders = ordersResult.items || [];
      
      // Clientes recentes
      const clientsResult = await CRMRepo.find({
        page: 1,
        pageSize: 5,
        sortBy: "createdAt",
        sortOrder: "desc"
      });
      state.recentClients = clientsResult.items || [];
      
      // Itens com estoque baixo
      const lowStockResult = await PriceRepo.find({
        stockStatus: "low",
        page: 1,
        pageSize: 10
      });
      state.lowStockItems = lowStockResult.items || [];
      
      // Ordens atrasadas
      const overdueResult = await OSRepo.find({
        overdue: true,
        page: 1,
        pageSize: 5
      });
      state.overdueOrders = overdueResult.items || [];
    } catch (error) {
      console.error("Erro ao carregar dados recentes:", error);
    }
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  }

  function formatValue(value, format = "number") {
    if (format === "currency") return formatCurrency(value);
    if (format === "percent") return `${value}%`;
    return value.toString();
  }

  function formatDate(dateStr, format = "short") {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    
    if (format === "short") {
      return date.toLocaleDateString("pt-BR");
    }
    
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getOrderStatusLabel(status) {
    const labels = {
      open: "Aberta",
      in_progress: "Em Andamento",
      waiting_parts: "Aguardando Peças",
      waiting_approval: "Aguardando Aprovação",
      ready: "Pronta",
      delivered: "Entregue",
      canceled: "Cancelada",
      paid: "Paga"
    };
    return labels[status] || status;
  }

  function generateRevenueChartData() {
    // Dados simulados para o gráfico
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const revenue = Math.random() * 1000 + 200;
      const orders = Math.floor(Math.random() * 5) + 1;
      
      data.push({
        date: date.toISOString().split("T")[0],
        label: date.getDate().toString().padStart(2, "0"),
        revenue: revenue,
        orders: orders
      });
    }
    
    return data;
  }

  function calculateAverageClientValue() {
    // Em produção, calcular baseado em histórico de ordens
    return 250.0;
  }

  // ==================== AÇÕES E EVENTOS ====================
  function refresh() {
    render();
  }

  function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      render();
    }, 5 * 60 * 1000); // 5 minutos
  }

  function filterOrders(status) {
    // Implementar filtragem de ordens
    console.log("Filtrar ordens por:", status);
  }

  function openClientQuickView(client) {
    const modal = Modal.create({
      title: `Cliente: ${client.name}`,
      content: `
        <div class="quick-view">
          <div class="quick-view-section">
            <h3>Informações</h3>
            <p><strong>Email:</strong> ${client.email || "-"}</p>
            <p><strong>Telefone:</strong> ${formatPhone(client.phone) || "-"}</p>
            <p><strong>Cidade:</strong> ${client.city || "-"}</p>
          </div>
          <div class="quick-view-section">
            <h3>Estatísticas</h3>
            <p><strong>Total de Ordens:</strong> ${client.statistics?.orderCount || 0}</p>
            <p><strong>Total Gasto:</strong> ${formatCurrency(client.statistics?.totalSpent || 0)}</p>
            <p><strong>Última Ordem:</strong> ${client.statistics?.lastOrder?.date ? formatDate(client.statistics.lastOrder.date, "short") : "-"}</p>
          </div>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="this.closest('.c-modal__overlay')?.remove()">Fechar</button>
        <button class="btn btn-primary" id="viewClientDetails">Ver Detalhes</button>
      `,
      onClose: () => modal.remove()
    });
    
    Modal.open(modal);
  }

  function openOrderDetail(order) {
    // Implementar visualização detalhada da ordem
    console.log("Abrir detalhes da ordem:", order.id);
  }

  function openStockAlert(item) {
    const modal = Modal.create({
      title: `Alerta de Estoque: ${item.name}`,
      content: `
        <div class="stock-alert-modal">
          <div class="alert-message">
            <p>O item <strong>${item.name}</strong> está com estoque baixo!</p>
            <div class="alert-details">
              <p><strong>Quantidade atual:</strong> ${item.stock} unidades</p>
              <p><strong>Limite mínimo:</strong> ${item.lowStockThreshold || 5} unidades</p>
              <p><strong>Fornecedor:</strong> ${item.supplierName || "Não informado"}</p>
              <p><strong>Código:</strong> ${item.supplierCode || "N/A"}</p>
            </div>
          </div>
        </div>
      `,
      footer: `
        <button class="btn" onclick="this.closest('.c-modal__overlay')?.remove()">Fechar</button>
        <button class="btn btn-primary" id="orderMoreStock">Solicitar Mais</button>
        <button class="btn btn-secondary" id="updateThreshold">Alterar Limite</button>
      `,
      onClose: () => modal.remove()
    });
    
    Modal.open(modal);
  }

  function openLowStockModal() {
    const table = Table.render({
      columns: [
        { key: "name", label: "Item" },
        { key: "sku", label: "SKU" },
        { key: "stock", label: "Estoque Atual" },
        { key: "lowStockThreshold", label: "Limite Mínimo" },
        { key: "salePrice", label: "Preço", render: (item) => formatCurrency(item.salePrice) }
      ],
      rows: state.lowStockItems,
      emptyText: "Nenhum item com estoque baixo"
    });
    
    currentModal = Modal.create({
      title: "Itens com Estoque Baixo",
      content: table,
      size: "lg",
      footer: `
        <button class="btn" onclick="this.closest('.c-modal__overlay')?.remove()">Fechar</button>
        <button class="btn btn-primary" id="exportStockList">Exportar Lista</button>
        <button class="btn btn-success" id="markAsOrdered">Marcar como Pedido</button>
      `,
      onClose: () => { currentModal = null; }
    });
    
    Modal.open(currentModal);
  }

  function generatePurchaseList() {
    const items = state.lowStockItems.map(item => ({
      item: item.name,
      sku: item.sku,
      current: item.stock,
      minimum: item.lowStockThreshold || 5,
      order: Math.max(10, (item.lowStockThreshold || 5) * 2 - item.stock),
      supplier: item.supplierName || "Não informado"
    }));
    
    const content = `
      <div class="purchase-list">
        <h3>Lista de Compra - ${new Date().toLocaleDateString("pt-BR")}</h3>
        <table class="purchase-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>SKU</th>
              <th>Estoque Atual</th>
              <th>Quantidade a Pedir</th>
              <th>Fornecedor</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.item}</td>
                <td>${item.sku}</td>
                <td>${item.current}</td>
                <td><strong>${item.order}</strong></td>
                <td>${item.supplier}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <p class="summary">Total: ${items.length} itens para pedir</p>
      </div>
    `;
    
    const modal = Modal.create({
      title: "Lista de Compra",
      content: content,
      size: "lg",
      footer: `
        <button class="btn" onclick="this.closest('.c-modal__overlay')?.remove()">Fechar</button>
        <button class="btn btn-primary" id="printList">Imprimir</button>
        <button class="btn btn-success" id="exportList">Exportar CSV</button>
      `,
      onClose: () => modal.remove()
    });
    
    Modal.open(modal);
  }

  function generateReport() {
    // Implementar geração de relatório
    console.log("Gerar relatório para período:", state.period);
  }

  function formatPhone(phone) {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    return digits;
  }

  function injectStyles() {
    if (document.getElementById("dashboard-styles")) return;
    
    const styles = document.createElement("style");
    styles.id = "dashboard-styles";
    styles.textContent = `
      .dashboard-page {
        padding: 20px;
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 30px;
      }
      
      .dashboard-title h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        color: #1f2937;
      }
      
      .dashboard-title .subtitle {
        margin: 8px 0 0;
        color: #6b7280;
        font-size: 16px;
      }
      
      .dashboard-controls {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .period-select {
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        font-size: 14px;
      }
      
      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-top: 20px;
      }
      
      .kpi-grid {
        grid-column: 1 / -1;
        margin-bottom: 20px;
      }
      
      .kpi-container {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 15px;
      }
      
      .kpi-card {
        padding: 20px;
        border-radius: 8px;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .kpi-content {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      
      .kpi-icon {
        font-size: 32px;
      }
      
      .kpi-text {
        flex: 1;
      }
      
      .kpi-title {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      
      .kpi-value {
        font-size: 24px;
        font-weight: 700;
        color: #1f2937;
        margin: 4px 0;
      }
      
      .kpi-subtitle {
        font-size: 12px;
        color: #9ca3af;
      }
      
      .kpi-trend {
        font-size: 12px;
        font-weight: 600;
        margin-top: 4px;
      }
      
      .kpi-trend.positive {
        color: #10b981;
      }
      
      .kpi-trend.negative {
        color: #ef4444;
      }
      
      .kpi-revenue { border-left: 4px solid #10b981; }
      .kpi-orders { border-left: 4px solid #3b82f6; }
      .kpi-clients { border-left: 4px solid #8b5cf6; }
      .kpi-inventory { border-left: 4px solid #f59e0b; }
      .kpi-warning { border-left: 4px solid #ef4444; }
      .kpi-info { border-left: 4px solid #06b6d4; }
      
      .widgets-grid {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
      }
      
      .chart-container {
        padding: 15px;
      }
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .chart-header h3 {
        margin: 0;
        font-size: 16px;
        color: #374151;
      }
      
      .chart-legend {
        display: flex;
        gap: 15px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: #6b7280;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .legend-color.revenue { background: #10b981; }
      .legend-color.orders { background: #3b82f6; }
      
      .simple-chart {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        height: 200px;
        margin-bottom: 20px;
      }
      
      .chart-y-axis {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 100%;
        padding-right: 10px;
        font-size: 10px;
        color: #9ca3af;
        text-align: right;
      }
      
      .chart-bars {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        flex: 1;
      }
      
      .bar-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        height: 100%;
      }
      
      .bar {
        width: 20px;
        border-radius: 3px 3px 0 0;
        transition: height 0.3s ease;
      }
      
      .revenue-bar {
        background: #10b981;
      }
      
      .orders-bar {
        background: #3b82f6;
        margin-top: 2px;
      }
      
      .bar-label {
        margin-top: 8px;
        font-size: 10px;
        color: #9ca3af;
      }
      
      .chart-summary {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
      }
      
      .summary-item {
        text-align: center;
      }
      
      .summary-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      
      .summary-value {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .summary-value.positive {
        color: #10b981;
      }
      
      .status-chart {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .doughnut-chart {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: conic-gradient(
          #3b82f6 0% 25%,
          #f59e0b 25% 45%,
          #ef4444 45% 60%,
          #10b981 60% 80%,
          #8b5cf6 80% 100%
        );
        margin: 0 auto;
      }
      
      .status-legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        background: #f9fafb;
        border-radius: 6px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 3px;
      }
      
      .legend-label {
        flex: 1;
        font-size: 13px;
        color: #374151;
      }
      
      .legend-value {
        font-size: 13px;
        font-weight: 600;
        color: #1f2937;
      }
      
      .status-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 15px;
        text-align: center;
      }
      
      .metric {
        padding: 10px;
        background: #f9fafb;
        border-radius: 6px;
      }
      
      .metric-value {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 4px;
      }
      
      .metric-label {
        font-size: 11px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .client-row {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .client-avatar-small {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-weight: 600;
      }
      
      .client-name {
        font-weight: 600;
        color: #1f2937;
      }
      
      .client-email {
        font-size: 12px;
        color: #6b7280;
      }
      
      .low-stock-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .stock-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #fef3c7;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .stock-item:hover {
        background: #fde68a;
      }
      
      .stock-info {
        flex: 1;
      }
      
      .stock-name {
        font-weight: 600;
        color: #92400e;
      }
      
      .stock-details {
        font-size: 12px;
        color: #b45309;
      }
      
      .stock-alert {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }
      
      .stock-quantity {
        font-weight: 700;
        color: #dc2626;
      }
      
      .stock-status {
        font-size: 11px;
        padding: 2px 6px;
        background: #dc2626;
        color: white;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .stock-more {
        text-align: center;
        padding: 10px;
        color: #6b7280;
        font-size: 13px;
        border-top: 1px solid #e5e7eb;
        margin-top: 5px;
      }
      
      .stock-alert-widget {
        border: 2px solid #f59e0b;
      }
      
      .empty-state {
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
      }
      
      .orders-tab .quick-filters {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .client-metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .client-metric-card {
        padding: 15px;
      }
      
      .metric-content {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      
      .metric-icon {
        font-size: 24px;
      }
      
      .metric-text {
        flex: 1;
      }
      
      .metric-title {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .metric-value {
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
        margin: 4px 0;
      }
      
      .metric-trend {
        font-size: 11px;
        font-weight: 600;
      }
      
      .metric-trend.positive {
        color: #10b981;
      }
      
      .metric-percentage {
        font-size: 11px;
        color: #9ca3af;
      }
      
      .city-distribution {
        margin-top: 20px;
      }
      
      .city-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .city-bar {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .city-name {
        width: 120px;
        font-size: 14px;
        color: #374151;
      }
      
      .city-bar-container {
        flex: 1;
        height: 20px;
        background: #f3f4f6;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .city-bar-fill {
        height: 100%;
        background: #3b82f6;
        border-radius: 10px;
        transition: width 0.5s ease;
      }
      
      .city-count {
        width: 80px;
        text-align: right;
        font-size: 13px;
        color: #6b7280;
      }
      
      .inventory-alert {
        border: 2px solid #ef4444;
        margin-bottom: 20px;
      }
      
      .alert-content {
        padding: 15px;
      }
      
      .alert-content p {
        margin: 0 0 15px 0;
      }
      
      .alert-actions {
        display: flex;
        gap: 10px;
      }
      
      .inventory-stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .inventory-stat-card {
        padding: 15px;
      }
      
      .stat-warning {
        border-left: 4px solid #f59e0b;
      }
      
      .stat-danger {
        border-left: 4px solid #ef4444;
      }
      
      .inventory-stat {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      
      .stat-icon {
        font-size: 24px;
      }
      
      .stat-info {
        flex: 1;
      }
      
      .stat-title {
        font-size: 12px;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: 700;
        color: #1f2937;
      }
      
      .top-items-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .top-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        background: #f9fafb;
        border-radius: 6px;
      }
      
      .item-name {
        font-weight: 600;
        color: #1f2937;
      }
      
      .item-stats {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .item-count {
        font-weight: 600;
        color: #374151;
      }
      
      .item-trend {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 10px;
      }
      
      .item-trend.positive {
        background: #d1fae5;
        color: #065f46;
      }
      
      .item-trend.negative {
        background: #fee2e2;
        color: #dc2626;
      }
      
      .financial-summary {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 10px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .summary-label {
        font-size: 14px;
        color: #374151;
      }
      
      .summary-value {
        font-size: 16px;
        font-weight: 600;
      }
      
      .summary-value.positive {
        color: #10b981;
      }
      
      .summary-value.warning {
        color: #f59e0b;
      }
      
      .payment-methods {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .method {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      
      .method-name {
        width: 120px;
        font-size: 14px;
        color: #374151;
      }
      
      .method-bar {
        flex: 1;
        height: 20px;
        background: #f3f4f6;
        border-radius: 10px;
        overflow: hidden;
      }
      
      .method-fill {
        height: 100%;
        background: #3b82f6;
        border-radius: 10px;
      }
      
      .method-percentage {
        width: 40px;
        text-align: right;
        font-weight: 600;
        color: #374151;
      }
      
      .order-status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      
      .status-open { background: #dbeafe; color: #1e40af; }
      .status-in_progress { background: #fef3c7; color: #92400e; }
      .status-waiting_parts { background: #fee2e2; color: #dc2626; }
      .status-ready { background: #d1fae5; color: #065f46; }
      .status-delivered { background: #ede9fe; color: #5b21b6; }
      .status-canceled { background: #f3f4f6; color: #6b7280; }
      .status-paid { background: #dcfce7; color: #166534; }
      
      .skeleton .skeleton-text,
      .skeleton-card,
      .skeleton-tabs .skeleton-text {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
        border-radius: 4px;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      @media (max-width: 1200px) {
        .dashboard-grid {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .kpi-container {
          grid-template-columns: repeat(3, 1fr);
        }
        
        .widgets-grid {
          grid-template-columns: 1fr;
        }
        
        .client-metrics-grid,
        .inventory-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .dashboard-header {
          flex-direction: column;
          gap: 20px;
        }
        
        .dashboard-controls {
          width: 100%;
          justify-content: flex-start;
        }
        
        .dashboard-grid {
          grid-template-columns: 1fr;
        }
        
        .kpi-container {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .client-metrics-grid,
        .inventory-stats-grid {
          grid-template-columns: 1fr;
        }
      }
      
      @media (max-width: 480px) {
        .kpi-container {
          grid-template-columns: 1fr;
        }
        
        .chart-summary {
          grid-template-columns: 1fr;
          gap: 10px;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }

  // ==================== API PÚBLICA ====================
  return {
    async mount({ rootEl }) {
      root = rootEl;
      await render();
    },
    
    unmount() {
      if (refreshInterval) clearInterval(refreshInterval);
      if (currentModal) Modal.close(currentModal);
      root = null;
    },
    
    refresh() {
      render();
    },
    
    getState() {
      return { ...state };
    },
    
    setPeriod(period) {
      state.period = period;
      refresh();
    }
  };
})();
window.Pages = window.Pages || {};
window.Pages["dashboard"] = DashboardPage;