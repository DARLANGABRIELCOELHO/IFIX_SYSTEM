// components/price.js - Módulo de consulta de preços
window.PriceModule = (function() {
    const module = {
        render() {
            return `
                <div class="price-module">
                    <div class="page-header">
                        <h2>Consulta de Preços iPhone</h2>
                        <p>Valores sujeitos à modificação conforme diagnóstico</p>
                    </div>
                    
                    <div class="search-box card">
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
                        
                        <div class="row">
                            <div class="col-12">
                                <div class="form-actions">
                                    <button id="searchBtn" class="btn btn-primary">Pesquisar</button>
                                    <button id="resetBtn" class="btn btn-secondary">Limpar Filtros</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="results-container card">
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
            // Reutilizar a lógica do RepairPriceApp existente
            if (!window.priceApp) {
                window.priceApp = new RepairPriceApp();
            }
            
            // Inicializar WhatsApp se disponível
            if (typeof WhatsAppScheduler !== 'undefined') {
                WhatsAppScheduler.initialize(window.priceApp);
            }
        }
    };
    
    return module;
})();