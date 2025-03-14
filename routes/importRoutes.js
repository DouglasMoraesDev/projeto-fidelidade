const express = require('express');
const router = express.Router();
const sequelize = require('../models/index'); // Certifique-se do caminho correto

router.post('/', async (req, res) => {
  try {
    const clientes = req.body; // Dados importados do JSON (array de objetos)
    
    // Para cada cliente, definimos establishmentId como 2 e usamos os campos corretos
    for (const cliente of clientes) {
      const { fullName, phone, email, points } = cliente;
      const establishmentId = 2; // Forçando o ID do estabelecimento para 2

      // Verifica se o estabelecimento existe (usar o nome da tabela conforme seu modelo)
      const [establishment] = await sequelize.query(`
        SELECT id FROM establishments WHERE id = ${establishmentId}
      `);

      if (establishment.length === 0) {
        return res.status(400).json({ error: `Estabelecimento ${establishmentId} não encontrado!` });
      }

      // Insere no banco de dados usando os nomes de colunas definidos no modelo Client (lembre que a tabela é "Clients")
      await sequelize.query(`
        INSERT INTO Clients (fullName, phone, email, points, establishmentId)
        VALUES ('${fullName}', '${phone}', '${email}', ${points}, ${establishmentId})
        ON DUPLICATE KEY UPDATE 
          fullName='${fullName}', 
          phone='${phone}', 
          email='${email}', 
          points=${points}
      `);
    }

    return res.json({ message: "Clientes importados com sucesso!" });
  } catch (error) {
    console.error("Erro ao importar clientes:", error);
    return res.status(500).json({ error: "Erro ao importar os clientes." });
  }
});

module.exports = router;
