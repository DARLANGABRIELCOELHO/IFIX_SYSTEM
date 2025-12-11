// app.js - Aplicação principal

class RepairPriceApp {
    constructor() {
        // Carregar dados do objeto phoneData (definido em data_bank.js)
        this.models = phoneData.models || [];
        this.services = phoneData.services || [];
        this.prices = phoneData.prices || {};
        
        this.initializeElements();
        this.initSelects();
        this.setupEventListeners();
        
        // Inicializar com mensagem padrão
        this.resultsContainer.innerHTML = '<p>Selecione filtros para visualizar os valores.</p>';
        this.resultsCount.textContent = '0 resultados';
    }
    
    initializeElements() {
        this.modelSelect = document.getElementById('model');
        this.serviceSelect = document.getElementById('service');
        this.searchBtn = document.getElementById('searchBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.resultsCount = document.getElementById('resultsCount');
        this.tableBody = document.getElementById('tableBody');
        this.tableContainer = document.getElementById('tableContainer');
    }
    
    searchPrices() {
        const selectedModel = this.modelSelect.value;
        const selectedService = this.serviceSelect.value;
        const paymentType = document.querySelector('input[name="payment"]:checked').value;
        
        this.resultsContainer.innerHTML = '';
        this.tableContainer.style.display = 'none';
        
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
            this.resultsContainer.innerHTML = '<p class="not-available">Nenhum preço disponível para os filtros selecionados.</p>';
            this.resultsCount.textContent = '0 resultados';
        } else {
            results.forEach(result => {
                const card = this.createResultCard(result);
                this.resultsContainer.appendChild(card);
            });
            this.resultsCount.textContent = `${results.length} resultado(s) encontrado(s)`;
        }
    }
    
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
    }
    
    showCompleteTable() {
        this.tableBody.innerHTML = '';
        this.tableContainer.style.display = 'block';
        
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
            
            this.tableBody.appendChild(row);
            count++;
        });
        
        this.resultsCount.textContent = `${count} modelos na tabela`;
        this.resultsContainer.innerHTML = '<p>Tabela completa de preços:</p>';
    }
    
    initSelects() {
        // Preencher dropdown de modelos
        this.modelSelect.innerHTML = '<option value="">Todos os modelos</option>';
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this.modelSelect.appendChild(option);
        });
        
        // Preencher dropdown de serviços
        this.serviceSelect.innerHTML = '<option value="">Todos os serviços</option>';
        this.services.forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            // Formatando o nome do serviço para exibição
            const displayName = service.toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            option.textContent = displayName;
            this.serviceSelect.appendChild(option);
        });
    }
    
    setupEventListeners() {
        this.searchBtn.addEventListener('click', () => this.searchPrices());
        this.resetBtn.addEventListener('click', () => this.resetFilters());
        
        // Permitir pesquisa com Enter
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                this.searchPrices();
            }
        });
    }
    
    resetFilters() {
        this.modelSelect.value = '';
        this.serviceSelect.value = '';
        document.getElementById('parcelado').checked = true;
        this.resultsContainer.innerHTML = '<p>Selecione filtros para visualizar os valores.</p>';
        this.resultsCount.textContent = '0 resultados';
        this.tableContainer.style.display = 'none';
    }
}

// Inicializar a aplicação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar app
    const app = new RepairPriceApp();
    window.app = app;
    
    // Inicializar módulo de WhatsApp
    if (typeof WhatsAppScheduler !== 'undefined') {
        WhatsAppScheduler.initialize(app);
    } else {
        console.error('Módulo WhatsAppScheduler não encontrado. Verifique se whatsapp-module.js foi carregado.');
    }
});
// No final do app.js, no evento DOMContentLoaded:

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar app
    const app = new RepairPriceApp();
    window.app = app;
    
    // Inicializar módulo de WhatsApp
    if (typeof WhatsAppScheduler !== 'undefined') {
        WhatsAppScheduler.initialize(app);
    } else {
        console.error('Módulo WhatsAppScheduler não encontrado. Verifique se whatsapp-module.js foi carregado.');
    }
});