// databank/bankservice.js - Atualizado

import { orderTemplates, orderManager } from './osbank.js';
import { clientTemplates, clientManager, communicationTemplates } from './bankcrm.js';

// Banco de dados simulado expandido
const mockDB = {
    // Clientes (expandido)
    clients: [
        {
            id: 1,
            code: 'CLI-001',
            name: "João Silva",
            cpf: "123.456.789-00",
            phone: "(15) 99999-9999",
            email: "joao@email.com",
            address: "Rua das Flores, 123 - Boituva/SP",
            registrationDate: "2023-01-15",
            totalSpent: 2850.50,
            notes: "Cliente preferencial, sempre paga em dinheiro",
            category: "vip",
            birthDate: "1985-03-15",
            profession: "Engenheiro"
        },
        {
            id: 2,
            code: 'CLI-002',
            name: "Maria Santos",
            cpf: "987.654.321-00",
            phone: "(15) 98888-8888",
            email: "maria@email.com",
            address: "Av. Principal, 456 - Boituva/SP",
            registrationDate: "2023-03-22",
            totalSpent: 1200.00,
            notes: "",
            category: "regular",
            birthDate: "1990-07-22",
            profession: "Professora"
        },
        {
            id: 3,
            code: 'CLI-003',
            name: "Empresa Tech Ltda",
            cnpj: "12.345.678/0001-99",
            phone: "(15) 97777-7777",
            email: "contato@techempresa.com.br",
            address: "Rua dos Negócios, 789 - Boituva/SP",
            registrationDate: "2023-05-10",
            totalSpent: 5400.00,
            notes: "Cliente corporativo, pagamento via boleto",
            category: "corporate",
            contactPerson: "Carlos Oliveira",
            companySize: "Média"
        }
    ],

    // Ordens de Serviço (expandido)
    orders: [
        {
            id: 1,
            protocol: "20231015001",
            clientId: 1,
            equipment: "iPhone 12 Pro",
            brand: "Apple",
            model: "iPhone 12 Pro",
            color: "Prata",
            imei: "356789123456789",
            password: "1234",
            accessories: "Capa e carregador original",
            status: "Pronto",
            date: "2023-10-15",
            estimatedDelivery: "2023-10-20",
            value: 450.00,
            reportedIssue: "Tela trincada após queda",
            diagnosis: "Necessária troca completa da tela",
            notes: "Cliente relatou queda do aparelho no asfalto",
            services: [
                { id: 1, name: "Troca de Tela", price: 250.00, description: "Tela original Apple" },
                { id: 2, name: "Troca de Bateria", price: 200.00, description: "Bateria com garantia" }
            ],
            checklist: [
                { id: 1, name: 'Wi-Fi', status: 'OK' },
                { id: 5, name: 'Tela / Touch', status: 'NOK' },
                { id: 9, name: 'Conector de carga', status: 'OK' }
            ],
            technician: "Técnico João",
            paymentMethod: "Cartão de crédito",
            warranty: "90 dias"
        },
        {
            id: 2,
            protocol: "20231018001",
            clientId: 2,
            equipment: "Samsung Galaxy S21",
            brand: "Samsung",
            model: "Galaxy S21",
            color: "Preto",
            imei: "987654321098765",
            password: "",
            accessories: "Apenas o aparelho",
            status: "Em manutenção",
            date: "2023-10-18",
            estimatedDelivery: "2023-10-25",
            value: 320.00,
            reportedIssue: "Aparelho não carrega",
            diagnosis: "Conector de carga danificado por oxidação",
            notes: "Cliente mencionou contato com água há 2 semanas",
            services: [
                { id: 3, name: "Troca de Conector de Carga", price: 120.00 },
                { id: 6, name: "Limpeza Interna", price: 80.00 },
                { id: 7, name: "Teste de Vedação", price: 120.00 }
            ],
            checklist: [
                { id: 9, name: 'Conector de carga', status: 'NOK' },
                { id: 15, name: 'Alto-falante auricular', status: 'OK' }
            ],
            technician: "Técnico Maria",
            paymentMethod: "Aguardando definição",
            warranty: "60 dias"
        },
        {
            id: 3,
            protocol: "20231020001",
            clientId: 3,
            equipment: "Xiaomi Redmi Note 12",
            brand: "Xiaomi",
            model: "Redmi Note 12",
            color: "Azul",
            imei: "456123789012345",
            password: "5555",
            accessories: "Capa, carregador, fone",
            status: "Aguardando análise",
            date: "2023-10-20",
            estimatedDelivery: null,
            value: 0.00,
            reportedIssue: "Touch apresenta falhas",
            diagnosis: "Aguardando análise técnica",
            notes: "Cliente corporativo - prioridade",
            services: [],
            checklist: [],
            technician: "",
            paymentMethod: "Boleto",
            warranty: ""
        }
    ],

    // Serviços e Preços (expandido)
    services: [
        {
            id: 1,
            code: "SRV-001",
            name: "Troca de Tela",
            category: "Display",
            price: 250.00,
            cost: 150.00,
            estimatedTime: "2 horas",
            description: "Substituição completa da tela do aparelho",
            technicalNotes: "Utilizar fitas adesivas originais. Testar touch após instalação.",
            warranty: "90 dias",
            active: true
        },
        {
            id: 2,
            code: "SRV-002",
            name: "Troca de Bateria",
            category: "Bateria",
            price: 200.00,
            cost: 100.00,
            estimatedTime: "1 hora",
            description: "Substituição da bateria por uma nova com garantia",
            technicalNotes: "Verificar capacidade da bateria original. Calibrar após instalação.",
            warranty: "180 dias",
            active: true
        },
        {
            id: 3,
            code: "SRV-003",
            name: "Troca de Conector de Carga",
            category: "Conector",
            price: 120.00,
            cost: 60.00,
            estimatedTime: "1 hora",
            description: "Substituição do conector de carga USB-C/Lightning",
            technicalNotes: "Verificar placa mãe por danos de oxidação.",
            warranty: "90 dias",
            active: true
        },
        {
            id: 4,
            code: "SRV-004",
            name: "Limpeza Interna",
            category: "Limpeza",
            price: 80.00,
            cost: 20.00,
            estimatedTime: "30 minutos",
            description: "Limpeza completa interna do aparelho",
            technicalNotes: "Utilizar álcool isopropílico e ar comprimido.",
            warranty: "30 dias",
            active: true
        },
        {
            id: 5,
            code: "SRV-005",
            name: "Troca de Câmera Traseira",
            category: "Câmera",
            price: 180.00,
            cost: 90.00,
            estimatedTime: "1.5 horas",
            description: "Substituição da câmera traseira",
            technicalNotes: "Testar foco e estabilização após instalação.",
            warranty: "90 dias",
            active: true
        },
        {
            id: 6,
            code: "SRV-006",
            name: "Manutenção Preventiva",
            category: "Preventiva",
            price: 150.00,
            cost: 50.00,
            estimatedTime: "45 minutos",
            description: "Checkup completo e limpeza preventiva",
            technicalNotes: "Verificar todos os componentes e fazer backup recomendado.",
            warranty: "60 dias",
            active: true
        }
    ],

    // Técnicos/Usuários do sistema
    technicians: [
        {
            id: 1,
            name: "João Técnico",
            username: "joao.tec",
            role: "technician",
            specialty: ["Apple", "Samsung"],
            active: true
        },
        {
            id: 2,
            name: "Maria Técnica",
            username: "maria.tec",
            role: "technician",
            specialty: ["Xiaomi", "Motorola"],
            active: true
        },
        {
            id: 3,
            name: "Admin Sistema",
            username: "admin",
            role: "admin",
            specialty: [],
            active: true
        }
    ],

    // Configurações do sistema
    settings: {
        companyName: "iFix Boituva",
        companyAddress: "Rua Exemplo, 123 - Centro, Boituva/SP",
        companyPhone: "(15) 3333-3333",
        companyEmail: "contato@ifixboituva.com.br",
        workingHours: "09:00 às 18:00",
        defaultWarranty: "90 dias",
        taxRate: 0.05,
        logo: "logo-ifix.png"
    }
};

// Exportar banco de dados aprimorado
export const db = {
    // Dados
    ...mockDB,
    ...orderTemplates,
    ...clientTemplates,

    // Métodos de OS
    ...orderManager,

    // Métodos de Clientes
    ...clientManager,

    // Templates de comunicação
    ...communicationTemplates,

    // Métodos CRUD para Clientes (expandidos)
    async createClient(clientData) {
        const newClient = {
            id: this.clients.length + 1,
            code: this.generateClientCode(),
            ...clientData,
            registrationDate: new Date().toISOString().split('T')[0],
            totalSpent: 0,
            category: "regular"
        };
        
        // Validar CPF/CNPJ
        if (newClient.cpf && !this.validateCPF(newClient.cpf)) {
            throw new Error('CPF inválido');
        }
        if (newClient.cnpj && !this.validateCNPJ(newClient.cnpj)) {
            throw new Error('CNPJ inválido');
        }
        
        this.clients.push(newClient);
        
        // Em um sistema real, enviar email de boas-vindas
        const welcomeEmail = this.welcomeEmail
            .replace('{cliente_nome}', newClient.name)
            .replace('{cliente_codigo}', newClient.code)
            .replace('{data_cadastro}', new Date().toLocaleDateString('pt-BR'));
        
        console.log('Email de boas-vindas:', welcomeEmail);
        
        return newClient;
    },

    async updateClient(id, clientData) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            // Preservar dados que não devem ser alterados
            const updatedClient = {
                ...this.clients[index],
                ...clientData,
                id: this.clients[index].id, // Garantir que ID não mude
                code: this.clients[index].code,
                registrationDate: this.clients[index].registrationDate
            };
            
            this.clients[index] = updatedClient;
            return updatedClient;
        }
        throw new Error('Cliente não encontrado');
    },

    // Métodos CRUD para OS (expandidos)
    async createOrder(orderData) {
        const protocol = this.generateProtocol();
        
        const newOrder = {
            id: this.orders.length + 1,
            protocol,
            ...orderData,
            date: new Date().toISOString().split('T')[0],
            status: 'Aguardando análise',
            value: orderData.services ? 
                orderData.services.reduce((sum, s) => sum + (s.price || 0), 0) : 0,
            checklist: orderData.checklist || [],
            services: orderData.services || []
        };
        
        this.orders.push(newOrder);
        
        // Atualizar cliente com novo gasto
        const clientIndex = this.clients.findIndex(c => c.id === orderData.clientId);
        if (clientIndex !== -1) {
            this.clients[clientIndex].totalSpent += newOrder.value;
            
            // Reclassificar cliente baseado no novo gasto
            const clientOrders = this.orders.filter(o => o.clientId === orderData.clientId);
            const clientData = this.calculateClientValue(clientOrders);
            this.clients[clientIndex].category = this.getClientCategory(clientData);
        }
        
        return newOrder;
    },

    async updateOrderStatus(id, status) {
        const index = this.orders.findIndex(o => o.id === id);
        if (index !== -1) {
            const oldStatus = this.orders[index].status;
            this.orders[index].status = status;
            
            // Se status mudou para "Pronto" ou "Entregue"
            if ((oldStatus !== 'Pronto' && status === 'Pronto') || 
                (oldStatus !== 'Entregue' && status === 'Entregue')) {
                
                const order = this.orders[index];
                const client = this.clients.find(c => c.id === order.clientId);
                
                if (client) {
                    // Enviar notificação ao cliente
                    const sms = this.serviceCompleteSMS.body
                        .replace('{cliente_nome}', client.name)
                        .replace('{protocolo}', order.protocol)
                        .replace('{equipamento}', order.equipment)
                        .replace('{valor_total}', order.value.toFixed(2));
                    
                    console.log('SMS para cliente:', sms);
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
            code: `SRV-${String(this.services.length + 1).padStart(3, '0')}`,
            ...serviceData,
            active: true
        };
        this.services.push(newService);
        return newService;
    },

    async updateService(id, serviceData) {
        const index = this.services.findIndex(s => s.id === id);
        if (index !== -1) {
            this.services[index] = { 
                ...this.services[index], 
                ...serviceData,
                id: this.services[index].id,
                code: this.services[index].code
            };
            return this.services[index];
        }
        throw new Error('Serviço não encontrado');
    },

    // Métodos para relatórios
    async generateMonthlyReport(year, month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
        
        const monthlyOrders = this.filterByDateRange(this.orders, startDate, endDate);
        const report = this.generateReport(monthlyOrders, 'monthly');
        
        return {
            period: `${month}/${year}`,
            ...report,
            clients: this.generateClientReport(this.clients, monthlyOrders)
        };
    },

    // Método para dashboard
    async getDashboardStats() {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const monthlyOrders = this.orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate.getMonth() + 1 === currentMonth && 
                   orderDate.getFullYear() === currentYear;
        });
        
        return {
            monthlyEarnings: monthlyOrders.reduce((sum, order) => sum + (order.value || 0), 0),
            totalServices: this.orders.length,
            completedServices: this.orders.filter(o => ['Pronto', 'Entregue'].includes(o.status)).length,
            pendingServices: this.orders.filter(o => !['Pronto', 'Entregue', 'Cancelado'].includes(o.status)).length,
            totalClients: this.clients.length,
            newClientsToday: this.clients.filter(c => c.registrationDate === today).length,
            newClientsThisMonth: this.clients.filter(c => {
                const regDate = new Date(c.registrationDate);
                return regDate.getMonth() + 1 === currentMonth && 
                       regDate.getFullYear() === currentYear;
            }).length,
            monthlyTarget: 75,
            monthlyServices: {
                labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                data: [12, 19, 15, 25, 22, 30, 28, 32, 35, 40, 38, 45]
            },
            serviceTypes: {
                labels: ['Display', 'Bateria', 'Conector', 'Câmera', 'Áudio', 'Software', 'Limpeza', 'Outros'],
                data: [45, 20, 15, 12, 8, 5, 10, 15]
            }
        };
    },

    // Método para buscar ordens recentes
    getRecentOrders(limit = 5) {
        return this.orders
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit)
            .map(order => ({
                ...order,
                clientName: this.clients.find(c => c.id === order.clientId)?.name || 'Cliente não encontrado',
                clientPhone: this.clients.find(c => c.id === order.clientId)?.phone || ''
            }));
    },

    // Busca global melhorada
    async globalSearch(query) {
        const searchTerm = query.toLowerCase();
        
        const results = {
            clients: this.clients.filter(client =>
                client.name.toLowerCase().includes(searchTerm) ||
                client.cpf?.toLowerCase().includes(searchTerm) ||
                client.cnpj?.toLowerCase().includes(searchTerm) ||
                client.phone.includes(query) ||
                client.email?.toLowerCase().includes(searchTerm)
            ),
            orders: this.orders.filter(order =>
                order.protocol.includes(query) ||
                order.equipment.toLowerCase().includes(searchTerm)
            ).map(order => ({
                ...order,
                client: this.clients.find(c => c.id === order.clientId)
            })),
            services: this.services.filter(service =>
                service.name.toLowerCase().includes(searchTerm) ||
                service.category.toLowerCase().includes(searchTerm) ||
                service.description?.toLowerCase().includes(searchTerm)
            )
        };
        
        return results;
    }
};