// ai-service.js - Serviço de integração com IA Gemini

const AIService = {
    // Esta é uma chave de exemplo. Em produção, use uma chave válida
    // ou implemente um backend proxy para maior segurança
    apiKey: 'SUA_CHAVE_API_AQUI', // Substitua por sua chave real
    
    async getMaintenanceTips(model, service) {
        // Se não tiver chave de API, retorne dicas genéricas
        if (!this.apiKey || this.apiKey === 'SUA_CHAVE_API_AQUI') {
            return this.getGenericTips(model, service);
        }
        
        try {
            const formattedModel = model.replace('IPHONE ', 'iPhone ');
            const formattedService = this.formatServiceName(service);
            
            const prompt = `Forneça 3 dicas técnicas de manutenção para um ${formattedModel} que precisa de ${formattedService}. 
            
Requisitos:
1. Cada dica deve ser prática e acionável
2. Use português do Brasil com linguagem acessível
3. Inclua emojis relevantes no início de cada dica
4. Seja conciso (máximo 1 linha por dica)
5. Foque em prevenção, cuidados e boas práticas

Formato de resposta:
🔧 Dica 1 sobre manutenção preventiva
💡 Dica 2 sobre cuidados específicos
⚡ Dica 3 sobre otimização de performance`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 150
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Falha na requisição para a IA');
            }

            const data = await response.json();
            const text = data.candidates[0].content.parts[0].text;
            
            // Processar resposta e extrair as 3 dicas
            return this.extractTipsFromResponse(text);
            
        } catch (error) {
            console.error('Erro ao buscar dicas de IA:', error);
            return this.getGenericTips(model, service);
        }
    },
    
    extractTipsFromResponse(text) {
        // Extrair as dicas da resposta da IA
        const lines = text.split('\n').filter(line => line.trim());
        const tips = [];
        
        // Procurar por linhas que começam com emojis
        lines.forEach(line => {
            const trimmed = line.trim();
            // Verifica se a linha começa com um emoji comum
            if (/^[🔧💡⚡✨🛠️🔋📱✅⚠️]/.test(trimmed)) {
                tips.push(trimmed);
            }
        });
        
        // Se não encontrou dicas com emojis, use as primeiras 3 linhas
        if (tips.length === 0) {
            return lines.slice(0, 3).map(line => `✨ ${line.trim()}`);
        }
        
        return tips.slice(0, 3);
    },
    
    getGenericTips(model, service) {
        const serviceName = this.formatServiceName(service);
        
        const tipsDatabase = {
            "TROCA DE TELA": [
                "🔧 Use película protetora de qualidade para prevenir novos danos",
                "💡 Evite colocar o telefone no mesmo bolso que chaves ou moedas",
                "⚡ Configure o bloqueio automático de tela para economizar bateria"
            ],
            "TROCA DE BATERIA": [
                "🔧 Evite carregar o telefone acima de 80% regularmente",
                "💡 Use apenas carregadores originais ou certificados MFi",
                "⚡ Ative o modo de baixo consumo quando a bateria estiver fraca"
            ],
            "VIDRO TRASEIRO": [
                "🔧 Use uma capa protetora resistente para proteger o vidro",
                "💡 Evite colocar o telefone em superfícies irregulares",
                "⚡ Limpe regularmente com pano macio para evitar arranhões"
            ],
            "FACE ID": [
                "🔧 Mantenha o sensor de Face ID limpo e sem obstruções",
                "💡 Adicione uma aparência alternativa com óculos ou acessórios",
                "⚡ Reconfigure o Face ID se houver mudanças significativas na aparência"
            ],
            "CONECTOR DE CARGA": [
                "🔧 Evite puxar o cabo pelo fio ao desconectar",
                "💡 Mantenha o conector limpo e livre de poeira",
                "⚡ Use apenas cabos certificados para evitar danos no conector"
            ]
        };
        
        return tipsDatabase[service] || [
            "🔧 Realize manutenção preventiva regularmente",
            "💡 Use apenas acessórios originais ou certificados",
            "⚡ Mantenha o dispositivo atualizado e limpo"
        ];
    },
    
    formatServiceName(service) {
        const serviceNames = {
            "TROCA DE TELA": "troca de tela",
            "TROCA DE BATERIA": "troca de bateria", 
            "VIDRO TRASEIRO": "reparo do vidro traseiro",
            "FACE ID": "reparo do Face ID",
            "CONECTOR DE CARGA": "troca do conector de carga"
        };
        return serviceNames[service] || service.toLowerCase();
    }
};

// Exportar para uso global
window.AIService = AIService;