# 🔍 Módulo de Busca de Preços

Módulo responsável por toda a lógica de busca, filtragem e exibição de preços.

## 🎯 Funcionalidades Principais

### 1. **Busca Inteligente**
- Busca por modelo com autocomplete
- Filtragem por serviço específico
- Suporte a múltiplos critérios de busca

### 2. **Sistema de Pagamento**
- Duas modalidades: Parcelado e À Vista (-10%)
- Cálculo automático de descontos
- Persistência da escolha do usuário

### 3. **Múltiplas Visualizações**
- **Modo Cards**: Visualização amigável com cards
- **Modo Tabela**: Visão completa comparativa
- Alternância dinâmica entre modos

### 4. **Gerenciamento de Favoritos**
- Sistema de favoritos com localStorage
- Contador em tempo real
- Lista de favoritos organizada

### 5. **Ordenação e Filtros**
- Ordenação por modelo (A-Z, Z-A)
- Filtro por disponibilidade
- Contagem de resultados

## 🔧 Arquivos do Módulo

### `logic.js`
- **Lógica de Busca**: Algoritmos de filtragem e pesquisa
- **Cálculos**: Processamento de preços e descontos
- **Validações**: Verificação de dados e inputs

### `index.js`
- **Interface Principal**: Exportação da classe `RepairPriceAppEnhanced`
- **Inicialização**: Configuração inicial do módulo
- **Integração**: Conexão com outros módulos

## 🚀 Fluxo de Trabalho
1. Usuário seleciona modelo e serviço
2. Sistema valida combinação
3. Busca no banco de dados de preços
4. Aplica modalidade de pagamento selecionada
5. Retorna resultados formatados
6. Atualiza interface conforme modo de visualização

## 🔗 Dependências
- `data/prices.js` - Para dados de preços
- `lib/formatCurrency.js` - Para formatação monetária
- `lib/validations.js` - Para validação de inputs