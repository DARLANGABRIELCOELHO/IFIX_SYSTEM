A IDEIA E TER UM BANCO DE DADOS SALVO ENTÃO NÃO PODE APAGAR TODA VEZ QUE FECHO O SITE, QUERO EM HTML,CSS, JAVASCRIPT E SQL, PORQUE NÃO SEI OUTRAS TECNOLOGIAS E EU NÃO CONSEGUIRIA IMPLEMENTAR, QUERO QUE VOCÊ ME DEVOLVA UM README.MD 
QUERO ESSA SEGUINTE LOGICA DE DIRETORIOS:
app.js
index.html
modules:
    dashboard.js
    sidebar.js
    Customers.js
    serviceOrders.js
    serviceCatalog.js
    PriceCalculator.js
data:
    Orders_DB
    Price_DB
    Customers_DB
    connection_DB 
    catalog_DB

FUNCIONALIDADES:

app.js 
    Para que serve?
    Lógica de Negócio: Controla o que acontece quando usuário interage
    Manipulação DOM: Altera elementos da página dinamicamente
    Comunicação com APIs: Busca/envia dados para servidores
    Gerenciamento de Estado: Controla dados da aplicação
    Rotas e Navegação: Gerencia diferentes "telas" do sistema


index.html

    Para que serve?
    Ponto de Entrada: O primeiro arquivo que o navegador carrega
    Estrutura Básica: Define os elementos da página (cabeçalho, corpo, rodapé)
    Conexão com Recursos: Carrega CSS, JavaScript, imagens, fontes
    Metadados: Informações para navegadores e mecanismos de busca


modules:
    dashboard:

        Função Principal:
        Painel de controle com métricas gerais da assistência técnica (KPIs e gráficos)
        Detalhamento:
        Exibe 4 KPIs principais: Faturamento Mensal, Serviços Pendentes, Concluídos e Estoque Baixo
        Gráfico de barras de faturamento semanal
        Gráfico de linha de volume de serviços
        Design responsivo com tema escuro
        Possíveis Melhorias:
        Dados Dinâmicos: Conectar com API real em vez de dados estáticos
        Filtros de Período: Adicionar seletor de mês/ano para dados históricos
        Gráficos Interativos: Tooltips mais ricos e zoom em períodos específicos
        Atualização Automática: Polling ou WebSocket para atualização em tempo real
        Exportação de Dados: Botão para exportar relatórios em PDF/Excel
        KPIs Adicionais: Ticket médio, tempo médio de reparo, satisfação do cliente
        Skeleton Loading: Indicadores de carregamento durante fetch de dados

    Customers:

        Função Principal:
        Sistema de CRM (Customer Relationship Management)
        Detalhamento:
        Cadastro completo de clientes com endereço
        Histórico de serviços realizados por cliente
        Cálculo de valor total gasto
        Busca avançada por múltiplos critérios
        Modal de histórico detalhado
        Cards visuais com informações resumidas
        Possíveis Melhorias:
        Segmentação: Tags para classificar clientes (VIP, frequente, etc.)
        Campanhas de Marketing: Sistema de email marketing integrado
        Aniversariantes: Lembretes de aniversário para ações especiais
        Satisfação do Cliente: Sistema de avaliação pós-serviço
        Integração com Redes Sociais: Link com perfis sociais
        Documentos Digitalizados: Upload de RG/CPF/Comprovantes
        Indicações: Sistema de indicação com recompensas
        Frequência de Visitas: Dashboard de retenção de clientes

    serviceOrders :

        Função Principal:
        Sistema completo de gestão de Ordens de Serviço (OS) com checklist técnico
        Detalhamento:
        CRUD completo de ordens de serviço
        Checklist técnico detalhado com 15 itens verificáveis
        Sistema de busca e filtros avançados
        Seleção inteligente de clientes cadastrados
        Autocompletar para modelos e serviços
        Gestão de status e prioridades
        Modal completo para criação/edição
        Possíveis Melhorias:
        Sistema de Uploads: Permitir upload de fotos do aparelho (antes/depois)
        Histórico de Alterações: Log de mudanças em cada OS
        Notificações: Alertas para prazos vencendo ou status alterados
        Integração WhatsApp: Enviar atualizações automaticamente ao cliente
        Etiquetas/QR Code: Gerar etiqueta física para identificação do aparelho
        Orçamento PDF: Gerar proposta/contrato em PDF
        Aprovação do Cliente: Sistema de assinatura digital para autorização
        Controle de Garantia: Registro automático de período de garantia

    Sidebar:

        Função Principal:
        Menu de navegação principal do sistema
        Detalhamento:
        Navegação entre módulos do sistema
        Indicador visual de módulo ativo
        Status online do bot
        Logo e identidade visual da empresa
        Possíveis Melhorias:
        Menu Recolhível: Opção de minimizar para ícones apenas
        Permissões por Perfil: Mostrar apenas módulos permitidos para o usuário
        Atalhos de Teclado: Navegação rápida com teclas (ex: Ctrl+1 para Dashboard)
        Busca no Menu: Pesquisa rápida de funcionalidades
        Favoritos: Permite fixar módulos mais usados no topo
        Notificações Badge: Indicador de itens pendentes em cada módulo
        Modo Offline: Indicar quais funcionalidades estão disponíveis offline

    PriceCalculator:

        Função Principal:
        Consultor de preços e gerador de orçamentos
        Detalhamento:
        Consulta de tabela de preços por modelo e serviço
        Cálculo automático de preço à vista (com desconto)
        Geração de mensagem para WhatsApp com orçamento
        Filtros combinados para busca precisa
        Design de cartões de resultados
        Possíveis Melhorias:
        Cálculo de Peças: Adicionar custo de peças ao orçamento
        Múltiplos Serviços: Permitir combinar vários serviços em um orçamento
        Histórico de Preços: Comparativo de variação de preços ao longo do tempo
        Orçamento PDF: Gerar documento formal para impressão
        Preços Competitivos: Comparar com média do mercado
        Promoções Sazonais: Sistema de cupons/descontos temporários
        Simulação de Parcelamento: Cálculo de parcelas com juros
        Integração com Estoque: Verificar disponibilidade em tempo real


    ServicesCatalog:

        Função Principal:
        Catálogo de serviços e tabela de preços
        Detalhamento:
        CRUD de serviços com modelos associados
        Sistema de preços parcelado/à vista
        Busca e filtragem de serviços
        Formulário de edição com autocompletar
        Cálculo automático de desconto à vista
        Possíveis Melhorias:
        Importação em Massa: Upload de CSV para cadastro rápido
        Categorização: Organizar serviços por categorias (tela, bateria, software, etc.)
        Fotos dos Serviços: Adicionar imagens ilustrativas
        Tempo Médio de Reparo: Informar duração estimada do serviço
        Requisitos Técnicos: Lista de ferramentas/peças necessárias
        Histórico de Alterações: Track de mudanças de preços
        Validade de Preço: Data de revisão dos valores
        Sugestão de Upsell: Serviços complementares sugeridos


