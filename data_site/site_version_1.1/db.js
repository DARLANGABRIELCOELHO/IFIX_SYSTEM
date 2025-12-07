const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./repair.db');

// Dados extraídos do primeiro arquivo
const repairData = [
    {modelo: "IPHONE 6", trocaTelaParcelado: "R$ 220,00", trocaTelaAvista: "R$ 204,60", trocaBateriaParcelado: "R$ 150,00", trocaBateriaAvista: "R$ 139,50", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 6S", trocaTelaParcelado: "R$ 220,00", trocaTelaAvista: "R$ 204,60", trocaBateriaParcelado: "R$ 150,00", trocaBateriaAvista: "R$ 139,50", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 6S PLUS", trocaTelaParcelado: "R$ 230,00", trocaTelaAvista: "R$ 213,90", trocaBateriaParcelado: "R$ 180,00", trocaBateriaAvista: "R$ 167,40", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 7", trocaTelaParcelado: "R$ 230,00", trocaTelaAvista: "R$ 213,90", trocaBateriaParcelado: "R$ 180,00", trocaBateriaAvista: "R$ 167,40", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 7 PLUS", trocaTelaParcelado: "R$ 280,00", trocaTelaAvista: "R$ 260,40", trocaBateriaParcelado: "R$ 200,00", trocaBateriaAvista: "R$ 186,00", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 8", trocaTelaParcelado: "R$ 280,00", trocaTelaAvista: "R$ 260,40", trocaBateriaParcelado: "R$ 200,00", trocaBateriaAvista: "R$ 186,00", vidroTraseiroParcelado: "R$ 250,00", vidroTraseiroAvista: "R$ 232,50", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 8 PLUS", trocaTelaParcelado: "R$ 280,00", trocaTelaAvista: "R$ 260,40", trocaBateriaParcelado: "R$ 230,00", trocaBateriaAvista: "R$ 213,90", vidroTraseiroParcelado: "R$ 280,00", vidroTraseiroAvista: "R$ 260,40", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE X", trocaTelaParcelado: "R$ 480,00", trocaTelaAvista: "R$ 446,40", trocaBateriaParcelado: "R$ 230,00", trocaBateriaAvista: "R$ 213,90", vidroTraseiroParcelado: "R$ 300,00", vidroTraseiroAvista: "R$ 279,00", faceIdParcelado: "R$ 450,00", faceIdAvista: "R$ 430,00", conectorCargaParcelado: "R$ 450,00", conectorCargaAvista: "R$ 430,00"},
    {modelo: "IPHONE XS", trocaTelaParcelado: "R$ 450,00", trocaTelaAvista: "R$ 418,50", trocaBateriaParcelado: "R$ 230,00", trocaBateriaAvista: "R$ 213,90", vidroTraseiroParcelado: "R$ 300,00", vidroTraseiroAvista: "R$ 279,00", faceIdParcelado: "R$ 450,00", faceIdAvista: "R$ 430,00", conectorCargaParcelado: "R$ 450,00", conectorCargaAvista: "R$ 430,00"},
    {modelo: "IPHONE XS MAX", trocaTelaParcelado: "R$ 600,00", trocaTelaAvista: "R$ 558,00", trocaBateriaParcelado: "R$ 300,00", trocaBateriaAvista: "R$ 279,00", vidroTraseiroParcelado: "R$ 380,00", vidroTraseiroAvista: "R$ 353,40", faceIdParcelado: "R$ 450,00", faceIdAvista: "R$ 430,00", conectorCargaParcelado: "R$ 450,00", conectorCargaAvista: "R$ 430,00"},
    {modelo: "IPHONE XR", trocaTelaParcelado: "R$ 380,00", trocaTelaAvista: "R$ 353,40", trocaBateriaParcelado: "R$ 250,00", trocaBateriaAvista: "R$ 232,50", vidroTraseiroParcelado: "R$ 300,00", vidroTraseiroAvista: "R$ 279,00", faceIdParcelado: "R$ 450,00", faceIdAvista: "R$ 430,00", conectorCargaParcelado: "R$ 450,00", conectorCargaAvista: "R$ 430,00"},
    {modelo: "IPHONE 11", trocaTelaParcelado: "R$ 330,00", trocaTelaAvista: "R$ 306,90", trocaBateriaParcelado: "R$ 250,00", trocaBateriaAvista: "R$ 232,50", vidroTraseiroParcelado: "R$ 350,00", vidroTraseiroAvista: "R$ 325,50", faceIdParcelado: "R$ 480,00", faceIdAvista: "R$ 450,00", conectorCargaParcelado: "R$ 480,00", conectorCargaAvista: "R$ 450,00"},
    {modelo: "IPHONE 11 PRO", trocaTelaParcelado: "R$ 550,00", trocaTelaAvista: "R$ 511,50", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 380,00", vidroTraseiroAvista: "R$ 353,40", faceIdParcelado: "R$ 480,00", faceIdAvista: "R$ 450,00", conectorCargaParcelado: "R$ 480,00", conectorCargaAvista: "R$ 450,00"},
    {modelo: "IPHONE 11 PRO MAX", trocaTelaParcelado: "R$ 600,00", trocaTelaAvista: "R$ 558,00", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 400,00", vidroTraseiroAvista: "R$ 372,00", faceIdParcelado: "R$ 480,00", faceIdAvista: "R$ 450,00", conectorCargaParcelado: "R$ 480,00", conectorCargaAvista: "R$ 450,00"},
    {modelo: "IPHONE 12", trocaTelaParcelado: "R$ 850,00", trocaTelaAvista: "R$ 790,50", trocaBateriaParcelado: "R$ 600,00", trocaBateriaAvista: "R$ 558,00", vidroTraseiroParcelado: "R$ 450,00", vidroTraseiroAvista: "R$ 418,50", faceIdParcelado: "R$ 550,00", faceIdAvista: "R$ 530,00", conectorCargaParcelado: "R$ 550,00", conectorCargaAvista: "R$ 530,00"},
    {modelo: "IPHONE 12 PRO", trocaTelaParcelado: "R$ 850,00", trocaTelaAvista: "R$ 790,50", trocaBateriaParcelado: "R$ 600,00", trocaBateriaAvista: "R$ 558,00", vidroTraseiroParcelado: "R$ 450,00", vidroTraseiroAvista: "R$ 418,50", faceIdParcelado: "R$ 550,00", faceIdAvista: "R$ 530,00", conectorCargaParcelado: "R$ 550,00", conectorCargaAvista: "R$ 530,00"},
    {modelo: "IPHONE 12 PRO MAX", trocaTelaParcelado: "R$ 950,00", trocaTelaAvista: "R$ 883,50", trocaBateriaParcelado: "R$ 400,00", trocaBateriaAvista: "R$ 372,00", vidroTraseiroParcelado: "R$ 580,00", vidroTraseiroAvista: "R$ 539,40", faceIdParcelado: "R$ 580,00", faceIdAvista: "R$ 550,00", conectorCargaParcelado: "R$ 580,00", conectorCargaAvista: "R$ 550,00"},
    {modelo: "IPHONE 13", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 500,00", vidroTraseiroAvista: "R$ 465,00", faceIdParcelado: "R$ 700,00", faceIdAvista: "R$ 680,00", conectorCargaParcelado: "R$ 700,00", conectorCargaAvista: "R$ 680,00"},
    {modelo: "IPHONE 13 PRO", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 550,00", vidroTraseiroAvista: "R$ 511,50", faceIdParcelado: "R$ 750,00", faceIdAvista: "R$ 730,00", conectorCargaParcelado: "R$ 750,00", conectorCargaAvista: "R$ 730,00"},
    {modelo: "IPHONE 13 PRO MAX", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 580,00", vidroTraseiroAvista: "R$ 539,40", faceIdParcelado: "R$ 750,00", faceIdAvista: "R$ 730,00", conectorCargaParcelado: "R$ 750,00", conectorCargaAvista: "R$ 730,00"},
    {modelo: "IPHONE 14", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 580,00", vidroTraseiroAvista: "R$ 539,40", faceIdParcelado: "R$ 750,00", faceIdAvista: "R$ 730,00", conectorCargaParcelado: "R$ 750,00", conectorCargaAvista: "R$ 730,00"},
    {modelo: "IPHONE 14 PRO", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 630,00", vidroTraseiroAvista: "R$ 585,90", faceIdParcelado: "R$ 850,00", faceIdAvista: "R$ 830,00", conectorCargaParcelado: "R$ 850,00", conectorCargaAvista: "R$ 830,00"},
    {modelo: "IPHONE 14 PRO MAX", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "R$ 650,00", vidroTraseiroAvista: "R$ 604,50", faceIdParcelado: "R$ 850,00", faceIdAvista: "R$ 830,00", conectorCargaParcelado: "R$ 850,00", conectorCargaAvista: "R$ 830,00"},
    {modelo: "IPHONE 15", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 15 PRO", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"},
    {modelo: "IPHONE 15 PRO MAX", trocaTelaParcelado: "*", trocaTelaAvista: "#VALOR!", trocaBateriaParcelado: "*", trocaBateriaAvista: "#VALOR!", vidroTraseiroParcelado: "*", vidroTraseiroAvista: "#VALOR!", faceIdParcelado: "*", faceIdAvista: "*", conectorCargaParcelado: "*", conectorCargaAvista: "*"}
];

db.serialize(() => {
    // Cria a tabela
    db.run(`CREATE TABLE IF NOT EXISTS repair_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modelo TEXT,
        trocaTelaParcelado TEXT,
        trocaTelaAvista TEXT,
        trocaBateriaParcelado TEXT,
        trocaBateriaAvista TEXT,
        vidroTraseiroParcelado TEXT,
        vidroTraseiroAvista TEXT,
        faceIdParcelado TEXT,
        faceIdAvista TEXT,
        conectorCargaParcelado TEXT,
        conectorCargaAvista TEXT
    )`);

    // Insere os dados
    const stmt = db.prepare(`INSERT INTO repair_prices (modelo, trocaTelaParcelado, trocaTelaAvista, trocaBateriaParcelado, trocaBateriaAvista, vidroTraseiroParcelado, vidroTraseiroAvista, faceIdParcelado, faceIdAvista, conectorCargaParcelado, conectorCargaAvista) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    repairData.forEach(item => {
        stmt.run(item.modelo, item.trocaTelaParcelado, item.trocaTelaAvista, item.trocaBateriaParcelado, item.trocaBateriaAvista, item.vidroTraseiroParcelado, item.vidroTraseiroAvista, item.faceIdParcelado, item.faceIdAvista, item.conectorCargaParcelado, item.conectorCargaAvista);
    });

    stmt.finalize();

    console.log('Banco de dados criado e populado com sucesso!');
});

db.close();