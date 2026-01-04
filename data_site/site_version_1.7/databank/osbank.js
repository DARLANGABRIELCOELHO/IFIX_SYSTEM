// databank/osbank.js - Banco de dados de Ordens de Serviço
window.osData = {
    orders: [],
    statusOptions: [
        { id: 1, name: 'Aguardando análise', color: 'warning' },
        { id: 2, name: 'Em análise', color: 'info' },
        { id: 3, name: 'Aguardando aprovação', color: 'warning' },
        { id: 4, name: 'Em manutenção', color: 'orange' },
        { id: 5, name: 'Pronto', color: 'success' },
        { id: 6, name: 'Entregue', color: 'gray' }
    ],
    
    addOrder(order) {
        order.id = this.generateId();
        order.createdAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        this.orders.unshift(order);
        this.saveToStorage();
        return order;
    },
    
    updateOrder(id, updates) {
        const index = this.orders.findIndex(order => order.id === id);
        if (index !== -1) {
            this.orders[index] = { ...this.orders[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveToStorage();
            return this.orders[index];
        }
        return null;
    },
    
    getOrders(filter = {}) {
        let filtered = [...this.orders];
        
        if (filter.status) {
            filtered = filtered.filter(order => order.status === filter.status);
        }
        
        if (filter.search) {
            const searchLower = filter.search.toLowerCase();
            filtered = filtered.filter(order => 
                order.clientName?.toLowerCase().includes(searchLower) ||
                order.clientPhone?.includes(filter.search) ||
                order.clientDocument?.includes(filter.search) ||
                order.protocol?.includes(filter.search)
            );
        }
        
        return filtered;
    },
    
    generateId() {
        return 'OS-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    saveToStorage() {
        localStorage.setItem('ifix_orders', JSON.stringify(this.orders));
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('ifix_orders');
        if (saved) {
            this.orders = JSON.parse(saved);
        }
    }
};

// Carregar dados do localStorage
osData.loadFromStorage();