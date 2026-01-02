// databank/osbank.js

// Dados de exemplo para ordens de serviço
export const orderTemplates = {
    checklistItems: [
        { id: 1, name: 'Wi-Fi', category: 'Conectividade' },
        { id: 2, name: 'Bluetooth', category: 'Conectividade' },
        { id: 3, name: 'Vibração', category: 'Hardware' },
        { id: 4, name: 'Flash', category: 'Câmera' },
        { id: 5, name: 'Tela / Touch', category: 'Display' },
        { id: 6, name: 'Sensor de presença', category: 'Sensores' },
        { id: 7, name: 'Biometria', category: 'Segurança' },
        { id: 8, name: 'Chip / Ligação', category: 'Conectividade' },
        { id: 9, name: 'Conector de carga', category: 'Hardware' },
        { id: 10, name: 'Microfone', category: 'Áudio' },
        { id: 11, name: 'Câmera frontal', category: 'Câmera' },
        { id: 12, name: 'Botões (power / volume)', category: 'Hardware' },
        { id: 13, name: 'Conexão 3G/4G', category: 'Conectividade' },
        { id: 14, name: 'Câmera traseira', category: 'Câmera' },
        { id: 15, name: 'Alto-falante auricular', category: 'Áudio' },
        { id: 16, name: 'Alto-falante principal', category: 'Áudio' }
    ],

    statusFlow: [
        'Aguardando análise',
        'Em análise',
        'Aguardando aprovação',
        'Em manutenção',
        'Pronto',
        'Entregue',
        'Cancelado'
    ],

    equipmentBrands: [
        'Apple',
        'Samsung',
        'Xiaomi',
        'Motorola',
        'LG',
        'Asus',
        'Nokia',
        'Sony',
        'Huawei',
        'Outros'
    ],

    equipmentModels: {
        'Apple': ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone SE', 'iPhone X'],
        'Samsung': ['Galaxy S23', 'Galaxy S22', 'Galaxy S21', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54'],
        'Xiaomi': ['Redmi Note 12', 'Redmi Note 11', 'Poco X5', 'Poco M5', 'Mi 13'],
        'Motorola': ['Edge 30', 'G84', 'G73', 'E32', 'E22']
    },

    commonIssues: [
        'Tela trincada',
        'Bateria não carrega',
        'Aparelho não liga',
        'Touch não funciona',
        'Câmera não funciona',
        'Não reconhece chip',
        'Conector de carga danificado',
        'Alto-falante não funciona',
        'Microfone não funciona',
        'Problemas com água',
        'Superaquecimento',
        'Problemas de software',
        'Botões não funcionam'
    ],

    generateProtocol: function() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${year}${month}${day}${random}`;
    },

    calculateEstimatedValue: function(services) {
        return services.reduce((total, service) => total + (service.price || 0), 0);
    },

    getStatusColor: function(status) {
        const colors = {
            'Aguardando análise': '#2196F3',
            'Em análise': '#673AB7',
            'Aguardando aprovação': '#FF9800',
            'Em manutenção': '#FF5722',
            'Pronto': '#4CAF50',
            'Entregue': '#009688',
            'Cancelado': '#F44336'
        };
        return colors[status] || '#9E9E9E';
    },

    getPriority: function(status) {
        const priorities = {
            'Aguardando análise': 1,
            'Em análise': 2,
            'Aguardando aprovação': 3,
            'Em manutenção': 4,
            'Pronto': 5,
            'Entregue': 6,
            'Cancelado': 0
        };
        return priorities[status] || 0;
    }
};

// Funções para gerenciar OS
export const orderManager = {
    // Buscar OS por status
    filterByStatus: function(orders, status) {
        if (!status) return orders;
        return orders.filter(order => order.status === status);
    },

    // Buscar OS por cliente
    filterByClient: function(orders, clientId) {
        if (!clientId) return orders;
        return orders.filter(order => order.clientId === clientId);
    },

    // Buscar OS por período
    filterByDateRange: function(orders, startDate, endDate) {
        return orders.filter(order => {
            const orderDate = new Date(order.date);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;
            
            if (start && orderDate < start) return false;
            if (end && orderDate > end) return false;
            return true;
        });
    },

    // Calcular estatísticas
    getStatistics: function(orders) {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const stats = {
            total: orders.length,
            pending: orders.filter(o => ['Aguardando análise', 'Em análise', 'Aguardando aprovação'].includes(o.status)).length,
            inProgress: orders.filter(o => o.status === 'Em manutenção').length,
            ready: orders.filter(o => o.status === 'Pronto').length,
            delivered: orders.filter(o => o.status === 'Entregue').length,
            cancelled: orders.filter(o => o.status === 'Cancelado').length,
            today: orders.filter(o => o.date === today).length,
            thisMonth: orders.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate.getMonth() === currentMonth && 
                       orderDate.getFullYear() === currentYear;
            }).length,
            totalValue: orders.reduce((sum, order) => sum + (order.value || 0), 0),
            monthlyValue: orders.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate.getMonth() === currentMonth && 
                       orderDate.getFullYear() === currentYear;
            }).reduce((sum, order) => sum + (order.value || 0), 0)
        };
        
        return stats;
    },

    // Gerar relatório de OS
    generateReport: function(orders, type = 'monthly') {
        const report = {
            type,
            generatedAt: new Date().toISOString(),
            summary: this.getStatistics(orders),
            details: []
        };
        
        if (type === 'monthly') {
            // Agrupar por dia
            const groupedByDay = orders.reduce((groups, order) => {
                const date = order.date;
                if (!groups[date]) groups[date] = [];
                groups[date].push(order);
                return groups;
            }, {});
            
            report.details = Object.entries(groupedByDay).map(([date, dayOrders]) => ({
                date,
                count: dayOrders.length,
                value: dayOrders.reduce((sum, o) => sum + (o.value || 0), 0)
            }));
        }
        
        return report;
    }
};