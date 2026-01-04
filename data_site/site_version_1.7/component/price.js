// components/price.js - Módulo de consulta de preços atualizado
window.PriceModule = (function() {
    const module = {
        render() {
            return `
                <div class="price-module">
                    <div class="module-header">
                        <h2>Consulta de Preços</h2>
                        <p class="module-subtitle">Valores sujeitos à modificação conforme diagnóstico</p>
                    </div>
                    
                    <div class="card">
                        <div class="search-container">
                            <div class="row">
                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Modelo do iPhone</label>
                                        <select id="model" class="form-control">
                                            <option value="">Todos os modelos</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Tipo de Serviço</label>
                                        <select id="service" class="form-control">
                                            <option value="">Todos os serviços</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-12 col-md-4">
                                    <div class="form-group">
                                        <label class="form-label">Forma de Pagamento</label>
                                        <div class="payment-options">
                                            <label class="radio-option">
                                                <input type="radio" name="payment" value="PARCELADO" checked>
                                                <span>Parcelado</span>
                                            </label>
                                            <label class="radio-option">
                                                <input type="radio" name="payment" value="A VISTA">
                                                <span>À Vista</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="search-actions">
                                <button id="searchBtn" class="btn btn-primary">🔍 Pesquisar</button>
                                <button id="resetBtn" class="btn btn-secondary">🔄 Limpar</button>
                                <div class="whatsapp-btn-container" id="whatsappBtnContainer"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="card">
                        <div class="results-header">
                            <h3>Resultados</h3>
                            <div id="resultsCount" class="results-count">0 resultados</div>
                        </div>
                        <div id="resultsContainer" class="results-content">
                            <p>Selecione filtros para visualizar os valores.</p>
                        </div>
                        
                        <div id="tableContainer" style="display: none;">
                            <div class="table-container">
                                <table id="priceTable">
                                    <thead>
                                        <tr>
                                            <th>Modelo</th>
                                            <th>Tela (Parcelado)</th>
                                            <th>Tela (À Vista)</th>
                                            <th>Bateria (Parcelado)</th>
                                            <th>Bateria (À Vista)</th>
                                            <th>Vidro Traseiro (Parcelado)</th>
                                            <th>Vidro Traseiro (À Vista)</th>
                                            <th>Face ID (Parcelado)</th>
                                            <th>Face ID (À Vista)</th>
                                            <th>Conector (Parcelado)</th>
                                            <th>Conector (À Vista)</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tableBody"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        },
        
        initialize() {
            // Carregar dados dos preços
            this.models = window.phoneData.models || [];
            this.services = window.phoneData.services || [];
            this.prices = window.phoneData.prices || {};
            
            this.initSelects();
            this.setupEventListeners();
            
            // Inicializar com mensagem padrão
            document.getElementById('resultsContainer').innerHTML = '<p>Selecione filtros para visualizar os valores.</p>';
            document.getElementById('resultsCount').textContent = '0 resultados';
            
            // Inicializar WhatsApp se disponível
            if (typeof WhatsAppScheduler !== 'undefined') {
                WhatsAppScheduler.initialize(this);
            }
        },
        
        // Métodos do RepairPriceApp adaptados
        initSelects() {
            const modelSelect = document.getElementById('model');
            const serviceSelect = document.getElementById('service');
            
            // Preencher dropdown de modelos
            modelSelect.innerHTML = '<option value="">Todos os modelos</option>';
            this.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                modelSelect.appendChild(option);
            });
            
            // Preencher dropdown de serviços
            serviceSelect.innerHTML = '<option value="">Todos os serviços</option>';
            this.services.forEach(service => {
                const option = document.createElement('option');
                option.value = service;
                const displayName = service.toLowerCase()
                    .split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                option.textContent = displayName;
                serviceSelect.appendChild(option);
            });
        },
        
        setupEventListeners() {
            document.getElementById('searchBtn').addEventListener('click', () => this.searchPrices());
            document.getElementById('resetBtn').addEventListener('click', () => this.resetFilters());
            
            // Permitir pesquisa com Enter
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    this.searchPrices();
                }
            });
        },
        
        searchPrices() {
            const selectedModel = document.getElementById('model').value;
            const selectedService = document.getElementById('service').value;
            const paymentType = document.querySelector('input[name="payment"]:checked').value;
            const resultsContainer = document.getElementById('resultsContainer');
            const tableContainer = document.getElementById('tableContainer');
            const resultsCount = document.getElementById('resultsCount');
            
            resultsContainer.innerHTML = '';
            tableContainer.style.display = 'none';
            
            let results = [];
            
            // Converter para formato do objeto
            const paymentKey = paymentType === 'A VISTA' ? 'avista' : 'parcelado';
            
            if (selectedModel && selectedService) {
                // Pesquisa específica: modelo e serviço
                const priceData = this.prices[selectedModel]?.[selectedService];
                if (priceData && priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                    results.push({
                        model: selectedModel,
                        service: selectedService,
                        price: priceData[paymentKey],
                        payment: paymentType
                    });
                }
            } else if (selectedModel && !selectedService) {
                // Todos os serviços de um modelo
                const modelPrices = this.prices[selectedModel];
                if (modelPrices) {
                    for (const [serviceName, priceData] of Object.entries(modelPrices)) {
                        if (priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                            results.push({
                                model: selectedModel,
                                service: serviceName,
                                price: priceData[paymentKey],
                                payment: paymentType
                            });
                        }
                    }
                }
            } else if (!selectedModel && selectedService) {
                // Um serviço em todos os modelos
                for (const [modelName, services] of Object.entries(this.prices)) {
                    const priceData = services[selectedService];
                    if (priceData && priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                        results.push({
                            model: modelName,
                            service: selectedService,
                            price: priceData[paymentKey],
                            payment: paymentType
                        });
                    }
                }
            } else {
                // Mostrar tabela completa
                this.showCompleteTable();
                return;
            }
            
            // Mostrar resultados
            if (results.length === 0) {
                resultsContainer.innerHTML = '<p class="not-available">Nenhum preço disponível para os filtros selecionados.</p>';
                resultsCount.textContent = '0 resultados';
            } else {
                results.forEach(result => {
                    const card = this.createResultCard(result);
                    resultsContainer.appendChild(card);
                });
                resultsCount.textContent = `${results.length} resultado(s) encontrado(s)`;
            }
        },
        
        createResultCard(result) {
            const card = document.createElement('div');
            card.className = 'price-card';
            
            const serviceNames = {
                "TROCA DE TELA": "Troca de Tela",
                "TROCA DE BATERIA": "Troca de Bateria", 
                "VIDRO TRASEIRO": "Vidro Traseiro",
                "FACE ID": "Face ID",
                "CONECTOR DE CARGA": "Conector de Carga"
            };
            
            card.innerHTML = `
                <div class="model">${result.model}</div>
                <div class="service">${serviceNames[result.service] || result.service}</div>
                <div class="price">${result.price} (${result.payment})</div>
            `;
            
            return card;
        },
        
        showCompleteTable() {
            const tableBody = document.getElementById('tableBody');
            const tableContainer = document.getElementById('tableContainer');
            const resultsCount = document.getElementById('resultsCount');
            const resultsContainer = document.getElementById('resultsContainer');
            
            tableBody.innerHTML = '';
            tableContainer.style.display = 'block';
            
            let count = 0;
            
            this.models.forEach(model => {
                const row = document.createElement('tr');
                
                // Célula do modelo
                const modelCell = document.createElement('td');
                modelCell.textContent = model;
                modelCell.style.fontWeight = 'bold';
                row.appendChild(modelCell);
                
                // Células de preços para cada serviço
                this.services.forEach(service => {
                    const priceData = this.prices[model]?.[service] || { parcelado: "N/A", avista: "N/A" };
                    
                    // Preço parcelado
                    const parceladoCell = document.createElement('td');
                    parceladoCell.textContent = priceData.parcelado;
                    if (priceData.parcelado === "N/A") {
                        parceladoCell.className = 'not-available';
                    }
                    row.appendChild(parceladoCell);
                    
                    // Preço à vista
                    const avistaCell = document.createElement('td');
                    avistaCell.textContent = priceData.avista;
                    if (priceData.avista === "N/A") {
                        avistaCell.className = 'not-available';
                    }
                    row.appendChild(avistaCell);
                });
                
                tableBody.appendChild(row);
                count++;
            });
            
            resultsCount.textContent = `${count} modelos na tabela`;
            resultsContainer.innerHTML = '<p>Tabela completa de preços:</p>';
        },
        
        resetFilters() {
            document.getElementById('model').value = '';
            document.getElementById('service').value = '';
            document.getElementById('parcelado').checked = true;
            document.getElementById('resultsContainer').innerHTML = '<p>Selecione filtros para visualizar os valores.</p>';
            document.getElementById('resultsCount').textContent = '0 resultados';
            document.getElementById('tableContainer').style.display = 'none';
        },
        
        // Métodos para integração com WhatsApp
        getModelSelect() {
            return document.getElementById('model');
        },
        
        getServiceSelect() {
            return document.getElementById('service');
        }
    };
    
    return module;
})();