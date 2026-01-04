// src/data/os.repo.js
// Repositório de Ordens de Serviço
// Responsabilidade: CRUD + fluxo de trabalho + finanças + relatórios

import Storage from "./storage.js";

// Constantes
const COLLECTION_NAME = "orders";
const DEFAULT_CURRENCY = "BRL";

// Status do fluxo de trabalho
export const ORDER_STATUS = {
  DRAFT: "draft",           // Rascunho
  OPEN: "open",             // Aberta
  IN_PROGRESS: "in_progress", // Em andamento
  WAITING_PARTS: "waiting_parts", // Aguardando peças
  WAITING_APPROVAL: "waiting_approval", // Aguardando aprovação
  READY: "ready",           // Pronta para entrega
  DELIVERED: "delivered",   // Entregue
  CANCELED: "canceled",     // Cancelada
  PAID: "paid"              // Paga
};

// Tipos de serviço
export const SERVICE_TYPES = {
  REPAIR: "repair",
  MAINTENANCE: "maintenance",
  DIAGNOSIS: "diagnosis",
  CONSULTATION: "consultation",
  INSTALLATION: "installation",
  OTHER: "other"
};

// Métodos de pagamento
export const PAYMENT_METHODS = {
  CASH: "cash",
  CREDIT_CARD: "credit_card",
  DEBIT_CARD: "debit_card",
  PIX: "pix",
  TRANSFER: "transfer",
  CHECK: "check",
  OTHER: "other"
};

// Prioridades
export const PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
};

// Erros customizados
class OrderError extends Error {
  constructor(message, code = "ORDER_ERROR", details = null) {
    super(message);
    this.name = "OrderError";
    this.code = code;
    this.details = details;
  }
}

// ==================== MODELOS ====================
class OrderItem {
  constructor(data = {}) {
    this.id = data.id || Storage.createId("item");
    this.name = data.name || "";
    this.description = data.description || "";
    this.quantity = Math.max(1, Number(data.quantity) || 1);
    this.unitPrice = Math.max(0, Number(data.unitPrice) || 0);
    this.type = data.type || "product"; // product, service, part, labor
    this.category = data.category || "";
    this.taxRate = Math.max(0, Math.min(100, Number(data.taxRate) || 0));
    this.discount = Math.max(0, Number(data.discount) || 0);
  }

  get subtotal() {
    return this.quantity * this.unitPrice;
  }

  get taxAmount() {
    return (this.subtotal - this.discount) * (this.taxRate / 100);
  }

  get total() {
    return this.subtotal - this.discount + this.taxAmount;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      quantity: this.quantity,
      unitPrice: this.unitPrice,
      type: this.type,
      category: this.category,
      taxRate: this.taxRate,
      discount: this.discount,
      subtotal: this.subtotal,
      taxAmount: this.taxAmount,
      total: this.total
    };
  }
}

class OrderPayment {
  constructor(data = {}) {
    this.id = data.id || Storage.createId("payment");
    this.amount = Math.max(0, Number(data.amount) || 0);
    this.method = data.method || PAYMENT_METHODS.CASH;
    this.reference = data.reference || "";
    this.date = data.date || Storage.nowISO();
    this.receivedBy = data.receivedBy || "";
    this.notes = data.notes || "";
    this.status = data.status || "pending"; // pending, completed, refunded, failed
  }

  toJSON() {
    return {
      id: this.id,
      amount: this.amount,
      method: this.method,
      reference: this.reference,
      date: this.date,
      receivedBy: this.receivedBy,
      notes: this.notes,
      status: this.status
    };
  }
}

// ==================== REPOSITÓRIO ====================
export const OSRepo = {
  collection: Storage.collection(COLLECTION_NAME),
  
  // Constantes exportadas
  ORDER_STATUS,
  SERVICE_TYPES,
  PAYMENT_METHODS,
  PRIORITIES,

  // ==================== CRUD ====================
  async create(data) {
    // Validar cliente
    if (!data.clientId && !data.clientName) {
      throw new OrderError("Cliente é obrigatório", "VALIDATION_ERROR");
    }

    const now = Storage.nowISO();
    
    // Processar itens
    const items = (data.items || []).map(item => new OrderItem(item));
    
    // Calcular totais
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.max(0, Number(data.discount) || 0);
    const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const total = subtotal - discount + tax;

    // Criar ordem
    const order = this.collection.create({
      // Identificação
      number: await this.generateOrderNumber(),
      
      // Cliente
      clientId: data.clientId || null,
      clientName: data.clientName || "",
      clientPhone: data.clientPhone || "",
      clientEmail: data.clientEmail || "",
      clientAddress: data.clientAddress || "",
      
      // Equipamento/Serviço
      deviceType: data.deviceType || "", // smartphone, laptop, tablet, etc.
      deviceBrand: data.deviceBrand || "",
      deviceModel: data.deviceModel || "",
      serialNumber: data.serialNumber || "",
      imei: data.imei || "",
      
      // Problema/Descrição
      problemDescription: data.problemDescription || "",
      diagnostic: data.diagnostic || "",
      solution: data.solution || "",
      observations: data.observations || "",
      
      // Itens e valores
      items: items.map(item => item.toJSON()),
      subtotal,
      discount,
      tax,
      total,
      currency: DEFAULT_CURRENCY,
      
      // Status e fluxo
      status: data.status || ORDER_STATUS.DRAFT,
      priority: data.priority || PRIORITIES.MEDIUM,
      serviceType: data.serviceType || SERVICE_TYPES.REPAIR,
      assignedTo: data.assignedTo || null, // Técnico responsável
      
      // Datas importantes
      receivedAt: data.receivedAt || now,
      estimatedDelivery: data.estimatedDelivery || null,
      startedAt: data.startedAt || null,
      completedAt: data.completedAt || null,
      deliveredAt: data.deliveredAt || null,
      
      // Pagamentos
      payments: (data.payments || []).map(p => new OrderPayment(p).toJSON()),
      paidAmount: 0, // Calculado dinamicamente
      
      // Garantia
      warrantyDays: Math.max(0, Number(data.warrantyDays) || 0),
      warrantyDescription: data.warrantyDescription || "",
      
      // Anexos
      attachments: data.attachments || [], // URLs ou referências
      
      // Metadados
      tags: data.tags || [],
      internalNotes: data.internalNotes || "",
      history: [{
        status: data.status || ORDER_STATUS.DRAFT,
        userId: data.userId || "system",
        timestamp: now,
        notes: "Ordem criada"
      }]
    });

    // Atualizar estatísticas do cliente
    await this.updateClientStats(order.clientId);

    return order;
  },

  async update(id, data) {
    const existing = this.collection.findById(id);
    if (!existing) {
      throw new OrderError("Ordem não encontrada", "NOT_FOUND");
    }

    const updates = { ...data };
    const now = Storage.nowISO();
    
    // Se status mudou, adicionar ao histórico
    if (data.status && data.status !== existing.status) {
      updates.history = [
        ...(existing.history || []),
        {
          status: data.status,
          userId: data.userId || "system",
          timestamp: now,
          notes: data.statusNotes || `Status alterado para ${data.status}`
        }
      ];

      // Atualizar datas específicas baseadas no status
      switch (data.status) {
        case ORDER_STATUS.IN_PROGRESS:
          updates.startedAt = updates.startedAt || now;
          break;
        case ORDER_STATUS.READY:
          updates.completedAt = updates.completedAt || now;
          break;
        case ORDER_STATUS.DELIVERED:
          updates.deliveredAt = updates.deliveredAt || now;
          break;
        case ORDER_STATUS.PAID:
          updates.paidAt = updates.paidAt || now;
          break;
      }
    }

    // Se itens mudaram, recalcular totais
    if (data.items) {
      const items = data.items.map(item => new OrderItem(item));
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = items.reduce((sum, item) => sum + item.taxAmount, 0);
      const discount = Math.max(0, Number(updates.discount || existing.discount));
      
      updates.items = items.map(item => item.toJSON());
      updates.subtotal = subtotal;
      updates.tax = tax;
      updates.total = subtotal - discount + tax;
    }

    // Atualizar valor pago baseado nos pagamentos
    if (data.payments || updates.payments) {
      const payments = updates.payments || existing.payments || [];
      updates.paidAmount = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + Number(p.amount), 0);
    }

    const updated = this.collection.update(id, updates);
    
    // Atualizar estatísticas do cliente se necessário
    if (data.clientId || existing.clientId) {
      await this.updateClientStats(data.clientId || existing.clientId);
    }

    return updated;
  },

  async delete(id) {
    const order = this.collection.findById(id);
    if (!order) {
      throw new OrderError("Ordem não encontrada", "NOT_FOUND");
    }

    // Soft delete (arquivamento)
    const deleted = await this.update(id, {
      status: ORDER_STATUS.CANCELED,
      deletedAt: Storage.nowISO()
    });

    // Atualizar estatísticas do cliente
    await this.updateClientStats(order.clientId);

    return deleted;
  },

  // ==================== FLUXO DE TRABALHO ====================
  async changeStatus(id, newStatus, options = {}) {
    const { userId = "system", notes = "", metadata = {} } = options;
    
    const validTransitions = {
      [ORDER_STATUS.DRAFT]: [ORDER_STATUS.OPEN, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.OPEN]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.WAITING_PARTS, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.IN_PROGRESS]: [ORDER_STATUS.WAITING_APPROVAL, ORDER_STATUS.READY, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.WAITING_PARTS]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.WAITING_APPROVAL]: [ORDER_STATUS.IN_PROGRESS, ORDER_STATUS.READY, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED],
      [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.PAID],
      [ORDER_STATUS.PAID]: [] // Estado final
    };

    const order = this.collection.findById(id);
    if (!order) {
      throw new OrderError("Ordem não encontrada", "NOT_FOUND");
    }

    const currentStatus = order.status;
    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new OrderError(
        `Transição de ${currentStatus} para ${newStatus} não permitida`,
        "INVALID_TRANSITION",
        { currentStatus, newStatus, allowedTransitions }
      );
    }

    return this.update(id, {
      status: newStatus,
      statusNotes: notes,
      userId,
      ...metadata
    });
  },

  async addPayment(id, paymentData) {
    const order = this.collection.findById(id);
    if (!order) {
      throw new OrderError("Ordem não encontrada", "NOT_FOUND");
    }

    const payment = new OrderPayment(paymentData);
    const payments = [...(order.payments || []), payment.toJSON()];
    
    const updated = await this.update(id, { payments });
    
    // Se pagamento completo, atualizar status
    const paidAmount = payments
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    if (paidAmount >= order.total && order.status !== ORDER_STATUS.PAID) {
      await this.changeStatus(id, ORDER_STATUS.PAID, {
        notes: "Pagamento completo recebido"
      });
    }

    return updated;
  },

  async addItem(id, itemData) {
    const order = this.collection.findById(id);
    if (!order) {
      throw new OrderError("Ordem não encontrada", "NOT_FOUND");
    }

    if (order.status === ORDER_STATUS.PAID || order.status === ORDER_STATUS.CANCELED) {
      throw new OrderError(
        "Não é possível adicionar itens a uma ordem finalizada",
        "INVALID_OPERATION"
      );
    }

    const item = new OrderItem(itemData);
    const items = [...order.items, item.toJSON()];
    
    return this.update(id, { items });
  },

  // ==================== QUERIES E RELATÓRIOS ====================
  async find(filters = {}) {
    let query = this.collection.all();
    
    // Filtros básicos
    if (filters.status) {
      if (filters.status === "active") {
        query = query.filter(o => 
          ![ORDER_STATUS.CANCELED, ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED].includes(o.status)
        );
      } else {
        query = query.filter(o => o.status === filters.status);
      }
    }

    if (filters.clientId) {
      query = query.filter(o => o.clientId === filters.clientId);
    }

    if (filters.assignedTo) {
      query = query.filter(o => o.assignedTo === filters.assignedTo);
    }

    if (filters.priority) {
      query = query.filter(o => o.priority === filters.priority);
    }

    if (filters.serviceType) {
      query = query.filter(o => o.serviceType === filters.serviceType);
    }

    // Filtros de data
    if (filters.dateFrom) {
      const date = new Date(filters.dateFrom);
      query = query.filter(o => new Date(o.receivedAt) >= date);
    }

    if (filters.dateTo) {
      const date = new Date(filters.dateTo);
      query = query.filter(o => new Date(o.receivedAt) <= date);
    }

    if (filters.overdue) {
      const today = new Date();
      query = query.filter(o => {
        if (!o.estimatedDelivery) return false;
        const estimated = new Date(o.estimatedDelivery);
        return estimated < today && 
               ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED, ORDER_STATUS.PAID].includes(o.status);
      });
    }

    // Busca textual
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.filter(o => 
        (o.number || "").toLowerCase().includes(searchTerm) ||
        (o.clientName || "").toLowerCase().includes(searchTerm) ||
        (o.deviceModel || "").toLowerCase().includes(searchTerm) ||
        (o.problemDescription || "").toLowerCase().includes(searchTerm)
      );
    }

    // Ordenação
    const sortField = filters.sortBy || "receivedAt";
    const sortOrder = filters.sortOrder === "asc" ? 1 : -1;
    
    query.sort((a, b) => {
      const aVal = a[sortField] || "";
      const bVal = b[sortField] || "";
      
      if (sortField === "priority") {
        const priorityOrder = { [PRIORITIES.URGENT]: 4, [PRIORITIES.HIGH]: 3, [PRIORITIES.MEDIUM]: 2, [PRIORITIES.LOW]: 1 };
        return (priorityOrder[aVal] || 0 - priorityOrder[bVal] || 0) * sortOrder;
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

    // Calcular totais da página
    const pageItems = query.slice(start, end);
    const totals = {
      subtotal: pageItems.reduce((sum, o) => sum + (o.subtotal || 0), 0),
      discount: pageItems.reduce((sum, o) => sum + (o.discount || 0), 0),
      tax: pageItems.reduce((sum, o) => sum + (o.tax || 0), 0),
      total: pageItems.reduce((sum, o) => sum + (o.total || 0), 0),
      paid: pageItems.reduce((sum, o) => sum + (o.paidAmount || 0), 0),
      balance: pageItems.reduce((sum, o) => sum + ((o.total || 0) - (o.paidAmount || 0)), 0)
    };

    return {
      items: pageItems,
      totals,
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
    const order = this.collection.findById(id);
    if (!order) return null;

    // Calcular valores dinâmicos
    const paidAmount = (order.payments || [])
      .filter(p => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const balance = (order.total || 0) - paidAmount;
    const isOverdue = order.estimatedDelivery && 
                     new Date(order.estimatedDelivery) < new Date() && 
                     ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED, ORDER_STATUS.PAID].includes(order.status);

    return {
      ...order,
      paidAmount,
      balance,
      isOverdue,
      paymentStatus: balance <= 0 ? "paid" : 
                    paidAmount > 0 ? "partial" : "pending"
    };
  },

  async findByClient(clientId) {
    return this.collection.where({ clientId }).sort((a, b) => 
      new Date(b.receivedAt) - new Date(a.receivedAt)
    );
  },

  // ==================== ESTATÍSTICAS E RELATÓRIOS ====================
  async getStats(period = "month") {
    const orders = this.collection.all();
    const now = new Date();
    let startDate;

    switch (period) {
      case "day":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // Todos
    }

    const periodOrders = orders.filter(o => 
      new Date(o.receivedAt) >= startDate
    );

    // Agrupar por status
    const byStatus = periodOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    // Agrupar por técnico
    const byTechnician = periodOrders.reduce((acc, o) => {
      const tech = o.assignedTo || "Não atribuído";
      acc[tech] = (acc[tech] || 0) + 1;
      return acc;
    }, {});

    // Agrupar por tipo de serviço
    const byServiceType = periodOrders.reduce((acc, o) => {
      acc[o.serviceType] = (acc[o.serviceType] || 0) + 1;
      return acc;
    }, {});

    // Métricas financeiras
    const revenue = periodOrders
      .filter(o => o.status === ORDER_STATUS.PAID)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const pending = periodOrders
      .filter(o => o.status !== ORDER_STATUS.PAID && o.status !== ORDER_STATUS.CANCELED)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const averageTicket = periodOrders.length > 0 
      ? periodOrders.reduce((sum, o) => sum + (o.total || 0), 0) / periodOrders.length
      : 0;

    // Tempos médios
    const deliveredOrders = periodOrders.filter(o => 
      o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.PAID
    );

    let averageTurnaround = 0;
    if (deliveredOrders.length > 0) {
      const totalHours = deliveredOrders.reduce((sum, o) => {
        const received = new Date(o.receivedAt);
        const delivered = new Date(o.deliveredAt || o.completedAt || o.updatedAt);
        return sum + (delivered - received) / (1000 * 60 * 60);
      }, 0);
      averageTurnaround = totalHours / deliveredOrders.length;
    }

    return {
      period,
      total: periodOrders.length,
      financial: {
        revenue,
        pending,
        averageTicket,
        paid: revenue,
        balance: pending
      },
      distribution: {
        byStatus,
        byTechnician,
        byServiceType
      },
      metrics: {
        averageTurnaround: Math.round(averageTurnaround * 10) / 10,
        completionRate: orders.length > 0 
          ? (deliveredOrders.length / orders.length) * 100 
          : 0,
        overdueCount: periodOrders.filter(o => {
          if (!o.estimatedDelivery) return false;
          return new Date(o.estimatedDelivery) < now && 
                 ![ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELED, ORDER_STATUS.PAID].includes(o.status);
        }).length
      }
    };
  },

  async getClientStats(clientId) {
    const clientOrders = await this.findByClient(clientId);
    
    if (clientOrders.length === 0) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        averageTicket: 0,
        lastOrder: null,
        favoriteService: null,
        statusDistribution: {}
      };
    }

    const totalSpent = clientOrders
      .filter(o => o.status === ORDER_STATUS.PAID)
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const statusDistribution = clientOrders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    const serviceTypes = clientOrders.reduce((acc, o) => {
      acc[o.serviceType] = (acc[o.serviceType] || 0) + 1;
      return acc;
    }, {});

    const favoriteService = Object.entries(serviceTypes)
      .sort((a, b) => b[1] - a[1])[0]?.[0];

    const lastOrder = clientOrders
      .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))[0];

    return {
      totalOrders: clientOrders.length,
      totalSpent,
      averageTicket: clientOrders.length > 0 
        ? clientOrders.reduce((sum, o) => sum + (o.total || 0), 0) / clientOrders.length 
        : 0,
      lastOrder: lastOrder ? {
        id: lastOrder.id,
        number: lastOrder.number,
        date: lastOrder.receivedAt,
        total: lastOrder.total,
        status: lastOrder.status
      } : null,
      favoriteService,
      statusDistribution
    };
  },

  // ==================== MÉTODOS AUXILIARES ====================
  async generateOrderNumber() {
    const prefix = "OS";
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, "0");
    
    // Buscar última ordem do mês
    const orders = this.collection.all();
    const currentMonthOrders = orders.filter(o => {
      const date = new Date(o.receivedAt);
      return date.getFullYear() === new Date().getFullYear() &&
             date.getMonth() === new Date().getMonth();
    });
    
    const sequence = (currentMonthOrders.length + 1).toString().padStart(4, "0");
    return `${prefix}${year}${month}${sequence}`;
  },

  async updateClientStats(clientId) {
    if (!clientId) return;
    
    // Nota: Em uma implementação completa, atualizaria o cliente no CRMRepo
    // Por enquanto, retornamos as estatísticas calculadas
    return this.getClientStats(clientId);
  },

  async exportOrders(options = {}) {
    const { format = "json", filters = {} } = options;
    const { items: orders } = await this.find(filters);
    
    switch (format) {
      case "json":
        return JSON.stringify(orders, null, 2);
        
      case "csv":
        if (orders.length === 0) return "";
        
        const headers = [
          "Número", "Cliente", "Equipamento", "Problema", "Status",
          "Valor Total", "Pago", "Saldo", "Recebido em", "Entregue em"
        ];
        
        const rows = orders.map(o => [
          o.number,
          `"${o.clientName}"`,
          `"${o.deviceBrand} ${o.deviceModel}"`,
          `"${o.problemDescription.substring(0, 50)}${o.problemDescription.length > 50 ? '...' : ''}"`,
          o.status,
          o.total.toFixed(2),
          o.paidAmount.toFixed(2),
          (o.total - o.paidAmount).toFixed(2),
          new Date(o.receivedAt).toLocaleDateString("pt-BR"),
          o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString("pt-BR") : ""
        ]);
        
        return [headers, ...rows].map(row => row.join(",")).join("\n");
        
      default:
        throw new OrderError(`Formato não suportado: ${format}`, "EXPORT_ERROR");
    }
  },

  async getDashboardData() {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const orders = this.collection.all();
    const recentOrders = orders.filter(o => 
      new Date(o.receivedAt) >= last30Days
    );

    // Principais métricas
    const metrics = {
      totalRevenue: recentOrders
        .filter(o => o.status === ORDER_STATUS.PAID)
        .reduce((sum, o) => sum + (o.total || 0), 0),
      
      pendingRevenue: recentOrders
        .filter(o => o.status !== ORDER_STATUS.PAID && o.status !== ORDER_STATUS.CANCELED)
        .reduce((sum, o) => sum + (o.total || 0), 0),
      
      totalOrders: recentOrders.length,
      
      completedOrders: recentOrders
        .filter(o => o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.PAID)
        .length,
      
      averageProcessingTime: await this.calculateAverageProcessingTime(recentOrders)
    };

    // Dados para gráficos
    const dailyData = this.groupByDay(recentOrders, 30);
    const technicianPerformance = this.calculateTechnicianPerformance(recentOrders);
    const topServices = this.getTopServices(recentOrders, 5);
    const statusDistribution = this.getStatusDistribution(orders);

    return {
      metrics,
      charts: {
        dailyData,
        technicianPerformance,
        topServices,
        statusDistribution
      },
      recentOrders: recentOrders
        .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
        .slice(0, 10)
        .map(o => ({
          id: o.id,
          number: o.number,
          clientName: o.clientName,
          device: `${o.deviceBrand} ${o.deviceModel}`,
          status: o.status,
          total: o.total,
          receivedAt: o.receivedAt
        }))
    };
  },

  // Métodos auxiliares para dashboard
  calculateAverageProcessingTime(orders) {
    const completed = orders.filter(o => 
      o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.PAID
    );

    if (completed.length === 0) return 0;

    const totalHours = completed.reduce((sum, o) => {
      const received = new Date(o.receivedAt);
      const completedDate = new Date(o.deliveredAt || o.completedAt || o.updatedAt);
      return sum + (completedDate - received) / (1000 * 60 * 60);
    }, 0);

    return Math.round(totalHours / completed.length);
  },

  groupByDay(orders, days) {
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayOrders = orders.filter(o => 
        new Date(o.receivedAt).toISOString().split('T')[0] === dateStr
      );
      
      result.push({
        date: dateStr,
        count: dayOrders.length,
        revenue: dayOrders
          .filter(o => o.status === ORDER_STATUS.PAID)
          .reduce((sum, o) => sum + (o.total || 0), 0)
      });
    }
    
    return result;
  },

  calculateTechnicianPerformance(orders) {
    const techs = {};
    
    orders.forEach(o => {
      const tech = o.assignedTo || "Não atribuído";
      if (!techs[tech]) {
        techs[tech] = {
          total: 0,
          completed: 0,
          revenue: 0,
          avgTime: 0
        };
      }
      
      techs[tech].total++;
      
      if (o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.PAID) {
        techs[tech].completed++;
        techs[tech].revenue += o.total || 0;
      }
    });
    
    return Object.entries(techs).map(([name, data]) => ({
      name,
      ...data,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }));
  },

  getTopServices(orders, limit = 5) {
    const serviceCounts = {};
    
    orders.forEach(o => {
      const service = o.serviceType || SERVICE_TYPES.OTHER;
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
      
      // Contar itens individuais também
      o.items?.forEach(item => {
        const itemType = item.type === "service" ? item.name : item.category;
        if (itemType) {
          serviceCounts[itemType] = (serviceCounts[itemType] || 0) + 1;
        }
      });
    });
    
    return Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }));
  },

  getStatusDistribution(orders) {
    return orders.reduce((acc, o) => {
      const status = o.status || "unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }
};