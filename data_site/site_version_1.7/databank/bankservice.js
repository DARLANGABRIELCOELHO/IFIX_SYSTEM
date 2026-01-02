// databank/bankservice.js

// Banco de dados simulado
const mockDB = {
    // Clientes
    clients: [
        {
            id: 1,
            name: "João Silva",
            cpf: "123.456.789-00",
            phone: "(15) 99999-9999",
            email: "joao@email.com",
            address: "Rua das Flores, 123 - Boituva/SP",
            registrationDate: "2023-01-15",
            totalSpent: 2850.50
        }
    ],

    // Ordens de Serviço
    orders: [
        {
            id: 1,
            protocol: "2023001",
            clientId: 1,
            equipment: "iPhone 12 Pro",
            status: "Pronto",
            date: "2023-10-15",
            value: 450.00,
            services: ["Troca de tela", "Troca de bateria"]
        }
    ],

    // Serviços e Preços
    services: [
        {
            id: 1,
            name: "Troca de Tela",
            category: "Display",
            price: 250.00,
            estimatedTime: "2 horas"
        }
    ],

    // Métodos de busca
    searchClients(query) {
        const searchTerm = query.toLowerCase();
        return this.clients.filter(client => 
            client.name.toLowerCase().includes(searchTerm) ||
            client.cpf.includes(query) ||
            client.phone.includes(query)
        );
    },

    searchOrders(query) {
        const searchTerm = query.toLowerCase();
        return this.orders.filter(order =>
            order.protocol.includes(query) ||
            order.equipment.toLowerCase().includes(searchTerm)
        ).map(order => ({
            ...order,
            client: this.clients.find(c => c.id === order.clientId)
        }));
    },

    // Estatísticas do Dashboard
    getDashboardStats() {
        return {
            monthlyEarnings: 12560.00,
            totalServices: 89,
            completedServices: 67,
            pendingServices: 22,
            totalClients: 156,
            newClientsToday: 3,
            newClientsThisMonth: 24,
            monthlyTarget: 78,
            monthlyServices: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
                data: [12, 19, 15, 25, 22, 30]
            },
            serviceTypes: {
                labels: ['Display', 'Bateria', 'Conector', 'Câmera', 'Outros'],
                data: [45, 20, 15, 12, 8]
            }
        };
    },

    // Ordens recentes
    getRecentOrders(limit = 5) {
        return this.orders.slice(0, limit).map(order => ({
            ...order,
            clientName: this.clients.find(c => c.id === order.clientId)?.name || 'Cliente não encontrado',
            clientPhone: this.clients.find(c => c.id === order.clientId)?.phone || ''
        }));
    },

    // Dados do sistema
    getSystemStats() {
        return {
            totalOrders: this.orders.length,
            totalClients: this.clients.length,
            activeOrders: this.orders.filter(o => !['Entregue', 'Cancelado'].includes(o.status)).length,
            monthlyAverage: 12560.00
        };
    },

    // Atividades recentes
    getRecentActivities() {
        return [
            {
                type: 'order_created',
                message: 'Nova OS #2023005 criada',
                timestamp: '2023-10-15T10:30:00',
                user: 'Técnico João'
            }
        ];
    }
};

export const db = {
    ...mockDB,

    // Métodos CRUD para Clientes
    async createClient(clientData) {
        const newClient = {
            id: this.clients.length + 1,
            ...clientData,
            registrationDate: new Date().toISOString().split('T')[0],
            totalSpent: 0
        };
        this.clients.push(newClient);
        return newClient;
    },

    async updateClient(id, clientData) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...clientData };
            return this.clients[index];
        }
        throw new Error('Cliente não encontrado');
    },

    async deleteClient(id) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients.splice(index, 1);
            return true;
        }
        return false;
    },

    // Métodos CRUD para OS
    async createOrder(orderData) {
        const newOrder = {
            id: this.orders.length + 1,
            protocol: `2023${String(this.orders.length + 1).padStart(3, '0')}`,
            ...orderData,
            date: new Date().toISOString().split('T')[0],
            status: 'Aguardando análise'
        };
        this.orders.push(newOrder);
        return newOrder;
    },

    async updateOrderStatus(id, status) {
        const index = this.orders.findIndex(o => o.id === id);
        if (index !== -1) {
            this.orders[index].status = status;
            
            // Se status for "Pronto" ou "Entregue", atualizar total gasto do cliente
            if (['Pronto', 'Entregue'].includes(status)) {
                const order = this.orders[index];
                const client = this.clients.find(c => c.id === order.clientId);
                if (client) {
                    client.totalSpent = (client.totalSpent || 0) + (order.value || 0);
                }
            }
            
            return this.orders[index];
        }
        throw new Error('Ordem de serviço não encontrada');
    },

    // Métodos CRUD para Serviços
    async createService(serviceData) {
        const newService = {
            id: this.services.length + 1,
            ...serviceData
        };
        this.services.push(newService);
        return newService;
    },

    async updateService(id, serviceData) {
        const index = this.services.findIndex(s => s.id === id);
        if (index !== -1) {
            this.services[index] = { ...this.services[index], ...serviceData };
            return this.services[index];
        }
        throw new Error('Serviço não encontrado');
    },

    // Busca global
    async globalSearch(query) {
        const results = {
            clients: this.searchClients(query),
            orders: this.searchOrders(query),
            services: this.services.filter(service =>
                service.name.toLowerCase().includes(query.toLowerCase()) ||
                service.category.toLowerCase().includes(query.toLowerCase())
            )
        };
        return results;
    }
};