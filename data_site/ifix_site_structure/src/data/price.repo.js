// src/data/price.repo.js
// Repositório de Preços e Serviços
// Responsabilidade: Catálogo + precificação dinâmica + histórico + importação

import Storage from "./storage.js";

// Constantes
const COLLECTION_NAME = "prices";
const CURRENCY = "BRL";

// Estruturas de dados
export const PRICE_TYPES = {
  FIXED: "fixed",           // Preço fixo
  RANGE: "range",           // Faixa de preço
  CALCULATED: "calculated", // Calculado baseado em parâmetros
  CUSTOM: "custom"          // Preço personalizado
};

export const CATEGORIES = {
  REPAIR: "repair",
  MAINTENANCE: "maintenance",
  PART: "part",
  ACCESSORY: "accessory",
  SOFTWARE: "software",
  CONSULTATION: "consultation",
  OTHER: "other"
};

export const UNITS = {
  UNIT: "unit",
  HOUR: "hour",
  DAY: "day",
  METER: "meter",
  KIT: "kit",
  SERVICE: "service"
};

// Classes para modelagem
class PriceModel {
  constructor(data = {}) {
    this.id = data.id || Storage.createId("price");
    this.sku = data.sku || this.generateSKU();
    this.name = data.name || "";
    this.description = data.description || "";
    this.category = data.category || CATEGORIES.OTHER;
    this.type = data.type || PRICE_TYPES.FIXED;
    this.unit = data.unit || UNITS.UNIT;
    
    // Preços
    this.basePrice = Math.max(0, Number(data.basePrice) || 0);
    this.costPrice = Math.max(0, Number(data.costPrice) || 0);
    this.salePrice = Math.max(0, Number(data.salePrice) || data.basePrice || 0);
    this.minPrice = Math.max(0, Number(data.minPrice) || 0);
    this.maxPrice = Math.max(0, Number(data.maxPrice) || 0);
    
    // Margens
    this.profitMargin = Math.max(0, Number(data.profitMargin) || 0);
    this.discountAllowed = Math.max(0, Math.min(100, Number(data.discountAllowed) || 0));
    
    // Atributos do produto/serviço
    this.brand = data.brand || "";
    this.model = data.model || "";
    this.compatibility = data.compatibility || []; // Modelos compatíveis
    this.specifications = data.specifications || {};
    
    // Status e disponibilidade
    this.active = data.active !== false;
    this.available = data.available !== false;
    this.stock = Math.max(0, Number(data.stock) || 0);
    this.lowStockThreshold = Math.max(0, Number(data.lowStockThreshold) || 5);
    
    // Tempos (para serviços)
    this.estimatedTime = Math.max(0, Number(data.estimatedTime) || 0); // em minutos
    this.warrantyDays = Math.max(0, Number(data.warrantyDays) || 0);
    
    // Metadados
    this.tags = Array.isArray(data.tags) ? data.tags : [];
    this.notes = data.notes || "";
    this.attachments = data.attachments || [];
    
    // Histórico de preços
    this.priceHistory = data.priceHistory || [];
    
    // Relacionamentos
    this.supplierId = data.supplierId || null;
    this.supplierName = data.supplierName || "";
    this.supplierCode = data.supplierCode || "";
    
    // Rastreamento
    this.createdAt = data.createdAt || Storage.nowISO();
    this.updatedAt = data.updatedAt || Storage.nowISO();
    this.lastPurchaseAt = data.lastPurchaseAt || null;
    this.lastSaleAt = data.lastSaleAt || null;
  }

  generateSKU() {
    const prefix = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).substring(2, 6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  get margin() {
    if (this.costPrice === 0) return 100;
    return ((this.salePrice - this.costPrice) / this.costPrice) * 100;
  }

  get profit() {
    return this.salePrice - this.costPrice;
  }

  get stockStatus() {
    if (this.stock === 0) return "out_of_stock";
    if (this.stock <= this.lowStockThreshold) return "low_stock";
    return "in_stock";
  }

  get isLowStock() {
    return this.stockStatus === "low_stock";
  }

  get isOutOfStock() {
    return this.stockStatus === "out_of_stock";
  }

  calculatePrice(options = {}) {
    const { quantity = 1, applyDiscount = true, discountPercent = 0 } = options;
    
    let price = this.salePrice;
    
    // Aplicar descontos se permitido
    if (applyDiscount && this.discountAllowed > 0) {
      const maxDiscount = Math.min(discountPercent, this.discountAllowed);
      price = price * (1 - maxDiscount / 100);
    }
    
    // Garantir preço mínimo
    if (this.minPrice > 0 && price < this.minPrice) {
      price = this.minPrice;
    }
    
    // Garantir preço máximo
    if (this.maxPrice > 0 && price > this.maxPrice) {
      price = this.maxPrice;
    }
    
    return price * quantity;
  }

  updatePrice(newPrice, reason = "price_adjustment", userId = "system") {
    const oldPrice = this.salePrice;
    this.salePrice = Math.max(0, Number(newPrice));
    
    // Registrar no histórico
    this.priceHistory.push({
      oldPrice,
      newPrice: this.salePrice,
      reason,
      userId,
      timestamp: Storage.nowISO()
    });
    
    this.updatedAt = Storage.nowISO();
    
    return {
      oldPrice,
      newPrice: this.salePrice,
      change: ((this.salePrice - oldPrice) / oldPrice) * 100
    };
  }

  toJSON() {
    return {
      id: this.id,
      sku: this.sku,
      name: this.name,
      description: this.description,
      category: this.category,
      type: this.type,
      unit: this.unit,
      basePrice: this.basePrice,
      costPrice: this.costPrice,
      salePrice: this.salePrice,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      profitMargin: this.profitMargin,
      discountAllowed: this.discountAllowed,
      brand: this.brand,
      model: this.model,
      compatibility: this.compatibility,
      specifications: this.specifications,
      active: this.active,
      available: this.available,
      stock: this.stock,
      lowStockThreshold: this.lowStockThreshold,
      estimatedTime: this.estimatedTime,
      warrantyDays: this.warrantyDays,
      tags: this.tags,
      notes: this.notes,
      attachments: this.attachments,
      priceHistory: this.priceHistory,
      supplierId: this.supplierId,
      supplierName: this.supplierName,
      supplierCode: this.supplierCode,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastPurchaseAt: this.lastPurchaseAt,
      lastSaleAt: this.lastSaleAt,
      // Propriedades calculadas
      margin: this.margin,
      profit: this.profit,
      stockStatus: this.stockStatus,
      isLowStock: this.isLowStock,
      isOutOfStock: this.isOutOfStock
    };
  }
}

// ==================== REPOSITÓRIO ====================
export const PriceRepo = {
  collection: Storage.collection(COLLECTION_NAME),
  
  // Constantes exportadas
  PRICE_TYPES,
  CATEGORIES,
  UNITS,

  // ==================== CRUD ====================
  async create(data) {
    const price = new PriceModel(data);
    
    // Validar dados básicos
    if (!price.name.trim()) {
      throw new Error("Nome do item é obrigatório");
    }
    
    if (price.salePrice <= 0) {
      throw new Error("Preço de venda deve ser maior que zero");
    }
    
    // Verificar SKU duplicado
    const existing = this.collection.find(item => item.sku === price.sku);
    if (existing) {
      throw new Error(`SKU ${price.sku} já existe`);
    }
    
    return this.collection.create(price.toJSON());
  },

  async update(id, data) {
    const existing = this.collection.findById(id);
    if (!existing) {
      throw new Error("Item não encontrado");
    }
    
    const price = new PriceModel({ ...existing, ...data, id });
    
    // Se preço mudou, registrar no histórico
    if (data.salePrice !== undefined && data.salePrice !== existing.salePrice) {
      price.updatePrice(
        data.salePrice,
        data.priceChangeReason || "manual_update",
        data.userId || "system"
      );
    }
    
    return this.collection.update(id, price.toJSON());
  },

  async delete(id) {
    const success = this.collection.delete(id);
    if (!success) {
      throw new Error("Item não encontrado");
    }
    return { success: true };
  },

  async archive(id) {
    return this.update(id, { active: false });
  },

  async restore(id) {
    return this.update(id, { active: true });
  },

  // ==================== CONSULTAS ====================
  async find(filters = {}) {
    let query = this.collection.all();
    
    // Filtrar apenas ativos por padrão
    if (filters.active !== false) {
      query = query.filter(item => item.active !== false);
    }
    
    // Filtros básicos
    if (filters.category) {
      query = query.filter(item => item.category === filters.category);
    }
    
    if (filters.type) {
      query = query.filter(item => item.type === filters.type);
    }
    
    if (filters.brand) {
      query = query.filter(item => 
        item.brand.toLowerCase() === filters.brand.toLowerCase()
      );
    }
    
    if (filters.model) {
      query = query.filter(item => 
        item.model.toLowerCase().includes(filters.model.toLowerCase())
      );
    }
    
    if (filters.available === true) {
      query = query.filter(item => item.available !== false && item.stock > 0);
    } else if (filters.available === false) {
      query = query.filter(item => item.available === false || item.stock === 0);
    }
    
    // Filtro de estoque
    if (filters.stockStatus) {
      query = query.filter(item => {
        if (filters.stockStatus === "low") return item.isLowStock;
        if (filters.stockStatus === "out") return item.isOutOfStock;
        if (filters.stockStatus === "in") return !item.isLowStock && !item.isOutOfStock;
        return true;
      });
    }
    
    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      query = query.filter(item => {
        const itemTags = item.tags || [];
        return filters.tags.every(tag => itemTags.includes(tag));
      });
    }
    
    // Busca textual
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.filter(item => 
        (item.name || "").toLowerCase().includes(searchTerm) ||
        (item.description || "").toLowerCase().includes(searchTerm) ||
        (item.sku || "").toLowerCase().includes(searchTerm) ||
        (item.brand || "").toLowerCase().includes(searchTerm) ||
        (item.model || "").toLowerCase().includes(searchTerm) ||
        (item.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Filtro de preço
    if (filters.minPrice !== undefined) {
      query = query.filter(item => item.salePrice >= filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      query = query.filter(item => item.salePrice <= filters.maxPrice);
    }
    
    // Ordenação
    const sortField = filters.sortBy || "name";
    const sortOrder = filters.sortOrder === "desc" ? -1 : 1;
    
    query.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Tratamento especial para alguns campos
      if (sortField === "stockStatus") {
        const order = { out_of_stock: 1, low_stock: 2, in_stock: 3 };
        aVal = order[a.stockStatus] || 0;
        bVal = order[b.stockStatus] || 0;
      }
      
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });
    
    // Paginação
    const page = Math.max(1, filters.page || 1);
    const pageSize = Math.min(Math.max(1, filters.pageSize || 20), 100);
    const total = query.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    
    // Estatísticas da página
    const pageItems = query.slice(start, end);
    const stats = {
      totalItems: total,
      totalValue: pageItems.reduce((sum, item) => sum + (item.salePrice * item.stock), 0),
      avgPrice: pageItems.length > 0 
        ? pageItems.reduce((sum, item) => sum + item.salePrice, 0) / pageItems.length 
        : 0,
      lowStockCount: pageItems.filter(item => item.isLowStock).length,
      outOfStockCount: pageItems.filter(item => item.isOutOfStock).length
    };
    
    return {
      items: pageItems,
      stats,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  },

  async findById(id) {
    const item = this.collection.findById(id);
    if (!item) return null;
    
    // Enriquecer com dados relacionados
    return {
      ...item,
      relatedItems: await this.findRelatedItems(item),
      priceTrend: this.calculatePriceTrend(item),
      popularity: await this.calculatePopularity(item.id)
    };
  },

  async findBySKU(sku) {
    return this.collection.find(item => item.sku === sku);
  },

  async findByBrand(brand) {
    return this.collection.where({ brand, active: true })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  async findByCategory(category) {
    return this.collection.where({ category, active: true })
      .sort((a, b) => a.name.localeCompare(b.name));
  },

  // ==================== BUSCA AVANÇADA ====================
  async search(query, options = {}) {
    const { 
      limit = 10, 
      fields = ["name", "description", "sku", "brand", "model"],
      exactMatch = false
    } = options;
    
    if (!query.trim()) return [];
    
    const searchTerm = exactMatch ? query.trim().toLowerCase() : query.toLowerCase();
    const allItems = this.collection.all().filter(item => item.active !== false);
    
    return allItems.filter(item => {
      return fields.some(field => {
        const value = item[field];
        if (!value) return false;
        
        const strValue = Array.isArray(value) ? value.join(" ") : String(value);
        
        if (exactMatch) {
          return strValue.toLowerCase() === searchTerm;
        } else {
          return strValue.toLowerCase().includes(searchTerm);
        }
      });
    }).slice(0, limit);
  },

  async findByCompatibility(deviceBrand, deviceModel) {
    const allItems = this.collection.all();
    
    return allItems.filter(item => {
      if (!item.active) return false;
      
      // Verificar compatibilidade direta
      if (item.brand && item.model) {
        if (item.brand.toLowerCase() === deviceBrand.toLowerCase() &&
            item.model.toLowerCase() === deviceModel.toLowerCase()) {
          return true;
        }
      }
      
      // Verificar lista de compatibilidade
      if (item.compatibility && Array.isArray(item.compatibility)) {
        return item.compatibility.some(compat => {
          const [brand, model] = compat.split(":").map(s => s.trim().toLowerCase());
          return brand === deviceBrand.toLowerCase() && model === deviceModel.toLowerCase();
        });
      }
      
      return false;
    });
  },

  // ==================== ESTOQUE ====================
  async updateStock(id, quantity, reason = "adjustment", notes = "") {
    const item = this.collection.findById(id);
    if (!item) {
      throw new Error("Item não encontrado");
    }
    
    const newStock = Math.max(0, item.stock + quantity);
    const change = newStock - item.stock;
    
    const updated = await this.update(id, {
      stock: newStock,
      lastPurchaseAt: quantity > 0 ? Storage.nowISO() : item.lastPurchaseAt,
      lastSaleAt: quantity < 0 ? Storage.nowISO() : item.lastSaleAt,
      stockNotes: `${notes} (${change > 0 ? '+' : ''}${change})`
    });
    
    // Registrar movimentação de estoque
    await this.recordStockMovement(id, {
      previousStock: item.stock,
      newStock,
      change,
      reason,
      notes,
      timestamp: Storage.nowISO()
    });
    
    return updated;
  },

  async recordStockMovement(itemId, movement) {
    const movementsKey = `${COLLECTION_NAME}:movements:${itemId}`;
    const movements = Storage.get(movementsKey, []);
    movements.push(movement);
    Storage.set(movementsKey, movements);
  },

  async getStockMovements(itemId, limit = 50) {
    const movementsKey = `${COLLECTION_NAME}:movements:${itemId}`;
    const movements = Storage.get(movementsKey, []);
    return movements.slice(-limit).reverse();
  },

  async getStockAlerts() {
    const items = this.collection.all();
    
    return {
      lowStock: items.filter(item => item.isLowStock && item.active),
      outOfStock: items.filter(item => item.isOutOfStock && item.active),
      critical: items.filter(item => 
        item.active && 
        item.available && 
        item.stock <= 1 &&
        item.category !== CATEGORIES.SERVICE
      )
    };
  },

  // ==================== PRECIFICAÇÃO ====================
  async calculatePrice(itemId, options = {}) {
    const item = this.collection.findById(itemId);
    if (!item) {
      throw new Error("Item não encontrado");
    }
    
    const price = new PriceModel(item);
    return price.calculatePrice(options);
  },

  async bulkUpdatePrices(updates, reason = "bulk_update", userId = "system") {
    const results = {
      updated: 0,
      failed: 0,
      details: []
    };
    
    for (const update of updates) {
      try {
        const { id, price, field = "salePrice" } = update;
        
        if (field === "salePrice") {
          const item = this.collection.findById(id);
          if (item) {
            const priceModel = new PriceModel(item);
            priceModel.updatePrice(price, reason, userId);
            this.collection.update(id, priceModel.toJSON());
            results.updated++;
            results.details.push({ id, success: true, newPrice: price });
          }
        } else {
          await this.update(id, { [field]: price });
          results.updated++;
          results.details.push({ id, success: true, [field]: price });
        }
      } catch (error) {
        results.failed++;
        results.details.push({ 
          id: update.id, 
          success: false, 
          error: error.message 
        });
      }
    }
    
    return results;
  },

  async applyMarginAdjustment(marginPercent, filters = {}) {
    const { items } = await this.find(filters);
    const updates = [];
    
    items.forEach(item => {
      const newPrice = item.costPrice * (1 + marginPercent / 100);
      updates.push({
        id: item.id,
        price: Math.max(item.minPrice || 0, Math.min(item.maxPrice || Infinity, newPrice))
      });
    });
    
    return this.bulkUpdatePrices(updates, `margin_adjustment_${marginPercent}%`);
  },

  // ==================== ESTATÍSTICAS ====================
  async getStats() {
    const items = this.collection.all().filter(item => item.active !== false);
    
    const stats = {
      total: items.length,
      byCategory: items.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {}),
      
      byType: items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {}),
      
      stock: {
        total: items.reduce((sum, item) => sum + item.stock, 0),
        value: items.reduce((sum, item) => sum + (item.salePrice * item.stock), 0),
        low: items.filter(item => item.isLowStock).length,
        out: items.filter(item => item.isOutOfStock).length
      },
      
      pricing: {
        avgPrice: items.length > 0 
          ? items.reduce((sum, item) => sum + item.salePrice, 0) / items.length 
          : 0,
        avgMargin: items.length > 0 
          ? items.reduce((sum, item) => sum + item.margin, 0) / items.length 
          : 0,
        minPrice: items.length > 0 
          ? Math.min(...items.map(item => item.salePrice)) 
          : 0,
        maxPrice: items.length > 0 
          ? Math.max(...items.map(item => item.salePrice)) 
          : 0
      }
    };
    
    return stats;
  },

  async getCategoryStats(category) {
    const items = this.collection.all().filter(item => 
      item.active && item.category === category
    );
    
    if (items.length === 0) {
      return null;
    }
    
    const brands = [...new Set(items.map(item => item.brand).filter(Boolean))];
    const avgPrice = items.reduce((sum, item) => sum + item.salePrice, 0) / items.length;
    const avgMargin = items.reduce((sum, item) => sum + item.margin, 0) / items.length;
    
    return {
      category,
      count: items.length,
      brands,
      avgPrice,
      avgMargin,
      stock: items.reduce((sum, item) => sum + item.stock, 0),
      stockValue: items.reduce((sum, item) => sum + (item.salePrice * item.stock), 0)
    };
  },

  // ==================== MÉTODOS AUXILIARES ====================
  async findRelatedItems(item) {
    const allItems = this.collection.all();
    
    return allItems.filter(other => 
      other.id !== item.id &&
      other.active &&
      (
        other.category === item.category ||
        other.brand === item.brand ||
        (other.tags || []).some(tag => (item.tags || []).includes(tag))
      )
    ).slice(0, 5);
  },

  calculatePriceTrend(item) {
    if (!item.priceHistory || item.priceHistory.length < 2) {
      return { trend: "stable", change: 0 };
    }
    
    const recent = item.priceHistory.slice(-5);
    const changes = recent.map((entry, index) => {
      if (index === 0) return 0;
      return ((entry.newPrice - recent[index - 1].newPrice) / recent[index - 1].newPrice) * 100;
    });
    
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    
    return {
      trend: avgChange > 1 ? "up" : avgChange < -1 ? "down" : "stable",
      change: avgChange,
      lastChange: changes[changes.length - 1] || 0
    };
  },

  async calculatePopularity(itemId) {
    // Nota: Em uma implementação real, buscaria dados de vendas
    // Por enquanto, usamos uma simulação
    const item = this.collection.findById(itemId);
    if (!item) return 0;
    
    // Fatores simulados
    const age = (new Date() - new Date(item.createdAt)) / (1000 * 60 * 60 * 24 * 30); // meses
    const priceFactor = 1 / (item.salePrice / 1000); // Itens mais baratos são mais populares
    const stockFactor = item.stock > 0 ? 1 : 0.1;
    const recencyFactor = item.lastSaleAt ? 1 : 0.5;
    
    return (priceFactor * stockFactor * recencyFactor) / Math.max(1, age);
  },

  // ==================== IMPORT/EXPORT ====================
  async exportCatalog(format = "json", filters = {}) {
    const { items } = await this.find(filters);
    
    switch (format) {
      case "json":
        return JSON.stringify(items, null, 2);
        
      case "csv":
        if (items.length === 0) return "";
        
        const headers = [
          "SKU", "Nome", "Categoria", "Marca", "Modelo", 
          "Custo", "Preço Venda", "Estoque", "Status", "Tags"
        ];
        
        const rows = items.map(item => [
          item.sku,
          `"${item.name}"`,
          item.category,
          item.brand,
          item.model,
          item.costPrice.toFixed(2),
          item.salePrice.toFixed(2),
          item.stock,
          item.active ? "Ativo" : "Inativo",
          `"${(item.tags || []).join(", ")}"`
        ]);
        
        return [headers, ...rows].map(row => row.join(",")).join("\n");
        
      case "xlsx":
        // Nota: Para produção, usar uma biblioteca como SheetJS
        throw new Error("Exportação XLSX requer biblioteca adicional");
        
      default:
        throw new Error(`Formato não suportado: ${format}`);
    }
  },

  async importCatalog(data, options = {}) {
    const { 
      merge = false, 
      updateExisting = true,
      skipDuplicates = false 
    } = options;
    
    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };
    
    if (!Array.isArray(data)) {
      throw new Error("Dados de importação devem ser um array");
    }
    
    for (const [index, itemData] of data.entries()) {
      try {
        // Validar dados básicos
        if (!itemData.name || !itemData.salePrice) {
          results.errors.push({
            index,
            item: itemData,
            error: "Nome e preço são obrigatórios"
          });
          continue;
        }
        
        // Verificar se já existe
        const existing = this.collection.find(item => 
          item.sku === itemData.sku || 
          (item.name === itemData.name && item.brand === itemData.brand && item.model === itemData.model)
        );
        
        if (existing) {
          if (skipDuplicates) {
            results.skipped++;
            continue;
          }
          
          if (updateExisting) {
            await this.update(existing.id, itemData);
            results.updated++;
          }
        } else {
          await this.create(itemData);
          results.imported++;
        }
      } catch (error) {
        results.errors.push({
          index,
          item: itemData,
          error: error.message
        });
      }
    }
    
    return results;
  },

  // ==================== AUTOCOMPLETE HELPERS ====================
  async getBrands() {
    const items = this.collection.all();
    const brands = items
      .map(item => item.brand)
      .filter(brand => brand && brand.trim())
      .map(brand => brand.trim());
    
    return [...new Set(brands)].sort();
  },

  async getModels(brand = null) {
    const items = this.collection.all();
    let filtered = items;
    
    if (brand) {
      filtered = items.filter(item => item.brand === brand);
    }
    
    const models = filtered
      .map(item => item.model)
      .filter(model => model && model.trim())
      .map(model => model.trim());
    
    return [...new Set(models)].sort();
  },

  async getCategories() {
    const items = this.collection.all();
    const categories = items
      .map(item => item.category)
      .filter(cat => cat && cat.trim());
    
    return [...new Set(categories)].sort();
  },

  async getTags() {
    const items = this.collection.all();
    const allTags = items.reduce((tags, item) => {
      if (item.tags && Array.isArray(item.tags)) {
        tags.push(...item.tags);
      }
      return tags;
    }, []);
    
    return [...new Set(allTags)].sort();
  }
};