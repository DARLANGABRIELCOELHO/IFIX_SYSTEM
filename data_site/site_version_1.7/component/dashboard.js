// components/dashboard.js ATUALIZADO
import { db } from '../databank/bankservice.js';

// Verificar se Chart.js está disponível
let ChartInstance = null;
if (typeof window !== 'undefined' && window.Chart) {
    ChartInstance = window.Chart;
}

export async function renderDashboard() {
    const contentArea = document.querySelector('#dashboardContent');
    if (!contentArea) {
        console.error('Área do dashboard não encontrada');
        return;
    }
    
    try {
        const stats = await db.getDashboardStats();
        
        contentArea.innerHTML = `
            <div class="dashboard-header mb-4">
                <h2 class="mb-2">Dashboard</h2>
                <p class="text-light">Resumo geral da operação</p>
            </div>

            <div class="grid grid-3 mb-4">
                <!-- Card: Ganhos Mensais -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-money-bill-wave"></i>
                            Ganhos Mensais
                        </h3>
                        <span class="badge badge-success">+12%</span>
                    </div>
                    <div class="card-body">
                        <div class="stat-value text-orange" style="font-size: 2rem;">
                            ${formatCurrency(stats.monthlyEarnings)}
                        </div>
                        <p class="text-light mb-0">Total recebido este mês</p>
                        <div class="progress-bar mt-3" style="height: 6px; background: var(--color-gray-charcoal); border-radius: 3px;">
                            <div class="progress-fill" style="width: ${stats.monthlyTarget}%; height: 100%; background: var(--color-orange-primary); border-radius: 3px;"></div>
                        </div>
                        <small class="text-light">${stats.monthlyTarget}% da meta mensal</small>
                    </div>
                </div>

                <!-- Card: Total de Serviços -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-clipboard-check"></i>
                            Total de Serviços
                        </h3>
                        <span class="badge badge-primary">Este mês</span>
                    </div>
                    <div class="card-body">
                        <div class="stat-value" style="font-size: 2.5rem;">${stats.totalServices}</div>
                        <p class="text-light mb-0">Serviços realizados</p>
                        <div class="d-flex justify-between mt-3">
                            <div>
                                <small class="text-light">Concluídos</small>
                                <div>${stats.completedServices}</div>
                            </div>
                            <div>
                                <small class="text-light">Em andamento</small>
                                <div>${stats.pendingServices}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Card: Total de Clientes -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-users"></i>
                            Total de Clientes
                        </h3>
                        <span class="badge badge-info">+${stats.newClientsToday} hoje</span>
                    </div>
                    <div class="card-body">
                        <div class="stat-value" style="font-size: 2.5rem;">${stats.totalClients}</div>
                        <p class="text-light mb-0">Clientes cadastrados</p>
                        <div class="d-flex align-center gap-2 mt-3">
                            <div class="client-avatar" style="width: 40px; height: 40px; background: var(--color-gray-charcoal); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user-plus"></i>
                            </div>
                            <div>
                                <small class="text-light">Novos clientes este mês</small>
                                <div>${stats.newClientsThisMonth}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos e Tabelas -->
            <div class="grid grid-2 mb-4">
                <!-- Gráfico de Serviços por Mês -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-chart-line"></i>
                            Serviços por Mês
                        </h3>
                        <select class="form-control form-control-sm" style="width: 150px;" id="chartPeriod">
                            <option>Últimos 6 meses</option>
                            <option>Últimos 12 meses</option>
                        </select>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="servicesChart"></canvas>
                        </div>
                    </div>
                </div>

                <!-- Tipos de Serviços -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-pie-chart"></i>
                            Tipos de Serviços
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="height: 300px;">
                            <canvas id="serviceTypesChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Últimas OS -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">
                        <i class="fas fa-history"></i>
                        Últimas Ordens de Serviço
                    </h3>
                    <button class="btn btn-sm btn-outline" onclick="system.switchTab('ordens')">
                        Ver todas
                    </button>
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
                                    <th>Data</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody id="recentOrdersTable">
                                <!-- Preenchido via JavaScript -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Preencher tabela de OS recentes
        await renderRecentOrders();
        
        // Inicializar gráficos se Chart.js estiver disponível
        if (ChartInstance) {
            initializeCharts(stats);
        } else {
            console.warn('Chart.js não carregado. Recarregando...');
            // Tentar carregar Chart.js dinamicamente
            loadChartAndInitialize(stats);
        }
        
    } catch (error) {
        console.error('Erro ao renderizar dashboard:', error);
        contentArea.innerHTML = `
            <div class="card">
                <div class="text-center" style="padding: 3rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #F44336;"></i>
                    <h3 class="mt-3">Erro ao carregar dashboard</h3>
                    <p class="text-light mt-2">${error.message}</p>
                </div>
            </div>
        `;
    }
}

async function renderRecentOrders() {
    try {
        const recentOrders = await db.getRecentOrders(5);
        const tableBody = document.getElementById('recentOrdersTable');
        
        if (tableBody) {
            tableBody.innerHTML = recentOrders.map(order => `
                <tr>
                    <td>
                        <strong>#${order.protocol}</strong>
                    </td>
                    <td>
                        <div class="d-flex align-center gap-2">
                            <div class="avatar-sm" style="width: 32px; height: 32px; background: var(--color-gray-charcoal); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user"></i>
                            </div>
                            <div>
                                <div>${order.clientName}</div>
                                <small class="text-light">${order.clientPhone}</small>
                            </div>
                        </div>
                    </td>
                    <td>${order.equipment}</td>
                    <td>
                        <span class="badge ${getStatusBadgeClass(order.status)}">
                            ${order.status}
                        </span>
                    </td>
                    <td>${formatDate(order.date)}</td>
                    <td>
                        <strong class="text-orange">${formatCurrency(order.value)}</strong>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar ordens recentes:', error);
    }
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

function initializeCharts(stats) {
    // Inicializar gráfico de serviços por mês
    const servicesCtx = document.getElementById('servicesChart')?.getContext('2d');
    if (servicesCtx && window.Chart) {
        new window.Chart(servicesCtx, {
            type: 'line',
            data: {
                labels: stats.monthlyServices.labels.slice(-6),
                datasets: [{
                    label: 'Serviços Realizados',
                    data: stats.monthlyServices.data.slice(-6),
                    borderColor: '#F57C00',
                    backgroundColor: 'rgba(245, 124, 0, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#F2F2F2'
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: '#2A2A2A'
                        },
                        ticks: {
                            color: '#B0B0B0'
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#2A2A2A'
                        },
                        ticks: {
                            color: '#B0B0B0'
                        }
                    }
                }
            }
        });
    }

    // Inicializar gráfico de tipos de serviços
    const typesCtx = document.getElementById('serviceTypesChart')?.getContext('2d');
    if (typesCtx && window.Chart) {
        new window.Chart(typesCtx, {
            type: 'doughnut',
            data: {
                labels: stats.serviceTypes.labels,
                datasets: [{
                    data: stats.serviceTypes.data,
                    backgroundColor: [
                        '#F57C00',
                        '#EF6C00',
                        '#C75B12',
                        '#FF9800',
                        '#FFB74D',
                        '#4CAF50',
                        '#2196F3',
                        '#9C27B0'
                    ],
                    borderWidth: 2,
                    borderColor: '#181818'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#F2F2F2',
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }
}

function loadChartAndInitialize(stats) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => {
        console.log('Chart.js carregado com sucesso');
        initializeCharts(stats);
    };
    script.onerror = () => {
        console.error('Falha ao carregar Chart.js');
        // Mostrar mensagem de fallback
        document.getElementById('servicesChart').parentElement.innerHTML = `
            <div class="text-center text-light" style="padding: 3rem;">
                <i class="fas fa-chart-line" style="font-size: 3rem;"></i>
                <p class="mt-3">Gráfico indisponível no momento</p>
            </div>
        `;
        document.getElementById('serviceTypesChart').parentElement.innerHTML = `
            <div class="text-center text-light" style="padding: 3rem;">
                <i class="fas fa-chart-pie" style="font-size: 3rem;"></i>
                <p class="mt-3">Gráfico indisponível no momento</p>
            </div>
        `;
    };
    document.head.appendChild(script);
}

// Funções auxiliares globais
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