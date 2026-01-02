# 💬 Módulo WhatsApp

Módulo responsável pela geração e gerenciamento de links e mensagens do WhatsApp.

## 🎯 Funcionalidades

### 1. **Geração de Mensagens**
- Mensagens personalizadas por serviço
- Inclusão automática de informações:
  - Modelo do iPhone
  - Serviço solicitado
  - Preço estimado
  - Modalidade de pagamento
- Formatação com emojis e estrutura clara

### 2. **Agendamento Inteligente**
- Sugestão de horários
- Informações sobre procedimentos
- Instruções de preparação

### 3. **Geração de Links**
- Links diretos para WhatsApp
- Número pré-configurado (5515991630531)
- Mensagens pré-preenchidas e codificadas
- Suporte a parâmetros personalizados

## 🔧 Arquivos do Módulo

### `generateLink.js`
- **Função Principal**: `generateWhatsAppLink()`
- **Parâmetros**:
  - `model`: Modelo do iPhone
  - `service`: Serviço desejado
  - `payment`: Modalidade de pagamento
  - `price`: Preço estimado
- **Retorno**: URL completa para o WhatsApp

### `index.js`
- **Classe**: `WhatsAppScheduler`
- **Métodos**:
  - `initialize(app)`: Configuração inicial
  - `generateAdvancedMessage()`: Cria mensagem detalhada
  - `openChat()`: Abre conversa no WhatsApp

## 📋 Template de Mensagem

A mensagem gerada inclui:
IFIX - Agendamento de Serviço 📱

📋 Informações do Serviço:
• Modelo: [MODELO]
• Serviço: [SERVIÇO]
• Pagamento: [MODALIDADE]
• Valor Estimado: [PREÇO]

⚙️ Detalhes Técnicos:

Diagnóstico completo gratuito

Garantia de 90 dias

Peças originais ou equivalentes

Tempo médio: 1-3 horas úteis

📅 Para Agendar:

Confirme disponibilidade

Faça backup dos dados

Traga o iPhone sem senha

Horário preferencial: ________

📍 Localização: Sorocaba - SP
⏰ Horário: Seg-Sex, 9h às 18h


## 🔒 Segurança
- Validação de dados antes do envio
- Codificação URL segura
- Proteção contra injeção de código

## 🔗 Integrações
- Integrado com `modules/searchPrice`
- Conectado ao sistema de favoritos
- Compatível com exportação de dados