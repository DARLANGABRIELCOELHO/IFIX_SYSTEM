# 📚 Biblioteca de Utilitários

Coleção de funções auxiliares e utilitários para a aplicação IFIX.

## 📋 Arquivos

### `formatCurrency.js`
- **Propósito**: Formatação consistente de valores monetários
- **Funções**:
  - `formatToBRL(value)`: Formata para Real brasileiro
  - `parseCurrency(string)`: Converte string para número
  - `applyDiscount(price, percentage)`: Aplica desconto
  - `calculateInstallment(total, installments)`: Calcula parcelas
- **Formatos suportados**: R$ 1.234,56, 1234.56, "R$ 1.234,56"

### `validations.js`
- **Propósito**: Validação de dados e inputs
- **Funções**:
  - `validateModel(model)`: Valida modelo de iPhone
  - `validateService(service)`: Valida serviço
  - `validatePrice(price)`: Valida formato de preço
  - `validatePhoneNumber(phone)`: Valida número brasileiro
  - `validateEmail(email)`: Valida formato de email
- **Retornos**: Boolean ou objeto com erro/mensagem

## 🔧 Casos de Uso

### 1. **Formatação Monetária**
```javascript
import { formatToBRL } from './lib/formatCurrency.js';

const price = 1234.56;
console.log(formatToBRL(price)); // "R$ 1.234,56"