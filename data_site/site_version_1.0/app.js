// Banco de dados SQLite em memória com todos os dados da planilha
// Baseado na planilha Planilha1.html que você forneceu

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
        // Dados completos da planilha
        this.models = [
            "IPHONE 6", "IPHONE 6S", "IPHONE 6S PLUS", "IPHONE 7", "IPHONE 7 PLUS",
            "IPHONE 8", "IPHONE SE 2", "IPHONE 8 PLUS", "IPHONE X", "IPHONE XS",
            "IPHONE XS MAX", "IPHONE XR", "IPHONE 11", "IPHONE 11 PRO", "IPHONE 11 PRO MAX",
            "IPHONE 12", "IPHONE 12 PRO", "IPHONE 12 PRO MAX", "IPHONE 13",
            "IPHONE 13 PRO", "IPHONE 13 PRO MAX", "IPHONE 14", "IPHONE 14 PRO",
            "IPHONE 14 PRO MAX", "IPHONE 14 PLUS", "IPHONE 15", "IPHONE 15 PRO", "IPHONE 15 PRO MAX"
        ];
        
        this.services = [
            "TROCA DE TELA", "TROCA DE BATERIA", "VIDRO TRASEIRO", "FACE ID", "CONECTOR DE CARGA"
        ];
        
        // Preços completos baseados na planilha
        this.prices = {
            "IPHONE 6": {
                "TROCA DE TELA": { parcelado: "R$ 220,00", avista: "R$ 204,60" },
                "TROCA DE BATERIA": { parcelado: "R$ 150,00", avista: "R$ 139,50" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 150,00", avista: "R$ 139,50" }
            },
            "IPHONE 6S": {
                "TROCA DE TELA": { parcelado: "R$ 220,00", avista: "R$ 204,60" },
                "TROCA DE BATERIA": { parcelado: "R$ 150,00", avista: "R$ 139,50" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 150,00", avista: "R$ 139,50" }
            },
            "IPHONE 6S PLUS": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 180,00", avista: "R$ 167,40" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 150,00", avista: "R$ 139,50" }
            },
            "IPHONE 7": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 180,00", avista: "R$ 167,40" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 180,00", avista: "R$ 167,40" }
            },
            "IPHONE 7 PLUS": {
                "TROCA DE TELA": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
                "TROCA DE BATERIA": { parcelado: "R$ 200,00", avista: "R$ 186,00" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 180,00", avista: "R$ 167,40" }
            },
            "IPHONE 8": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 200,00", avista: "R$ 186,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 250,00", avista: "R$ 232,50" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 180,00", avista: "R$ 167,40" }
            },
            "IPHONE SE 2": {
                "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 200,00", avista: "R$ 186,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
                "FACE ID": { parcelado: "", avista: "" },
                "CONECTOR DE CARGA": { parcelado: "R$ 180,00", avista: "R$ 167,40" }
            },
            "IPHONE 8 PLUS": {
                "TROCA DE TELA": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
                "TROCA DE BATERIA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "VIDRO TRASEIRO": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "R$ 200,00", avista: "R$ 186,00" }
            },
            "IPHONE X": {
                "TROCA DE TELA": { parcelado: "R$ 480,00", avista: "R$ 446,40" },
                "TROCA DE BATERIA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "VIDRO TRASEIRO": { parcelado: "R$ 300,00", avista: "R$ 279,00" },
                "FACE ID": { parcelado: "R$ 450,00", avista: "R$ 430,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 220,00", avista: "R$ 204,60" }
            },
            "IPHONE XS": {
                "TROCA DE TELA": { parcelado: "R$ 450,00", avista: "R$ 418,50" },
                "TROCA DE BATERIA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
                "VIDRO TRASEIRO": { parcelado: "R$ 300,00", avista: "R$ 279,00" },
                "FACE ID": { parcelado: "R$ 450,00", avista: "R$ 430,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 220,00", avista: "R$ 204,60" }
            },
            "IPHONE XS MAX": {
                "TROCA DE TELA": { parcelado: "R$ 600,00", avista: "R$ 558,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 300,00", avista: "R$ 279,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "FACE ID": { parcelado: "R$ 450,00", avista: "R$ 430,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 220,00", avista: "R$ 204,60" }
            },
            "IPHONE XR": {
                "TROCA DE TELA": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "TROCA DE BATERIA": { parcelado: "R$ 250,00", avista: "R$ 232,50" },
                "VIDRO TRASEIRO": { parcelado: "R$ 300,00", avista: "R$ 279,00" },
                "FACE ID": { parcelado: "R$ 450,00", avista: "R$ 430,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 220,00", avista: "R$ 204,60" }
            },
            "IPHONE 11": {
                "TROCA DE TELA": { parcelado: "R$ 330,00", avista: "R$ 306,90" },
                "TROCA DE BATERIA": { parcelado: "R$ 250,00", avista: "R$ 232,50" },
                "VIDRO TRASEIRO": { parcelado: "R$ 350,00", avista: "R$ 325,50" },
                "FACE ID": { parcelado: "R$ 480,00", avista: "R$ 450,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 220,00", avista: "R$ 204,60" }
            },
            "IPHONE 11 PRO": {
                "TROCA DE TELA": { parcelado: "R$ 550,00", avista: "R$ 511,50" },
                "TROCA DE BATERIA": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
                "VIDRO TRASEIRO": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "FACE ID": { parcelado: "R$ 480,00", avista: "R$ 450,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 280,00", avista: "R$ 260,40" }
            },
            "IPHONE 11 PRO MAX": {
                "TROCA DE TELA": { parcelado: "R$ 600,00", avista: "R$ 558,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 300,00", avista: "R$ 279,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 400,00", avista: "R$ 372,00" },
                "FACE ID": { parcelado: "R$ 480,00", avista: "R$ 450,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 300,00", avista: "R$ 279,00" }
            },
            "IPHONE 12": {
                "TROCA DE TELA": { parcelado: "R$ 900,00", avista: "R$ 837,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 350,00", avista: "R$ 325,50" },
                "VIDRO TRASEIRO": { parcelado: "R$ 450,00", avista: "R$ 418,50" },
                "FACE ID": { parcelado: "R$ 550,00", avista: "R$ 530,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 250,00", avista: "R$ 232,50" }
            },
            "IPHONE 12 PRO": {
                "TROCA DE TELA": { parcelado: "R$ 900,00", avista: "R$ 837,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 350,00", avista: "R$ 325,50" },
                "VIDRO TRASEIRO": { parcelado: "R$ 450,00", avista: "R$ 418,50" },
                "FACE ID": { parcelado: "R$ 550,00", avista: "R$ 530,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 250,00", avista: "R$ 232,50" }
            },
            "IPHONE 12 PRO MAX": {
                "TROCA DE TELA": { parcelado: "R$ 1.100,00", avista: "R$ 1.023,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "VIDRO TRASEIRO": { parcelado: "R$ 580,00", avista: "R$ 539,40" },
                "FACE ID": { parcelado: "R$ 580,00", avista: "R$ 550,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 350,00", avista: "R$ 325,50" }
            },
            "IPHONE 13": {
                "TROCA DE TELA": { parcelado: "R$ 1.000,00", avista: "R$ 930,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 350,00", avista: "R$ 325,50" },
                "VIDRO TRASEIRO": { parcelado: "R$ 500,00", avista: "R$ 465,00" },
                "FACE ID": { parcelado: "R$ 700,00", avista: "R$ 680,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 300,00", avista: "R$ 279,00" }
            },
            "IPHONE 13 PRO": {
                "TROCA DE TELA": { parcelado: "R$ 1.200,00", avista: "R$ 1.116,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "VIDRO TRASEIRO": { parcelado: "R$ 550,00", avista: "R$ 511,50" },
                "FACE ID": { parcelado: "R$ 750,00", avista: "R$ 730,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 300,00", avista: "R$ 279,00" }
            },
            "IPHONE 13 PRO MAX": {
                "TROCA DE TELA": { parcelado: "R$ 1.400,00", avista: "R$ 1.302,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 400,00", avista: "R$ 372,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 580,00", avista: "R$ 539,40" },
                "FACE ID": { parcelado: "R$ 750,00", avista: "R$ 730,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 350,00", avista: "R$ 325,50" }
            },
            "IPHONE 14": {
                "TROCA DE TELA": { parcelado: "R$ 1.000,00", avista: "R$ 930,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 380,00", avista: "R$ 353,40" },
                "VIDRO TRASEIRO": { parcelado: "R$ 580,00", avista: "R$ 539,40" },
                "FACE ID": { parcelado: "R$ 750,00", avista: "R$ 730,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 300,00", avista: "R$ 279,00" }
            },
            "IPHONE 14 PRO": {
                "TROCA DE TELA": { parcelado: "R$ 1.200,00", avista: "R$ 1.116,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 400,00", avista: "R$ 372,00" },
                "VIDRO TRASEIRO": { parcelado: "R$ 630,00", avista: "R$ 585,90" },
                "FACE ID": { parcelado: "R$ 850,00", avista: "R$ 830,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 300,00", avista: "R$ 279,00" }
            },
            "IPHONE 14 PRO MAX": {
                "TROCA DE TELA": { parcelado: "R$ 2.200,00", avista: "R$ 2.046,00" },
                "TROCA DE BATERIA": { parcelado: "R$ 430,00", avista: "R$ 399,90" },
                "VIDRO TRASEIRO": { parcelado: "R$ 650,00", avista: "R$ 604,50" },
                "FACE ID": { parcelado: "R$ 850,00", avista: "R$ 830,00" },
                "CONECTOR DE CARGA": { parcelado: "R$ 350,00", avista: "R$ 325,50" }
            },
            "IPHONE 14 PLUS": {
                "TROCA DE TELA": { parcelado: "R$ 1.400,00", avista: "R$ 1.302,00" },
                "TROCA DE BATERIA": { parcelado: "", avista: "" },
                "VIDRO TRASEIRO": { parcelado: "", avista: "" },
                "FACE ID": { parcelado: "", avista: "" },
                "CONECTOR DE CARGA": { parcelado: "", avista: "R$ -" }
            },
            "IPHONE 15": {
                "TROCA DE TELA": { parcelado: "*", avista: "#VALOR!" },
                "TROCA DE BATERIA": { parcelado: "*", avista: "#VALOR!" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "380", avista: "R$ 353,40" }
            },
            "IPHONE 15 PRO": {
                "TROCA DE TELA": { parcelado: "*", avista: "#VALOR!" },
                "TROCA DE BATERIA": { parcelado: "*", avista: "#VALOR!" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "380", avista: "R$ 353,40" }
            },
            "IPHONE 15 PRO MAX": {
                "TROCA DE TELA": { parcelado: "*", avista: "#VALOR!" },
                "TROCA DE BATERIA": { parcelado: "*", avista: "#VALOR!" },
                "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
                "FACE ID": { parcelado: "*", avista: "*" },
                "CONECTOR DE CARGA": { parcelado: "400", avista: "R$ 372,00" }
            }
        };
        
        this.initSelects();
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
    
    searchPrices() {
        const selectedModel = this.modelSelect.value;
        const selectedService = this.serviceSelect.value;
        const paymentType = document.querySelector('input[name="payment"]:checked').value.toLowerCase();
        
        this.resultsContainer.innerHTML = '';
        this.tableContainer.style.display = 'none';
        
        let results = [];
        
        if (selectedModel && selectedService) {
            // Pesquisa específica
            const price = this.prices[selectedModel]?.[selectedService];
            if (price && price[paymentType] && 
                price[paymentType] !== "*" && 
                price[paymentType] !== "#VALOR!" && 
                price[paymentType] !== "" &&
                price[paymentType] !== "R$ -") {
                results.push({
                    model: selectedModel,
                    service: selectedService,
                    price: price[paymentType],
                    payment: paymentType
                });
            }
        } else if (selectedModel && !selectedService) {
            // Todos os serviços de um modelo
            const services = this.prices[selectedModel];
            if (services) {
                for (const [serviceName, priceData] of Object.entries(services)) {
                    if (priceData[paymentType] && 
                        priceData[paymentType] !== "*" && 
                        priceData[paymentType] !== "#VALOR!" && 
                        priceData[paymentType] !== "" &&
                        priceData[paymentType] !== "R$ -") {
                        results.push({
                            model: selectedModel,
                            service: serviceName,
                            price: priceData[paymentType],
                            payment: paymentType
                        });
                    }
                }
            }
        } else if (!selectedModel && selectedService) {
            // Um serviço em todos os modelos
            for (const [modelName, services] of Object.entries(this.prices)) {
                const priceData = services[selectedService];
                if (priceData && priceData[paymentType] && 
                    priceData[paymentType] !== "*" && 
                    priceData[paymentType] !== "#VALOR!" && 
                    priceData[paymentType] !== "" &&
                    priceData[paymentType] !== "R$ -") {
                    results.push({
                        model: modelName,
                        service: selectedService,
                        price: priceData[paymentType],
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
                const priceData = this.prices[model]?.[service] || { parcelado: "*", avista: "*" };
                
                // Preço parcelado
                const parceladoCell = document.createElement('td');
                parceladoCell.textContent = priceData.parcelado || "*";
                if (priceData.parcelado === "*" || priceData.parcelado === "#VALOR!" || priceData.parcelado === "" || priceData.parcelado === "R$ -") {
                    parceladoCell.className = 'not-available';
                }
                row.appendChild(parceladoCell);
                
                // Preço à vista
                const avistaCell = document.createElement('td');
                avistaCell.textContent = priceData.avista || "*";
                if (priceData.avista === "*" || priceData.avista === "#VALOR!" || priceData.avista === "" || priceData.avista === "R$ -") {
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