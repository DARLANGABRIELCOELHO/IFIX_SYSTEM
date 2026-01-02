# 📊 Módulo de Dados

Este diretório contém todos os dados e configurações da aplicação IFIX.

## 📋 Arquivos

### `models.js`
- **Descrição**: Contém a lista completa de modelos de iPhone suportados pelo sistema
- **Formato**: Array de strings com os nomes dos modelos
- **Escopo**: De iPhone 6 até iPhone 15 Pro Max
- **Uso**: Usado para popular dropdowns e validações

### `services.js`
- **Descrição**: Lista de serviços de reparo oferecidos
- **Serviços incluídos**:
  - TROCA DE TELA
  - TROCA DE BATERIA
  - VIDRO TRASEIRO
  - FACE ID
  - CONECTOR DE CARGA
- **Uso**: Base para cálculos e exibição de opções

### `prices.js`
- **Descrição**: Banco de dados principal de preços
- **Estrutura**: Objeto complexo organizado por:
  1. Modelo do iPhone
  2. Tipo de serviço
  3. Modalidade de pagamento (parcelado/à vista)
- **Formato de preços**: Strings formatadas em Reais (R$)
- **Valores especiais**: "N/A" para serviços não disponíveis

## 🔄 Atualização
Para atualizar preços ou adicionar novos modelos:
1. Edite o arquivo correspondente
2. Mantenha o formato consistente
3. Teste a validação com o módulo `validations.js`