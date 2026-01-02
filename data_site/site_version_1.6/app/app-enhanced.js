// app-enhanced.js - Aplicação principal melhorada

class RepairPriceAppEnhanced {
    constructor() {
        this.models = phoneData.models || [];
        this.services = phoneData.services || [];
        this.prices = phoneData.prices || {};
        
        this.favorites = JSON.parse(localStorage.getItem('ifix_favorites')) || [];
        this.viewMode = 'cards'; // 'cards' or 'table'
        this.currentPayment = 'parcelado';
        
        this.initializeElements();
        this.initSearchableSelects();
        this.setupEventListeners();
        this.loadFavorites();
        this.initLucideIcons();
        
        // Initialize with default message
        this.showEmptyState();
    }
    
    initializeElements() {
        // Search inputs
        this.modelSearch = document.getElementById('modelSearch');
        this.serviceSearch = document.getElementById('serviceSearch');
        this.modelSelect = document.getElementById('model');
        this.serviceSelect = document.getElementById('service');
        
        // Buttons
        this.searchBtn = document.getElementById('searchBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.whatsappBtn = document.getElementById('whatsappBtn');
        this.parceladoBtn = document.getElementById('parceladoBtn');
        this.avistaBtn = document.getElementById('avistaBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.favoritesBtn = document.getElementById('favoritesBtn');
        this.toggleView = document.getElementById('toggleView');
        this.exportBtn = document.getElementById('exportBtn');
        this.refreshTips = document.getElementById('refreshTips');
        
        // Containers
        this.resultsContainer = document.getElementById('resultsContainer');
        this.tableContainer = document.getElementById('tableContainer');
        this.tableBody = document.getElementById('tableBody');
        this.resultsCount = document.getElementById('resultsCount');
        this.favoritesContainer = document.getElementById('favoritesContainer');
        this.favoritesList = document.getElementById('favoritesList');
        this.favoritesCount = document.getElementById('favoritesCount');
        this.aiTipsContainer = document.getElementById('aiTipsContainer');
        this.aiTipsContent = document.getElementById('aiTipsContent');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        
        // Suggestions
        this.modelSuggestions = document.getElementById('modelSuggestions');
        this.serviceSuggestions = document.getElementById('serviceSuggestions');
    }
    
    initLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    initSearchableSelects() {
        // Initialize model search
        this.modelSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.showModelSuggestions(searchTerm);
        });
        
        this.serviceSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            this.showServiceSuggestions(searchTerm);
        });
        
        // Fill hidden selects for backward compatibility
        this.modelSelect.innerHTML = '<option value="">Todos os modelos</option>';
        this.models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            this.modelSelect.appendChild(option);
        });
        
        this.serviceSelect.innerHTML = '<option value="">Todos os serviços</option>';
        this.services.forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = this.formatServiceName(service);
            this.serviceSelect.appendChild(option);
        });
    }
    
    showModelSuggestions(searchTerm) {
        if (!searchTerm) {
            this.modelSuggestions.classList.add('hidden');
            return;
        }
        
        const filtered = this.models.filter(model => 
            model.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        if (filtered.length === 0) {
            this.modelSuggestions.innerHTML = '<div class="text-gray-500 p-2">Nenhum modelo encontrado</div>';
        } else {
            this.modelSuggestions.innerHTML = filtered.map(model => `
                <button class="suggestion-item w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors" data-value="${model}">
                    ${model}
                </button>
            `).join('');
            
            // Add click event to suggestions
            this.modelSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.modelSearch.value = btn.dataset.value;
                    this.modelSelect.value = btn.dataset.value;
                    this.modelSuggestions.classList.add('hidden');
                    this.modelSearch.blur();
                });
            });
        }
        
        this.modelSuggestions.classList.remove('hidden');
    }
    
    showServiceSuggestions(searchTerm) {
        if (!searchTerm) {
            this.serviceSuggestions.classList.add('hidden');
            return;
        }
        
        const serviceNames = {
            "TROCA DE TELA": "Troca de Tela",
            "TROCA DE BATERIA": "Troca de Bateria", 
            "VIDRO TRASEIRO": "Vidro Traseiro",
            "FACE ID": "Reparo do Face ID",
            "CONECTOR DE CARGA": "Conector de Carga"
        };
        
        const filtered = this.services.filter(service => 
            serviceNames[service].toLowerCase().includes(searchTerm)
        ).slice(0, 5);
        
        if (filtered.length === 0) {
            this.serviceSuggestions.innerHTML = '<div class="text-gray-500 p-2">Nenhum serviço encontrado</div>';
        } else {
            this.serviceSuggestions.innerHTML = filtered.map(service => `
                <button class="suggestion-item w-full text-left p-2 hover:bg-gray-800 rounded-lg transition-colors" data-value="${service}">
                    ${serviceNames[service]}
                </button>
            `).join('');
            
            // Add click event to suggestions
            this.serviceSuggestions.querySelectorAll('.suggestion-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.serviceSearch.value = serviceNames[btn.dataset.value];
                    this.serviceSelect.value = btn.dataset.value;
                    this.serviceSuggestions.classList.add('hidden');
                    this.serviceSearch.blur();
                });
            });
        }
        
        this.serviceSuggestions.classList.remove('hidden');
    }
    
    setupEventListeners() {
        // Search button
        this.searchBtn.addEventListener('click', () => this.searchPrices());
        
        // Reset button
        this.resetBtn.addEventListener('click', () => this.resetFilters());
        
        // Payment buttons
        this.parceladoBtn.addEventListener('click', () => this.setPaymentMethod('parcelado'));
        this.avistaBtn.addEventListener('click', () => this.setPaymentMethod('avista'));
        
        // WhatsApp button
        this.whatsappBtn.addEventListener('click', () => this.openWhatsApp());
        
        // View toggle
        this.toggleView.addEventListener('click', () => this.toggleViewMode());
        
        // Export button
        this.exportBtn.addEventListener('click', () => this.exportResults());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Favorites button
        this.favoritesBtn.addEventListener('click', () => this.toggleFavorites());
        
        // Refresh AI tips
        this.refreshTips.addEventListener('click', () => this.loadAITips());
        
        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#modelSearch')) {
                this.modelSuggestions.classList.add('hidden');
            }
            if (!e.target.closest('#serviceSearch')) {
                this.serviceSuggestions.classList.add('hidden');
            }
        });
        
        // Enter key for search
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.searchPrices();
            }
        });
    }
    
    setPaymentMethod(method) {
        this.currentPayment = method;
        
        if (method === 'parcelado') {
            this.parceladoBtn.classList.add('active', 'border-orange-500');
            this.avistaBtn.classList.remove('active', 'border-orange-500');
        } else {
            this.avistaBtn.classList.add('active', 'border-orange-500');
            this.parceladoBtn.classList.remove('active', 'border-orange-500');
        }
        
        // Refresh current results if any
        if (this.modelSelect.value || this.serviceSelect.value) {
            this.searchPrices();
        }
    }
    
    async searchPrices() {
        this.showLoading(true);
        
        const selectedModel = this.modelSelect.value;
        const selectedService = this.serviceSelect.value;
        const paymentType = this.currentPayment === 'parcelado' ? 'PARCELADO' : 'A VISTA';
        const paymentKey = this.currentPayment;
        
        // Update search inputs display
        if (selectedModel) {
            this.modelSearch.value = selectedModel;
        }
        if (selectedService) {
            const serviceNames = {
                "TROCA DE TELA": "Troca de Tela",
                "TROCA DE BATERIA": "Troca de Bateria", 
                "VIDRO TRASEIRO": "Vidro Traseiro",
                "FACE ID": "Reparo do Face ID",
                "CONECTOR DE CARGA": "Conector de Carga"
            };
            this.serviceSearch.value = serviceNames[selectedService] || selectedService;
        }
        
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading
        
        let results = [];
        
        if (selectedModel && selectedService) {
            // Specific search
            const priceData = this.prices[selectedModel]?.[selectedService];
            if (priceData && priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                results.push({
                    model: selectedModel,
                    service: selectedService,
                    price: priceData[paymentKey],
                    payment: paymentType,
                    paymentKey: paymentKey,
                    priceData: priceData
                });
                
                // Load AI tips for specific combination
                this.loadAITips(selectedModel, selectedService);
            }
        } else if (selectedModel && !selectedService) {
            // All services for a model
            const modelPrices = this.prices[selectedModel];
            if (modelPrices) {
                for (const [serviceName, priceData] of Object.entries(modelPrices)) {
                    if (priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                        results.push({
                            model: selectedModel,
                            service: serviceName,
                            price: priceData[paymentKey],
                            payment: paymentType,
                            paymentKey: paymentKey,
                            priceData: priceData
                        });
                    }
                }
            }
        } else if (!selectedModel && selectedService) {
            // One service for all models
            for (const [modelName, services] of Object.entries(this.prices)) {
                const priceData = services[selectedService];
                if (priceData && priceData[paymentKey] && priceData[paymentKey] !== "N/A") {
                    results.push({
                        model: modelName,
                        service: selectedService,
                        price: priceData[paymentKey],
                        payment: paymentType,
                        paymentKey: paymentKey,
                        priceData: priceData
                    });
                }
            }
        } else {
            // Show complete table
            this.showCompleteTable();
            this.showLoading(false);
            return;
        }
        
        // Display results
        if (results.length === 0) {
            this.showEmptyState('Nenhum preço disponível para os filtros selecionados.');
        } else {
            if (this.viewMode === 'cards') {
                this.displayResultsAsCards(results);
            } else {
                this.displayResultsAsTable(results);
            }
            
            this.resultsCount.textContent = `${results.length} resultado(s) encontrado(s)`;
        }
        
        this.showLoading(false);
    }
    
    displayResultsAsCards(results) {
        this.tableContainer.classList.add('hidden');
        this.resultsContainer.classList.remove('hidden');
        this.resultsContainer.innerHTML = '';
        
        results.forEach((result, index) => {
            const isFavorite = this.favorites.some(fav => 
                fav.model === result.model && fav.service === result.service
            );
            
            const card = document.createElement('div');
            card.className = 'price-card rounded-xl p-5 fade-in';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const serviceNames = {
                "TROCA DE TELA": "Troca de Tela",
                "TROCA DE BATERIA": "Troca de Bateria", 
                "VIDRO TRASEIRO": "Vidro Traseiro",
                "FACE ID": "Reparo do Face ID",
                "CONECTOR DE CARGA": "Conector de Carga"
            };
            
            const otherPriceKey = result.paymentKey === 'parcelado' ? 'avista' : 'parcelado';
            const otherPrice = result.priceData[otherPriceKey];
            
            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <div class="font-bold text-lg mb-1">${result.model}</div>
                        <div class="text-sm text-gray-400">${serviceNames[result.service] || result.service}</div>
                    </div>
                    <button class="favorite-btn p-2 hover:bg-gray-800 rounded-lg transition-colors" data-model="${result.model}" data-service="${result.service}">
                        <i data-lucide="${isFavorite ? 'star' : 'star'}" class="w-5 h-5 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="text-2xl font-bold text-orange-500">${result.price}</div>
                    <div class="text-sm text-gray-400 mt-1">${result.payment}</div>
                    ${otherPrice !== "N/A" ? `
                        <div class="text-sm text-gray-500 mt-1">
                            ${otherPriceKey === 'parcelado' ? 'Parcelado' : 'À vista'}: ${otherPrice}
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-2">
                    <button class="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors whatsapp-specific-btn" data-model="${result.model}" data-service="${result.service}">
                        Agendar
                    </button>
                    <button class="px-3 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium transition-colors compare-btn" data-model="${result.model}">
                        Comparar
                    </button>
                </div>
            `;
            
            this.resultsContainer.appendChild(card);
        });
        
        // Add event listeners to new buttons
        this.addCardEventListeners();
        this.initLucideIcons();
    }
    
    addCardEventListeners() {
        // Favorite buttons
        this.resultsContainer.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const model = btn.dataset.model;
                const service = btn.dataset.service;
                this.toggleFavorite(model, service);
            });
        });
        
        // WhatsApp buttons
        this.resultsContainer.querySelectorAll('.whatsapp-specific-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const model = btn.dataset.model;
                const service = btn.dataset.service;
                this.openWhatsAppSpecific(model, service);
            });
        });
        
        // Compare buttons
        this.resultsContainer.querySelectorAll('.compare-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const model = btn.dataset.model;
                this.showComparison(model);
            });
        });
    }
    
    toggleFavorite(model, service) {
        const index = this.favorites.findIndex(fav => 
            fav.model === model && fav.service === service
        );
        
        if (index === -1) {
            this.favorites.push({ model, service });
        } else {
            this.favorites.splice(index, 1);
        }
        
        // Save to localStorage
        localStorage.setItem('ifix_favorites', JSON.stringify(this.favorites));
        
        // Update UI
        this.loadFavorites();
        this.searchPrices(); // Refresh to update favorite stars
    }
    
    loadFavorites() {
        const count = this.favorites.length;
        this.favoritesCount.textContent = count;
        
        if (count > 0) {
            this.favoritesCount.classList.remove('hidden');
        } else {
            this.favoritesCount.classList.add('hidden');
        }
        
        // Update favorites list
        if (this.favoritesContainer.classList.contains('hidden')) return;
        
        this.favoritesList.innerHTML = '';
        
        if (count === 0) {
            this.favoritesList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="star" class="w-12 h-12 mx-auto mb-4"></i>
                    <p>Nenhum favorito adicionado</p>
                </div>
            `;
            return;
        }
        
        this.favorites.forEach(fav => {
            const priceData = this.prices[fav.model]?.[fav.service];
            if (!priceData) return;
            
            const div = document.createElement('div');
            div.className = 'flex items-center justify-between p-3 bg-gray-800/50 rounded-lg';
            div.innerHTML = `
                <div>
                    <div class="font-medium">${fav.model}</div>
                    <div class="text-sm text-gray-400">${this.formatServiceName(fav.service)}</div>
                </div>
                <div class="flex items-center gap-3">
                    <div class="text-right">
                        <div class="font-bold text-orange-500">${priceData.parcelado}</div>
                        <div class="text-xs text-gray-400">Parcelado</div>
                    </div>
                    <button class="remove-favorite p-2 hover:bg-gray-700 rounded-lg" data-model="${fav.model}" data-service="${fav.service}">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            this.favoritesList.appendChild(div);
        });
        
        // Add event listeners to remove buttons
        this.favoritesList.querySelectorAll('.remove-favorite').forEach(btn => {
            btn.addEventListener('click', () => {
                const model = btn.dataset.model;
                const service = btn.dataset.service;
                this.toggleFavorite(model, service);
            });
        });
        
        this.initLucideIcons();
    }
    
    toggleFavorites() {
        const isHidden = this.favoritesContainer.classList.contains('hidden');
        
        if (isHidden) {
            this.loadFavorites();
            this.favoritesContainer.classList.remove('hidden');
        } else {
            this.favoritesContainer.classList.add('hidden');
        }
    }
    
    showCompleteTable() {
        this.tableContainer.classList.remove('hidden');
        this.resultsContainer.classList.add('hidden');
        this.tableBody.innerHTML = '';
        
        // Generate table headers
        const thead = this.tableContainer.querySelector('thead tr');
        thead.innerHTML = '<th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-800 sortable" data-sort="model">Modelo</th>';
        
        this.services.forEach(service => {
            const serviceName = this.formatServiceName(service);
            thead.innerHTML += `
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    ${serviceName}
                    <div class="text-xs font-normal text-gray-400 mt-1">Parcelado / À Vista</div>
                </th>
            `;
        });
        
        // Add sort functionality
        thead.querySelector('.sortable').addEventListener('click', () => {
            this.sortTable();
        });
        
        // Generate table rows
        this.models.forEach(model => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-900/50 transition-colors';
            
            // Model cell
            const modelCell = document.createElement('td');
            modelCell.className = 'px-6 py-4 whitespace-nowrap font-medium';
            modelCell.textContent = model;
            row.appendChild(modelCell);
            
            // Service cells
            this.services.forEach(service => {
                const priceData = this.prices[model]?.[service] || { parcelado: "N/A", avista: "N/A" };
                
                const cell = document.createElement('td');
                cell.className = 'px-6 py-4';
                cell.innerHTML = `
                    <div class="space-y-1">
                        <div class="${priceData.parcelado === "N/A" ? 'text-gray-500' : 'text-white'}">
                            ${priceData.parcelado}
                        </div>
                        <div class="text-sm ${priceData.avista === "N/A" ? 'text-gray-500' : 'text-gray-400'}">
                            ${priceData.avista}
                        </div>
                    </div>
                `;
                row.appendChild(cell);
            });
            
            this.tableBody.appendChild(row);
        });
        
        this.resultsCount.textContent = `${this.models.length} modelos na tabela`;
    }
    
    sortTable() {
        const rows = Array.from(this.tableBody.querySelectorAll('tr'));
        const currentSort = this.tableBody.dataset.sort || 'asc';
        const newSort = currentSort === 'asc' ? 'desc' : 'asc';
        
        rows.sort((a, b) => {
            const modelA = a.cells[0].textContent;
            const modelB = b.cells[0].textContent;
            
            if (newSort === 'asc') {
                return modelA.localeCompare(modelB);
            } else {
                return modelB.localeCompare(modelA);
            }
        });
        
        // Clear and re-add rows
        this.tableBody.innerHTML = '';
        rows.forEach(row => this.tableBody.appendChild(row));
        
        // Update sort indicator
        this.tableBody.dataset.sort = newSort;
        const sortHeader = this.tableContainer.querySelector('.sortable');
        sortHeader.innerHTML = `Modelo <i data-lucide="${newSort === 'asc' ? 'arrow-up' : 'arrow-down'}" class="w-4 h-4 inline ml-1"></i>`;
        this.initLucideIcons();
    }
    
    async loadAITips(model = null, service = null) {
        if (!model || !service) {
            this.aiTipsContainer.classList.add('hidden');
            return;
        }
        
        try {
            this.aiTipsContainer.classList.remove('hidden');
            this.aiTipsContent.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
            `;
            
            // Use the AI service
            const tips = await AIService.getMaintenanceTips(model, service);
            
            this.aiTipsContent.innerHTML = `
                <div class="space-y-4">
                    ${tips.map((tip, index) => `
                        <div class="bg-gray-800/50 rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <div class="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span class="text-lg">${['🔧', '💡', '⚡'][index] || '✨'}</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-gray-100">${tip}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Erro ao carregar dicas de IA:', error);
            this.aiTipsContent.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="wifi-off" class="w-12 h-12 mx-auto mb-4"></i>
                    <p>Não foi possível carregar as dicas de IA</p>
                    <p class="text-sm mt-2">Verifique sua conexão e tente novamente</p>
                </div>
            `;
        }
        
        this.initLucideIcons();
    }
    
    openWhatsApp() {
        const model = this.modelSelect.value || "Não especificado";
        const service = this.serviceSelect.value || "Não especificado";
        this.openWhatsAppSpecific(model, service);
    }
    
    openWhatsAppSpecific(model, service) {
        const paymentType = this.currentPayment === 'parcelado' ? 'PARCELADO' : 'A VISTA';
        const priceData = this.prices[model]?.[service];
        const price = priceData ? priceData[this.currentPayment] : "A consultar";
        
        const message = `Olá! Gostaria de agendar um diagnóstico para meu iPhone na IFIX.

INFORMAÇÕES:
• Modelo: ${model}
• Serviço desejado: ${this.formatServiceName(service)}
• Forma de pagamento: ${paymentType}
• Valor sugerido no site: ${price}

Observações:
• O valor final será confirmado após diagnóstico técnico.
• O orçamento online é apenas uma estimativa prévia.`;

        const numero = "5515991630531";
        const whatsappUrl = `https://wa.me/${numero}?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
    }
    
    toggleViewMode() {
        this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
        
        const icon = this.toggleView.querySelector('i');
        if (this.viewMode === 'cards') {
            icon.setAttribute('data-lucide', 'layout-grid');
            if (this.modelSelect.value || this.serviceSelect.value) {
                this.searchPrices();
            }
        } else {
            icon.setAttribute('data-lucide', 'table');
            this.showCompleteTable();
        }
        
        this.initLucideIcons();
    }
    
    exportResults() {
        let content = "Modelo,Serviço,Parcelado,À Vista\n";
        
        if (this.viewMode === 'table') {
            this.models.forEach(model => {
                this.services.forEach(service => {
                    const priceData = this.prices[model]?.[service] || { parcelado: "N/A", avista: "N/A" };
                    content += `"${model}","${this.formatServiceName(service)}","${priceData.parcelado}","${priceData.avista}"\n`;
                });
            });
        } else {
            const cards = this.resultsContainer.querySelectorAll('.price-card');
            if (cards.length > 0) {
                cards.forEach(card => {
                    const model = card.querySelector('.font-bold').textContent;
                    const service = card.querySelector('.text-sm').textContent;
                    const price = card.querySelector('.text-orange-500').textContent;
                    content += `"${model}","${service}","${price}"\n`;
                });
            }
        }
        
        const blob = new Blob([content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ifix-precos-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        const icon = this.themeToggle.querySelector('i');
        
        if (isDark) {
            html.classList.remove('dark');
            html.classList.add('light');
            icon.setAttribute('data-lucide', 'sun');
        } else {
            html.classList.remove('light');
            html.classList.add('dark');
            icon.setAttribute('data-lucide', 'moon');
        }
        
        this.initLucideIcons();
    }
    
    showComparison(model) {
        const modelPrices = this.prices[model];
        if (!modelPrices) return;
        
        let comparisonHTML = `
            <div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
                <div class="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                    <div class="flex items-center justify-between p-6 border-b border-gray-800">
                        <h3 class="text-xl font-bold">Comparação de Preços: ${model}</h3>
                        <button id="closeComparison" class="p-2 hover:bg-gray-800 rounded-lg">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="p-6 overflow-y-auto max-h-[60vh]">
                        <div class="space-y-4">
        `;
        
        this.services.forEach(service => {
            const priceData = modelPrices[service];
            if (!priceData) return;
            
            comparisonHTML += `
                <div class="bg-gray-800/50 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-medium">${this.formatServiceName(service)}</div>
                        <button class="p-2 hover:bg-gray-700 rounded-lg whatsapp-specific-btn" data-model="${model}" data-service="${service}">
                            <i data-lucide="message-circle" class="w-4 h-4 text-green-500"></i>
                        </button>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div class="text-center p-3 bg-gray-900/50 rounded-lg">
                            <div class="text-lg font-bold text-orange-500">${priceData.parcelado}</div>
                            <div class="text-sm text-gray-400">Parcelado</div>
                        </div>
                        <div class="text-center p-3 bg-gray-900/50 rounded-lg">
                            <div class="text-lg font-bold text-green-500">${priceData.avista}</div>
                            <div class="text-sm text-gray-400">À Vista</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        comparisonHTML += `
                        </div>
                    </div>
                    <div class="p-6 border-t border-gray-800">
                        <button class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-orange-600 hover:to-red-600 transition-all" onclick="window.app.openWhatsAppSpecific('${model}', '${this.services[0]}')">
                            Agendar Todos os Serviços
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const comparisonDiv = document.createElement('div');
        comparisonDiv.innerHTML = comparisonHTML;
        document.body.appendChild(comparisonDiv);
        
        // Add event listeners
        comparisonDiv.querySelector('#closeComparison').addEventListener('click', () => {
            document.body.removeChild(comparisonDiv);
        });
        
        comparisonDiv.querySelectorAll('.whatsapp-specific-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const model = btn.dataset.model;
                const service = btn.dataset.service;
                this.openWhatsAppSpecific(model, service);
            });
        });
        
        this.initLucideIcons();
    }
    
    resetFilters() {
        this.modelSearch.value = '';
        this.serviceSearch.value = '';
        this.modelSelect.value = '';
        this.serviceSelect.value = '';
        this.modelSuggestions.classList.add('hidden');
        this.serviceSuggestions.classList.add('hidden');
        this.setPaymentMethod('parcelado');
        
        this.showEmptyState();
        this.aiTipsContainer.classList.add('hidden');
        this.tableContainer.classList.add('hidden');
        this.resultsContainer.classList.remove('hidden');
    }
    
    showEmptyState(message = 'Selecione um modelo e serviço para visualizar os preços') {
        this.resultsContainer.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <i data-lucide="search" class="w-12 h-12 mx-auto mb-4"></i>
                <p>${message}</p>
            </div>
        `;
        this.resultsCount.textContent = '0 resultados encontrados';
        this.initLucideIcons();
    }
    
    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }
    
    formatServiceName(service) {
        const serviceNames = {
            "TROCA DE TELA": "Troca de Tela",
            "TROCA DE BATERIA": "Troca de Bateria", 
            "VIDRO TRASEIRO": "Vidro Traseiro",
            "FACE ID": "Reparo do Face ID",
            "CONECTOR DE CARGA": "Conector de Carga"
        };
        return serviceNames[service] || service;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    const app = new RepairPriceAppEnhanced();
    window.app = app;
    
    // Initialize WhatsApp module if available
    if (typeof WhatsAppScheduler !== 'undefined') {
        WhatsAppScheduler.initialize(app);
    }
    
    // Initialize AI service
    if (typeof AIService !== 'undefined') {
        console.log('AI Service carregado');
    }
});