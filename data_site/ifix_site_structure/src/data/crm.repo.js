// src/data/crm.repo.js
// Repositório de Clientes (CRM)
// Responsabilidade: CRUD + buscas/filtros + validação + relacionamentos

import Storage from "./storage.js";

// Constantes
const COLLECTION_NAME = "clients";
const VALID_STATUSES = ["active", "archived", "inactive"];
const MIN_PHONE_LENGTH = 10;
const MAX_PHONE_LENGTH = 15;

// Erros customizados
class CRMError extends Error {
  constructor(message, code = "CRM_ERROR", details = null) {
    super(message);
    this.name = "CRMError";
    this.code = code;
    this.details = details;
  }
}

// ==================== VALIDAÇÃO ====================
const Validators = {
  required(value, fieldName) {
    if (value === null || value === undefined || value === "") {
      return `O campo ${fieldName} é obrigatório`;
    }
    return null;
  },

  minLength(value, fieldName, min) {
    if (value && value.length < min) {
      return `${fieldName} deve ter pelo menos ${min} caracteres`;
    }
    return null;
  },

  maxLength(value, fieldName, max) {
    if (value && value.length > max) {
      return `${fieldName} não pode ter mais de ${max} caracteres`;
    }
    return null;
  },

  email(value) {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Email inválido";
    }
    return null;
  },

  phone(value) {
    if (!value) return null;
    
    const digits = value.replace(/\D/g, "");
    if (digits.length < MIN_PHONE_LENGTH) {
      return `Telefone deve ter pelo menos ${MIN_PHONE_LENGTH} dígitos`;
    }
    if (digits.length > MAX_PHONE_LENGTH) {
      return `Telefone não pode ter mais de ${MAX_PHONE_LENGTH} dígitos`;
    }
    return null;
  },

  cpfCnpj(value) {
    if (!value) return null;
    
    const digits = value.replace(/\D/g, "");
    if (digits.length === 11) {
      // Validação básica de CPF
      if (/^(\d)\1{10}$/.test(digits)) return "CPF inválido";
    } else if (digits.length === 14) {
      // Validação básica de CNPJ
      if (/^(\d)\1{13}$/.test(digits)) return "CNPJ inválido";
    } else {
      return "CPF/CNPJ deve ter 11 ou 14 dígitos";
    }
    return null;
  },

  status(value) {
    if (value && !VALID_STATUSES.includes(value)) {
      return `Status inválido. Use: ${VALID_STATUSES.join(", ")}`;
    }
    return null;
  }
};

// ==================== NORMALIZAÇÃO ====================
const Normalizers = {
  text(value) {
    return value ? String(value).trim() : "";
  },

  phone(value) {
    if (!value) return null;
    const digits = String(value).replace(/\D/g, "");
    return digits || null;
  },

  email(value) {
    if (!value) return null;
    return String(value).trim().toLowerCase();
  },

  cpfCnpj(value) {
    if (!value) return null;
    return String(value).replace(/\D/g, "") || null;
  },

  tags(value) {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
      return value.split(",")
        .map(v => v.trim())
        .filter(Boolean);
    }
    return [];
  },

  date(value) {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "number") return new Date(value).toISOString();
    return String(value);
  }
};

// ==================== REPOSITÓRIO ====================
export const CRMRepo = {
  collection: Storage.collection(COLLECTION_NAME),

  // ==================== CRUD ====================
  async create(data) {
    // Normalização
    const normalized = {
      name: Normalizers.text(data.name),
      email: Normalizers.email(data.email),
      phone: Normalizers.phone(data.phone),
      cpfCnpj: Normalizers.cpfCnpj(data.cpfCnpj),
      document: Normalizers.text(data.document),
      address: Normalizers.text(data.address),
      city: Normalizers.text(data.city),
      state: Normalizers.text(data.state),
      neighborhood: Normalizers.text(data.neighborhood),
      zipCode: Normalizers.text(data.zipCode),
      notes: Normalizers.text(data.notes),
      tags: Normalizers.tags(data.tags),
      status: data.status || "active",
      metadata: {
        source: data.metadata?.source || "manual",
        assignedTo: data.metadata?.assignedTo || null,
        customFields: data.metadata?.customFields || {}
      }
    };

    // Validação
    const errors = this.validate(normalized);
    if (errors.length > 0) {
      throw new CRMError("Validação falhou", "VALIDATION_ERROR", errors);
    }

    // Verificar duplicatas
    const duplicates = await this.findDuplicates(normalized);
    if (duplicates.length > 0) {
      throw new CRMError(
        "Cliente duplicado encontrado",
        "DUPLICATE_ERROR",
        { duplicates, fields: duplicates.map(d => d.field) }
      );
    }

    // Criar
    return this.collection.create({
      ...normalized,
      fullTextSearch: this.buildSearchIndex(normalized),
      statistics: {
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: null,
        orderCount: 0
      }
    });
  },

  async update(id, data) {
    const existing = this.collection.findById(id);
    if (!existing) {
      throw new CRMError("Cliente não encontrado", "NOT_FOUND");
    }

    // Normalizar apenas campos fornecidos
    const updates = {};
    const fields = Object.keys(data);
    
    fields.forEach(field => {
      if (Normalizers[field]) {
        updates[field] = Normalizers[field](data[field]);
      } else if (field === "metadata") {
        updates.metadata = {
          ...existing.metadata,
          ...data.metadata,
          customFields: {
            ...existing.metadata?.customFields,
            ...data.metadata?.customFields
          }
        };
      } else {
        updates[field] = data[field];
      }
    });

    // Validação parcial
    const errors = this.validate(updates, { partial: true });
    if (errors.length > 0) {
      throw new CRMError("Validação falhou", "VALIDATION_ERROR", errors);
    }

    // Verificar duplicatas (excluindo o próprio)
    const checkData = { ...existing, ...updates };
    const duplicates = await this.findDuplicates(checkData, id);
    if (duplicates.length > 0) {
      throw new CRMError(
        "Cliente duplicado encontrado",
        "DUPLICATE_ERROR",
        { duplicates }
      );
    }

    // Atualizar
    const updated = this.collection.update(id, {
      ...updates,
      fullTextSearch: this.buildSearchIndex(checkData)
    });

    return updated;
  },

  async delete(id, hardDelete = false) {
    if (hardDelete) {
      const success = this.collection.delete(id);
      if (!success) {
        throw new CRMError("Cliente não encontrado", "NOT_FOUND");
      }
      return { success: true, method: "hard" };
    }

    // Soft delete (arquivamento)
    const updated = await this.update(id, { 
      status: "archived",
      deletedAt: Storage.nowISO()
    });
    return { success: true, method: "soft", client: updated };
  },

  async restore(id) {
    const client = this.collection.findById(id);
    if (!client) {
      throw new CRMError("Cliente não encontrado", "NOT_FOUND");
    }

    return this.update(id, { 
      status: "active",
      deletedAt: null 
    });
  },

  // ==================== QUERIES ====================
  async find(filters = {}) {
    let query = this.collection.all();
    
    // Filtro por status
    if (filters.status) {
      if (filters.status === "all") {
        // Inclui todos
      } else if (filters.status === "active_only") {
        query = query.filter(c => c.status === "active" && !c.deletedAt);
      } else {
        query = query.filter(c => c.status === filters.status);
      }
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      query = query.filter(c => {
        const clientTags = c.tags || [];
        return filters.tags.every(tag => clientTags.includes(tag));
      });
    }

    // Busca textual
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.filter(c => 
        (c.fullTextSearch || "").toLowerCase().includes(searchTerm) ||
        (c.name || "").toLowerCase().includes(searchTerm) ||
        (c.email || "").toLowerCase().includes(searchTerm) ||
        (c.phone || "").includes(searchTerm)
      );
    }

    // Filtro por data
    if (filters.createdAfter) {
      const date = new Date(filters.createdAfter);
      query = query.filter(c => new Date(c.createdAt) >= date);
    }
    
    if (filters.createdBefore) {
      const date = new Date(filters.createdBefore);
      query = query.filter(c => new Date(c.createdAt) <= date);
    }

    // Ordenação
    const sortField = filters.sortBy || "updatedAt";
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
    
    query.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      
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

    return {
      items: query.slice(start, end),
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
    const client = this.collection.findById(id);
    if (!client) return null;
    
    // Enriquecer com estatísticas de ordens de serviço
    const enriched = { ...client };
    
    // Nota: Em uma implementação real, buscaria de OSRepo
    // enriched.statistics = await OSRepo.getClientStats(id);
    
    return enriched;
  },

  async search(query, options = {}) {
    const { limit = 10, fields = ["name", "email", "phone", "cpfCnpj"] } = options;
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return [];

    return this.collection.all()
      .filter(client => {
        return fields.some(field => {
          const value = client[field];
          return value && String(value).toLowerCase().includes(searchTerm);
        });
      })
      .slice(0, limit);
  },

  // ==================== MÉTODOS AUXILIARES ====================
  validate(data, options = {}) {
    const { partial = false } = options;
    const errors = [];

    // Campos obrigatórios (apenas para criação)
    if (!partial) {
      const requiredError = Validators.required(data.name, "nome");
      if (requiredError) errors.push(requiredError);
    }

    // Validações condicionais
    if (data.name && data.name.length > 0) {
      const minError = Validators.minLength(data.name, "Nome", 2);
      if (minError) errors.push(minError);
      
      const maxError = Validators.maxLength(data.name, "Nome", 200);
      if (maxError) errors.push(maxError);
    }

    if (data.email) {
      const emailError = Validators.email(data.email);
      if (emailError) errors.push(emailError);
    }

    if (data.phone) {
      const phoneError = Validators.phone(data.phone);
      if (phoneError) errors.push(phoneError);
    }

    if (data.cpfCnpj) {
      const docError = Validators.cpfCnpj(data.cpfCnpj);
      if (docError) errors.push(docError);
    }

    if (data.status) {
      const statusError = Validators.status(data.status);
      if (statusError) errors.push(statusError);
    }

    return errors;
  },

  async findDuplicates(data, excludeId = null) {
    const allClients = this.collection.all();
    const duplicates = [];

    // Verificar por email
    if (data.email) {
      const match = allClients.find(c => 
        c.email === data.email && 
        c.id !== excludeId &&
        c.status !== "archived"
      );
      if (match) duplicates.push({ field: "email", client: match });
    }

    // Verificar por telefone
    if (data.phone) {
      const match = allClients.find(c => 
        c.phone === data.phone && 
        c.id !== excludeId &&
        c.status !== "archived"
      );
      if (match) duplicates.push({ field: "phone", client: match });
    }

    // Verificar por CPF/CNPJ
    if (data.cpfCnpj) {
      const match = allClients.find(c => 
        c.cpfCnpj === data.cpfCnpj && 
        c.id !== excludeId &&
        c.status !== "archived"
      );
      if (match) duplicates.push({ field: "cpfCnpj", client: match });
    }

    return duplicates;
  },

  buildSearchIndex(client) {
    const fields = [
      client.name,
      client.email,
      client.phone,
      client.cpfCnpj,
      client.document,
      client.address,
      client.city,
      client.state,
      client.neighborhood,
      client.zipCode,
      ...(client.tags || [])
    ].filter(Boolean).join(" ").toLowerCase();

    return fields;
  },

  // ==================== ESTATÍSTICAS ====================
  async getStats() {
    const clients = this.collection.all();
    
    const stats = {
      total: clients.length,
      byStatus: clients.reduce((acc, c) => {
        const status = c.status || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      byCity: clients.reduce((acc, c) => {
        const city = c.city || "Não informado";
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      }, {}),
      createdThisMonth: clients.filter(c => {
        const created = new Date(c.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && 
               created.getFullYear() === now.getFullYear();
      }).length,
      recentlyUpdated: clients.filter(c => {
        const updated = new Date(c.updatedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return updated > weekAgo;
      }).length
    };

    return stats;
  },

  async export(format = "json") {
    const clients = this.collection.all();
    
    switch (format) {
      case "json":
        return JSON.stringify(clients, null, 2);
        
      case "csv":
        if (clients.length === 0) return "";
        
        const headers = ["ID", "Nome", "Email", "Telefone", "Status", "Cidade", "Criado em"];
        const rows = clients.map(c => [
          c.id,
          `"${c.name || ""}"`,
          `"${c.email || ""}"`,
          `"${c.phone || ""}"`,
          c.status,
          `"${c.city || ""}"`,
          new Date(c.createdAt).toLocaleDateString("pt-BR")
        ]);
        
        return [headers, ...rows].map(row => row.join(",")).join("\n");
        
      default:
        throw new CRMError(`Formato não suportado: ${format}`, "EXPORT_ERROR");
    }
  },

  async import(data, options = {}) {
    const { merge = false, onConflict = "skip" } = options;
    const imported = [];
    const errors = [];
    const skipped = [];

    if (!Array.isArray(data)) {
      throw new CRMError("Dados de importação devem ser um array", "IMPORT_ERROR");
    }

    for (const [index, item] of data.entries()) {
      try {
        // Verificar se já existe
        const existing = this.collection.all().find(c => 
          c.email === item.email || 
          c.cpfCnpj === item.cpfCnpj
        );

        if (existing) {
          if (onConflict === "skip") {
            skipped.push({ index, item, reason: "Duplicado" });
            continue;
          } else if (onConflict === "update") {
            const updated = await this.update(existing.id, item);
            imported.push({ action: "updated", client: updated });
          }
        } else {
          const created = await this.create(item);
          imported.push({ action: "created", client: created });
        }
      } catch (error) {
        errors.push({
          index,
          item,
          error: error.message,
          details: error.details
        });
      }
    }

    return {
      imported: imported.length,
      errors: errors.length,
      skipped: skipped.length,
      details: {
        imported,
        errors,
        skipped
      }
    };
  }
};