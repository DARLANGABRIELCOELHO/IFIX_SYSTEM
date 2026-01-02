# 🧩 Componentes da Aplicação

Este diretório contém todos os componentes reutilizáveis da aplicação IFIX.

## 📋 Lista de Componentes

### `Header/`
- **Propósito**: Cabeçalho principal da aplicação
- **Funcionalidades**:
  - Logo e título da IFIX
  - Botão de alternância de tema
  - Contador de favoritos
  - Ícones de navegação
- **Estado**: Gerencia tema e contador de favoritos

### `Footer/`
- **Propósito**: Rodapé informativo
- **Conteúdo**:
  - Informações de garantia
  - Lista de serviços
  - Horários de funcionamento
  - Contato e localização
- **Estático**: Sem estado, apenas informações

### `ServiceCard/`
- **Propósito**: Card individual de serviço
- **Dados exibidos**:
  - Modelo do iPhone
  - Tipo de serviço
  - Preço (parcelado/à vista)
  - Botão de favorito
  - Ações (agendar, comparar)
- **Estado**: Status de favorito, dados do serviço

### `PriceTable/`
- **Propósito**: Tabela comparativa de preços
- **Funcionalidades**:
  - Exibição completa de modelos vs serviços
  - Ordenação por modelo
  - Destaque de valores
  - Modalidade dupla (parcelado/à vista)
- **Estado**: Ordenação, modo de exibição

### `WhatsAppButton/`
- **Propósito**: Botão de ação para WhatsApp
- **Funcionalidades**:
  - Geração dinâmica de mensagem
  - Abertura em nova aba
  - Estado de loading
  - Feedback visual
- **Estado**: Status de envio, dados do agendamento

## 🎨 Estilização
- Todos os componentes usam Tailwind CSS
- Classes utilitárias para responsividade
- Animações e transições consistentes
- Design system unificado

## 🔄 Reutilização
Cada componente é:
- **Independente**: Funciona isoladamente
- **Parametrizável**: Recebe props/configurações
- **Consistente**: Segue padrões de design
- **Documentado**: Com exemplos de uso

## 🚀 Como Usar
1. Importe o componente desejado
2. Passe as props necessárias
3. Integre com os módulos correspondentes
4. Customize conforme necessidade