// databank/bankcrm.js - Banco de dados de CRM
window.crmData = {
    clients: [],
    
    addClient(client) {
        client.id = this.generateId();
        client.createdAt = new Date().toISOString();
        client.updatedAt = new Date().toISOString();
        client.totalSpent = client.totalSpent || 0;
        client.maintenanceHistory = client.maintenanceHistory || [];
        this.clients.unshift(client);
        this.saveToStorage();
        return client;
    },
    
    updateClient(id, updates) {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...updates, updatedAt: new Date().toISOString() };
            this.saveToStorage();
            return this.clients[index];
        }
        return null;
    },
    
    getClients(search = '') {
        if (!search) return [...this.clients];
        
        const searchLower = search.toLowerCase();
        return this.clients.filter(client =>
            client.name?.toLowerCase().includes(searchLower) ||
            client.document?.includes(search) ||
            client.phone?.includes(search) ||
            client.email?.toLowerCase().includes(searchLower)
        );
    },
    
    addMaintenanceToClient(clientId, maintenance) {
        const client = this.clients.find(c => c.id === clientId);
        if (client) {
            maintenance.id = this.generateId();
            maintenance.date = new Date().toISOString();
            client.maintenanceHistory.unshift(maintenance);
            client.totalSpent = (client.totalSpent || 0) + (maintenance.value || 0);
            this.saveToStorage();
        }
    },
    
    generateId() {
        return 'CLI-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    },
    
    saveToStorage() {
        localStorage.setItem('ifix_clients', JSON.stringify(this.clients));
    },
    
    loadFromStorage() {
        const saved = localStorage.getItem('ifix_clients');
        if (saved) {
            this.clients = JSON.parse(saved);
        }
    }
};

// Carregar dados do localStorage
crmData.loadFromStorage();