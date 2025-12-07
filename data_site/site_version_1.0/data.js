// Banco de dados em memória (simples e eficiente)
const database = {
    // Dados dos modelos e preços
    models: [
        "IPHONE 6", "IPHONE 6S", "IPHONE 6S PLUS", "IPHONE 7", "IPHONE 7 PLUS",
        "IPHONE 8", "IPHONE 8 PLUS", "IPHONE X", "IPHONE XS", "IPHONE XS MAX",
        "IPHONE XR", "IPHONE 11", "IPHONE 11 PRO", "IPHONE 11 PRO MAX",
        "IPHONE 12", "IPHONE 12 PRO", "IPHONE 12 PRO MAX", "IPHONE 13",
        "IPHONE 13 PRO", "IPHONE 13 PRO MAX", "IPHONE 14", "IPHONE 14 PRO",
        "IPHONE 14 PRO MAX", "IPHONE 15", "IPHONE 15 PRO", "IPHONE 15 PRO MAX"
    ],
    
    services: [
        "TROCA DE TELA", "TROCA DE BATERIA", "VIDRO TRASEIRO", "FACE ID", "CONECTOR DE CARGA"
    ],
    
    // Tabela de preços (mesmos dados do primeiro arquivo)
    prices: {
        "IPHONE 6": {
            "TROCA DE TELA": { parcelado: "R$ 220,00", avista: "R$ 204,60" },
            "TROCA DE BATERIA": { parcelado: "R$ 150,00", avista: "R$ 139,50" },
            "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
            "FACE ID": { parcelado: "*", avista: "*" },
            "CONECTOR DE CARGA": { parcelado: "*", avista: "*" }
        },
        "IPHONE 6S": {
            "TROCA DE TELA": { parcelado: "R$ 220,00", avista: "R$ 204,60" },
            "TROCA DE BATERIA": { parcelado: "R$ 150,00", avista: "R$ 139,50" },
            "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
            "FACE ID": { parcelado: "*", avista: "*" },
            "CONECTOR DE CARGA": { parcelado: "*", avista: "*" }
        },
        "IPHONE 6S PLUS": {
            "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
            "TROCA DE BATERIA": { parcelado: "R$ 180,00", avista: "R$ 167,40" },
            "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
            "FACE ID": { parcelado: "*", avista: "*" },
            "CONECTOR DE CARGA": { parcelado: "*", avista: "*" }
        },
        // ... Continue com todos os modelos do primeiro arquivo
        "IPHONE 7": {
            "TROCA DE TELA": { parcelado: "R$ 230,00", avista: "R$ 213,90" },
            "TROCA DE BATERIA": { parcelado: "R$ 180,00", avista: "R$ 167,40" },
            "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
            "FACE ID": { parcelado: "*", avista: "*" },
            "CONECTOR DE CARGA": { parcelado: "*", avista: "*" }
        },
        "IPHONE 7 PLUS": {
            "TROCA DE TELA": { parcelado: "R$ 280,00", avista: "R$ 260,40" },
            "TROCA DE BATERIA": { parcelado: "R$ 200,00", avista: "R$ 186,00" },
            "VIDRO TRASEIRO": { parcelado: "*", avista: "#VALOR!" },
            "FACE ID": { parcelado: "*", avista: "*" },
            "CONECTOR DE CARGA": { parcelado: "*", avista: "*" }
        }
        // Adicione todos os outros modelos aqui...
    }
};

// Função para inicializar a página
function init() {
    // Preencher dropdown de modelos
    const modelSelect = document.getElementById('model');
    database.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model;
        option.textContent = model;
        modelSelect.appendChild(option);
    });
    
    // Preencher dropdown de serviços
    const serviceSelect = document.getElementById('service');
    database.services.forEach(service => {
        const option = document.createElement('option');
        option.value = service;
        option.textContent = service.charAt(0) + service.slice(1).toLowerCase();
        serviceSelect.appendChild(option);
    });
    
    // Configurar botões
    document.getElementById('searchBtn').addEventListener('click', searchPrices);
    document.getElementById('resetBtn').addEventListener('click', resetFilters);
}

// Função para pesquisar preços
function searchPrices() {
    const selectedModel = document.getElementById('model').value;
    const selectedService = document.getElementById('service').value;
    const paymentType = document.querySelector('input[name="payment"]:checked').value;
    
    const resultsContainer = document.getElementById('resultsContainer');
    const resultsCount = document.getElementById('resultsCount');
    const tableContainer = document.getElementById('tableContainer');
    
    resultsContainer.innerHTML = '';
    tableContainer.style.display = 'none';
    
    let results = [];
    
    if (selectedModel && selectedService) {
        // Pesquisa específica
        const price = database.prices[selectedModel]?.[selectedService];
        if (price && price[paymentType.toLowerCase()] !== "*" && price[paymentType.toLowerCase()] !== "#VALOR!") {
            results.push({
                model: selectedModel,
                service: selectedService,
                price: price[paymentType.toLowerCase()],
                payment: paymentType
            });
        }
    } else if (selectedModel && !selectedService) {
        // Todos os serviços de um modelo
        const services = database.prices[selectedModel];
        if (services) {
            for (const [serviceName, priceData] of Object.entries(services)) {
                if (priceData[paymentType.toLowerCase()] !== "*" && priceData[paymentType.toLowerCase()] !== "#VALOR!") {
                    results.push({
                        model: selectedModel,
                        service: serviceName,
                        price: priceData[paymentType.toLowerCase()],
                        payment: paymentType
                    });
                }
            }
        }
    } else if (!selectedModel && selectedService) {
        // Um serviço em todos os modelos
        for (const [modelName, services] of Object.entries(database.prices)) {
            const priceData = services[selectedService];
            if (priceData && priceData[paymentType.toLowerCase()] !== "*" && priceData[paymentType.toLowerCase()] !== "#VALOR!") {
                results.push({
                    model: modelName,
                    service: selectedService,
                    price: priceData[paymentType.toLowerCase()],
                    payment: paymentType
                });
            }
        }
    } else {
        // Mostrar tabela completa
        showCompleteTable();
        return;
    }
    
    // Mostrar resultados
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>Nenhum resultado encontrado.</p>';
        resultsCount.textContent = '0 resultados';
    } else {
        results.forEach(result => {
            const card = document.createElement('div');
            card.className = 'price-card';
            card.innerHTML = `
                <div class="model">${result.model}</div>
                <div class="service">${result.service}</div>
                <div class="price">${result.price} (${result.payment === 'PARCELADO' ? 'Parcelado' : 'À Vista'})</div>
            `;
            resultsContainer.appendChild(card);
        });
        resultsCount.textContent = `${results.length} resultado(s)`;
    }
}

// Função para mostrar tabela completa
function showCompleteTable() {
    const tableBody = document.getElementById('tableBody');
    const tableContainer = document.getElementById('tableContainer');
    const resultsCount = document.getElementById('resultsCount');
    
    tableBody.innerHTML = '';
    tableContainer.style.display = 'block';
    
    let count = 0;
    
    database.models.forEach(model => {
        const row = document.createElement('tr');
        
        // Célula do modelo
        const modelCell = document.createElement('td');
        modelCell.textContent = model;
        row.appendChild(modelCell);
        
        // Células de preços
        database.services.forEach(service => {
            const priceData = database.prices[model]?.[service] || { parcelado: "*", avista: "*" };
            
            // Preço parcelado
            const parceladoCell = document.createElement('td');
            parceladoCell.textContent = priceData.parcelado;
            if (priceData.parcelado === "*" || priceData.parcelado === "#VALOR!") {
                parceladoCell.style.color = '#ff3b30';
            }
            row.appendChild(parceladoCell);
            
            // Preço à vista
            const avistaCell = document.createElement('td');
            avistaCell.textContent = priceData.avista;
            if (priceData.avista === "*" || priceData.avista === "#VALOR!") {
                avistaCell.style.color = '#ff3b30';
            }
            row.appendChild(avistaCell);
        });
        
        tableBody.appendChild(row);
        count++;
    });
    
    resultsCount.textContent = `${count} modelos na tabela`;
}

// Função para resetar filtros
function resetFilters() {
    document.getElementById('model').value = '';
    document.getElementById('service').value = '';
    document.getElementById('parcelado').checked = true;
    document.getElementById('resultsContainer').innerHTML = '<p>Selecione um modelo e um serviço para ver os preços.</p>';
    document.getElementById('resultsCount').textContent = '0 resultados';
    document.getElementById('tableContainer').style.display = 'none';
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', init);