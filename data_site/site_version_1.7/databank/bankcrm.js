// databank/bankcrm.js

// Templates e dados para CRM
export const clientTemplates = {
    documentTypes: [
        { id: 'cpf', name: 'CPF', mask: '999.999.999-99' },
        { id: 'cnpj', name: 'CNPJ', mask: '99.999.999/9999-99' },
        { id: 'rg', name: 'RG', mask: '99.999.999-9' }
    ],

    clientCategories: [
        { id: 'regular', name: 'Cliente Regular', color: '#4CAF50' },
        { id: 'premium', name: 'Cliente Premium', color: '#2196F3' },
        { id: 'vip', name: 'Cliente VIP', color: '#9C27B0' },
        { id: 'corporate', name: 'Cliente Corporativo', color: '#FF9800' },
        { id: 'inactive', name: 'Inativo', color: '#9E9E9E' }
    ],

    phoneTypes: [
        { id: 'mobile', name: 'Celular', icon: 'mobile-alt' },
        { id: 'whatsapp', name: 'WhatsApp', icon: 'whatsapp' },
        { id: 'home', name: 'Residencial', icon: 'phone' },
        { id: 'work', name: 'Trabalho', icon: 'briefcase' }
    ],

    addressFields: [
        { id: 'cep', name: 'CEP', required: true, mask: '99999-999' },
        { id: 'street', name: 'Rua', required: true },
        { id: 'number', name: 'Número', required: true },
        { id: 'complement', name: 'Complemento', required: false },
        { id: 'neighborhood', name: 'Bairro', required: true },
        { id: 'city', name: 'Cidade', required: true },
        { id: 'state', name: 'Estado', required: true },
        { id: 'reference', name: 'Ponto de Referência', required: false }
    ],

    states: [
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
        'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
        'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ],

    generateClientCode: function() {
        const prefix = 'CLI';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    },

    calculateClientValue: function(orders) {
        if (!orders || orders.length === 0) return 0;
        
        const totalSpent = orders.reduce((sum, order) => sum + (order.value || 0), 0);
        const orderCount = orders.length;
        const avgOrderValue = totalSpent / orderCount;
        
        return {
            totalSpent,
            orderCount,
            avgOrderValue,
            lastOrder: orders[orders.length - 1]?.date,
            lifetimeValue: totalSpent
        };
    },

    getClientCategory: function(clientData) {
        const { totalSpent, orderCount, lastOrder } = clientData;
        const lastOrderDate = lastOrder ? new Date(lastOrder) : null;
        const now = new Date();
        const monthsSinceLastOrder = lastOrderDate ? 
            (now.getFullYear() - lastOrderDate.getFullYear()) * 12 + 
            (now.getMonth() - lastOrderDate.getMonth()) : 999;
        
        if (monthsSinceLastOrder > 12) return 'inactive';
        if (totalSpent > 5000 || orderCount > 10) return 'vip';
        if (totalSpent > 2000 || orderCount > 5) return 'premium';
        if (totalSpent > 0) return 'regular';
        return 'new';
    }
};

// Funções para gerenciamento de clientes
export const clientManager = {
    // Validar CPF
    validateCPF: function(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        
        if (cpf.length !== 11 || 
            cpf === "00000000000" || 
            cpf === "11111111111" || 
            cpf === "22222222222" || 
            cpf === "33333333333" || 
            cpf === "44444444444" || 
            cpf === "55555555555" || 
            cpf === "66666666666" || 
            cpf === "77777777777" || 
            cpf === "88888888888" || 
            cpf === "99999999999")
            return false;
        
        let add = 0;
        for (let i = 0; i < 9; i++)
            add += parseInt(cpf.charAt(i)) * (10 - i);
        let rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(9)))
            return false;
        
        add = 0;
        for (let i = 0; i < 10; i++)
            add += parseInt(cpf.charAt(i)) * (11 - i);
        rev = 11 - (add % 11);
        if (rev === 10 || rev === 11)
            rev = 0;
        if (rev !== parseInt(cpf.charAt(10)))
            return false;
        
        return true;
    },

    // Validar CNPJ
    validateCNPJ: function(cnpj) {
        cnpj = cnpj.replace(/[^\d]+/g, '');
        
        if (cnpj.length !== 14)
            return false;
        
        // Elimina CNPJs invalidos conhecidos
        if (cnpj === "00000000000000" || 
            cnpj === "11111111111111" || 
            cnpj === "22222222222222" || 
            cnpj === "33333333333333" || 
            cnpj === "44444444444444" || 
            cnpj === "55555555555555" || 
            cnpj === "66666666666666" || 
            cnpj === "77777777777777" || 
            cnpj === "88888888888888" || 
            cnpj === "99999999999999")
            return false;
        
        // Valida DVs
        let tamanho = cnpj.length - 2;
        let numeros = cnpj.substring(0, tamanho);
        let digitos = cnpj.substring(tamanho);
        let soma = 0;
        let pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        
        let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(0))
            return false;
        
        tamanho = tamanho + 1;
        numeros = cnpj.substring(0, tamanho);
        soma = 0;
        pos = tamanho - 7;
        
        for (let i = tamanho; i >= 1; i--) {
            soma += numeros.charAt(tamanho - i) * pos--;
            if (pos < 2)
                pos = 9;
        }
        
        resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
        if (resultado != digitos.charAt(1))
            return false;
        
        return true;
    },

    // Formatar telefone
    formatPhone: function(phone) {
        phone = phone.replace(/\D/g, '');
        
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (phone.length === 10) {
            return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    },

    // Buscar endereço por CEP (simulado)
    searchAddressByCEP: async function(cep) {
        cep = cep.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            throw new Error('CEP inválido');
        }
        
        // Em um sistema real, aqui seria uma chamada à API dos Correios
        // Por enquanto, retornamos dados simulados
        const mockAddresses = {
            '18270000': {
                street: 'Rua Exemplo',
                neighborhood: 'Centro',
                city: 'Boituva',
                state: 'SP'
            },
            '18270100': {
                street: 'Avenida Principal',
                neighborhood: 'Jardim das Flores',
                city: 'Boituva',
                state: 'SP'
            }
        };
        
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(mockAddresses[cep] || {
                    street: '',
                    neighborhood: '',
                    city: 'Boituva',
                    state: 'SP'
                });
            }, 500);
        });
    },

    // Calcular idade
    calculateAge: function(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    },

    // Gerar relatório de clientes
    generateClientReport: function(clients, orders) {
        const report = {
            totalClients: clients.length,
            activeClients: clients.filter(c => {
                const clientOrders = orders.filter(o => o.clientId === c.id);
                const lastOrder = clientOrders[clientOrders.length - 1];
                if (!lastOrder) return false;
                
                const lastOrderDate = new Date(lastOrder.date);
                const now = new Date();
                const monthsSinceLastOrder = (now.getFullYear() - lastOrderDate.getFullYear()) * 12 + 
                                            (now.getMonth() - lastOrderDate.getMonth());
                
                return monthsSinceLastOrder <= 6;
            }).length,
            newClientsThisMonth: clients.filter(c => {
                const registrationDate = new Date(c.registrationDate);
                const now = new Date();
                return registrationDate.getMonth() === now.getMonth() && 
                       registrationDate.getFullYear() === now.getFullYear();
            }).length,
            topSpenders: clients
                .map(client => {
                    const clientOrders = orders.filter(o => o.clientId === client.id);
                    const totalSpent = clientOrders.reduce((sum, order) => sum + (order.value || 0), 0);
                    return {
                        ...client,
                        totalSpent,
                        orderCount: clientOrders.length
                    };
                })
                .sort((a, b) => b.totalSpent - a.totalSpent)
                .slice(0, 10),
            clientCategories: clients.map(client => {
                const clientOrders = orders.filter(o => o.clientId === client.id);
                const clientData = clientTemplates.calculateClientValue(clientOrders);
                return {
                    clientId: client.id,
                    clientName: client.name,
                    category: clientTemplates.getClientCategory(clientData),
                    ...clientData
                };
            })
        };
        
        return report;
    }
};

// Templates para emails e mensagens
export const communicationTemplates = {
    welcomeEmail: {
        subject: 'Bem-vindo à iFix Boituva!',
        body: `Olá {cliente_nome},

Seja muito bem-vindo à iFix Boituva!

Agradecemos por escolher nossos serviços para cuidar do seu aparelho. Estamos aqui para oferecer o melhor suporte técnico com qualidade e agilidade.

📱 **Seus Dados de Cadastro:**
- Cliente: {cliente_codigo}
- Data de Cadastro: {data_cadastro}

💡 **Como podemos ajudá-lo:**
- Reparo de smartphones e tablets
- Troca de telas e baterias
- Assistência técnica especializada
- E muito mais!

📞 **Contato:**
WhatsApp: (15) 99999-9999
E-mail: contato@ifixboituva.com.br
Endereço: Rua Exemplo, 123 - Centro, Boituva/SP

Atenciosamente,
Equipe iFix Boituva`
    },

    serviceCompleteSMS: {
        body: `Olá {cliente_nome}, sua OS #{protocolo} está pronta para retirada! Equipamento: {equipamento}. Valor: R$ {valor_total}. iFix Boituva`
    },

    paymentReminder: {
        subject: 'Lembrete de Pagamento - OS #{protocolo}',
        body: `Olá {cliente_nome},

Este é um lembrete amigável sobre o pagamento da sua Ordem de Serviço #{protocolo}.

📋 **Detalhes do Serviço:**
- Equipamento: {equipamento}
- Serviços realizados: {servicos}
- Valor Total: R$ {valor_total}
- Data de Entrega: {data_entrega}

💰 **Formas de Pagamento:**
- Dinheiro
- Cartão de crédito/débito
- PIX: {chave_pix}
- Transferência bancária

Por favor, entre em contato conosco para confirmar o pagamento ou se tiver alguma dúvida.

Atenciosamente,
Equipe iFix Boituva`
    }
};