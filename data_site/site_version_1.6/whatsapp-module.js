// whatsapp-module.js - Módulo melhorado de WhatsApp

const WhatsAppScheduler = {
    initialize(app) {
        this.app = app;
        
        // Substituir o botão existente pela nova funcionalidade
        // (já integrada no app-enhanced.js)
        console.log('Módulo WhatsApp integrado ao sistema premium');
    },
    
    generateAdvancedMessage(selectionInfo, repairApp) {
        const model = selectionInfo.model;
        const service = selectionInfo.service;
        const payment = selectionInfo.payment;
        
        const priceData = repairApp.prices[selectionInfo.rawModel]?.[selectionInfo.rawService];
        const price = priceData ? priceData[selectionInfo.paymentKey === 'A VISTA' ? 'avista' : 'parcelado'] : "A consultar";
        
        const serviceNames = {
            "TROCA DE TELA": "Troca de Tela",
            "TROCA DE BATERIA": "Troca de Bateria",
            "VIDRO TRASEIRO": "Vidro Traseiro", 
            "FACE ID": "Reparo do Face ID",
            "CONECTOR DE CARGA": "Conector de Carga"
        };
        
        return `*IFIX - Agendamento de Serviço* 📱

📋 *Informações do Serviço:*
• *Modelo:* ${model}
• *Serviço:* ${serviceNames[selectionInfo.rawService] || selectionInfo.service}
• *Pagamento:* ${payment}
• *Valor Estimado:* ${price}

⚙️ *Detalhes Técnicos:*
- Diagnóstico completo gratuito
- Garantia de 90 dias em peças e mão de obra
- Peças originais ou equivalentes de qualidade
- Tempo médio de reparo: 1-3 horas úteis

📅 *Para Agendar:*
1. Confirme disponibilidade para entrega
2. Faça backup dos seus dados
3. Traga o iPhone sem senha para diagnóstico
4. Horário preferencial: ________

📍 *Localização:* Sorocaba - SP
⏰ *Horário:* Segunda a Sexta, 9h às 18h

*Observações:* 
- Valor sujeito a confirmação após diagnóstico
- Orçamento válido por 7 dias
- Aceitamos todas as bandeiras de cartão

✅ *Pronto para agendar?* Responda com sua disponibilidade!`;
    }
};

window.WhatsAppScheduler = WhatsAppScheduler;