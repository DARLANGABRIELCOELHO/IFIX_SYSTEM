// Banco de dados SQLite em memória com todos os dados da planilha
// Dados importados do data_bank.js

class RepairPriceApp {
    constructor() {
        this.models = [];
        this.services = [];
        this.prices = {};
        
        this.initializeElements();
        this.loadDatabase();
        this.setupEventListeners();
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
    
    loadDatabase() {
        // Importar dados do data_bank.js
        if (typeof window.phoneData !== 'undefined') {
            this.models = window.phoneData.models;
            this.services = window.phoneData.services;
            this.prices = window.phoneData.prices;
            this.initSelects();
        } else {
            console.error("Dados não carregados. Verifique se data_bank.js foi incluído antes de app.js");
            // Fallback para dados mínimos caso o data_bank.js não esteja disponível
            this.loadFallbackData();
        }
    }
    
    loadFallbackData() {
        // Dados mínimos de fallback
        this.models = ["IPHONE 6", "IPHONE 7", "IPHONE 8"];
        this.services = ["TROCA DE TELA", "TROCA DE BATERIA"];
        this.prices = {
            "IPHONE 6": {
                "TROCA DE TELA": { parcelado: "R$ 220,00", avista: "R$ 204,60" },
                "TROCA DE BATERIA": { parcelado: "R$ 150,00", avista: "R$ 139,50" }
            },
            "IPHONE 7": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 180,00", avista: "R$ 167,40" }
            },
            "IPHONE 8": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 200,00", avista: "R$ 186,00" }
            }
        };
        this.initSelects();
    }
    
    // CORRIGIR a função searchPrices para lidar com valores N/A
    searchPrices() {
        const selectedModel = this.modelSelect.value;
        const selectedService = this.serviceSelect.value;
        const paymentType = document.querySelector('input[name="payment"]:checked').value.toLowerCase();
        
        this.resultsContainer.innerHTML = '';
        this.tableContainer.style.display = 'none';
        
        let results = [];
        
        // Padronizar o tipo de pagamento para usar no objeto
        const paymentKey = paymentType === 'a vista' ? 'avista' : 'parcelado';
        
        if (selectedModel && selectedService) {
            // Pesquisa específica
            const price = this.prices[selectedModel]?.[selectedService];
            if (price && price[paymentKey] && price[paymentKey] !== "N/A") {
                results.push({
                    model: selectedModel,
                    service: selectedService,
                    price: price[paymentKey],
                    payment: paymentType
                });
            }
        } else if (selectedModel && !selectedService) {
            // Todos os serviços de um modelo
            const services = this.prices[selectedModel];
            if (services) {
                for (const [serviceName, priceData] of Object.entries(services)) {
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
    
    // CORRIGIR a função createResultCard
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
        
        const paymentNames = {
            "parcelado": "Parcelado",
            "a vista": "À Vista"
        };
        
        card.innerHTML = `
            <div class="model">${result.model}</div>
            <div class="service">${serviceNames[result.service] || result.service}</div>
            <div class="price">${result.price} (${paymentNames[result.payment]})</div>
        `;
        
        return card;
    }
    
    // CORRIGIR a função showCompleteTable
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
            
            // Células de preços
            this.services.forEach(service => {
                const priceData = this.prices[model]?.[service] || { parcelado: "N/A", avista: "N/A" };
                
                // Preço parcelado
                const parceladoCell = document.createElement('td');
                parceladoCell.textContent = priceData.parcelado || "N/A";
                if (priceData.parcelado === "N/A") {
                    parceladoCell.className = 'not-available';
                }
                row.appendChild(parceladoCell);
                
                // Preço à vista
                const avistaCell = document.createElement('td');
                avistaCell.textContent = priceData.avista || "N/A";
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
            const displayName = service.split(' ').map(word => 
                word.charAt(0) + word.slice(1).toLowerCase()
            ).join(' ');
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
    const app = new RepairPriceApp();
    window.app = app; // Para acesso global se necessário
});

// Adicionar este código no app.js para criar botão no HTML
function createScheduleButton() {
    const scheduleBtn = document.createElement('button');
    scheduleBtn.className = 'schedule-btn';
    scheduleBtn.innerHTML = '📅 Agendar Diagnóstico';
    scheduleBtn.style.cssText = `
        background: #15bb39ff;
        color: white;
        padding: 12px 20px;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
        font-size: 15px;
        margin-top: 15px;
        display: block;
        margin: 20px auto;
    `;
    
    scheduleBtn.onclick = function() {
        const message = `Olá! Gostaria de agendar um diagnóstico para meu iPhone na IFIX.
        
Modelo: [Seu Modelo]
Problema: [Descreva o problema]
Preferência de Data: [Data desejada]
Horário: [Manhã/Tarde/Noite]
Telefone: [Seu telefone]`;
        
        // Copiar para área de transferência
        navigator.clipboard.writeText(message);
        alert('Mensagem copiada! Cole no WhatsApp para agendar.');
        
        // Abrir WhatsApp (opcional)
        window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank');
    };
    
    document.querySelector('.search-box').appendChild(scheduleBtn);
}

// Chamar a função quando a página carregar
document.addEventListener('DOMContentLoaded', createScheduleButton);