// components/dashboard.js - Módulo do Dashboard
window.DashboardModule = (function() {
    const module = {
        render() {
            return `
                <div class="dashboard-module">
                    <div class="dashboard-header">
                        <h2>Dashboard IFIX</h2>
                        <div class="period-selector">
                            <select id="periodSelect" class="form-control" style="width: auto;">
                                <option value="today">Hoje</option>
                                <option value="week" selected>Esta Semana</option>
                                <option value="month">Este Mês</option>
                                <option value="year">Este Ano</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12 col-md-4">
                            <div class="card">
                                <div class="card-title">Ganhos Mensais</div>
                                <div class="card-value" id="monthlyEarnings">R$ 0,00</div>
                                <div class="card-trend">
                                    <span class="trend-up">↑ 12% em relação ao mês passado</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 col-md-4">
                            <div class="card">
                                <div class="card-title">Serviços Realizados</div>
                                <div class="card-value" id="servicesCount">0</div>
                                <div class="card-trend">
                                    <span class="trend-up">↑ 8% em relação ao mês passado</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 col-md-4">
                            <div class="card">
                                <div class="card-title">Clientes Cadastrados</div>
                                <div class="card-value" id="clientsCount">0</div>
                                <div class="card-trend">
                                    <span class="trend-up">↑ 5% em relação ao mês passado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row" style="margin-top: 24px;">
                        <div class="col-12 col-md-8">
                            <div class="card" style="height: 300px;">
                                <div class="card-title">Serviços Recentes</div>
                                <div class="recent-services" id="recentServices">
                                    <div class="empty-state">
                                        Nenhum serviço recente encontrado
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-12 col-md-4">
                            <div class="card" style="height: 300px;">
                                <div class="card-title">Status de OS</div>
                                <div class="os-status-chart" id="osStatusChart">
                                    <div class="empty-state">
                                        Gráfico de status
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        initialize() {
            this.loadDashboardData();
            document.getElementById('periodSelect').addEventListener('change', () => {
                this.loadDashboardData();
            });
        },
        
        async loadDashboardData() {
            try {
                // Em uma aplicação real, aqui seria uma chamada à API
                const mockData = {
                    monthlyEarnings: 'R$ 4.850,00',
                    servicesCount: '47',
                    clientsCount: '89'
                };
                
                document.getElementById('monthlyEarnings').textContent = mockData.monthlyEarnings;
                document.getElementById('servicesCount').textContent = mockData.servicesCount;
                document.getElementById('clientsCount').textContent = mockData.clientsCount;
                
            } catch (error) {
                console.error('Erro ao carregar dados do dashboard:', error);
            }
        }
    };
    
    return module;
})();