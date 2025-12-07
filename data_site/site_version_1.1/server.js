const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

// Conectar ao banco de dados
const db = new sqlite3.Database('./repair.db');

// Middleware para permitir CORS (para o front-end poder acessar)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.json());

// Rota para obter a lista de modelos
app.get('/api/models', (req, res) => {
    db.all('SELECT DISTINCT modelo FROM repair_prices ORDER BY modelo', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.map(row => row.modelo));
    });
});

// Rota para obter a lista de serviços (fixa, pois são as colunas)
app.get('/api/services', (req, res) => {
    const services = [
        "TROCA DE TELA",
        "TROCA DE BATERIA",
        "VIDRO TRASEIRO",
        "FACE ID",
        "CONECTOR DE CARGA"
    ];
    res.json(services);
});

// Rota para buscar preços com filtros
app.get('/api/prices', (req, res) => {
    const { model, service, payment } = req.query;

    let query = 'SELECT * FROM repair_prices';
    const conditions = [];
    const params = [];

    if (model) {
        conditions.push('modelo = ?');
        params.push(model);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Se não houver serviço especificado, retorna todos os dados
        if (!service) {
            res.json(rows);
            return;
        }

        // Mapeamento de serviços para colunas
        const serviceColumns = {
            "TROCA DE TELA": { parcelado: 'trocaTelaParcelado', avista: 'trocaTelaAvista' },
            "TROCA DE BATERIA": { parcelado: 'trocaBateriaParcelado', avista: 'trocaBateriaAvista' },
            "VIDRO TRASEIRO": { parcelado: 'vidroTraseiroParcelado', avista: 'vidroTraseiroAvista' },
            "FACE ID": { parcelado: 'faceIdParcelado', avista: 'faceIdAvista' },
            "CONECTOR DE CARGA": { parcelado: 'conectorCargaParcelado', avista: 'conectorCargaAvista' }
        };

        const column = serviceColumns[service];
        if (!column) {
            res.status(400).json({ error: 'Serviço inválido' });
            return;
        }

        const paymentColumn = payment === 'A VISTA' ? column.avista : column.parcelado;

        // Filtra os resultados para incluir apenas os que têm preço para o serviço e pagamento selecionados
        const filteredRows = rows.map(row => {
            return {
                modelo: row.modelo,
                preco: row[paymentColumn],
                servico: service,
                pagamento: payment
            };
        }).filter(row => row.preco && row.preco !== '*' && row.preco !== '#VALOR!');

        res.json(filteredRows);
    });
});

app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
// Adicionar após as rotas da API no server.js
app.use(express.static('public'));