const express = require('express');
const router = express.Router();
const { Clients, Establishments } = require('../models'); // Ajuste para corresponder ao seu modelo Sequelize

router.post('/', async (req, res) => {
  try {
    const clientes = req.body;
    
    for (const cliente of clientes) {
      const { fullName, phone, email, points } = cliente;
      const establishmentId = 2; // ID fixo do estabelecimento

      // Verifica se o estabelecimento existe
      const establishment = await Establishments.findByPk(establishmentId);
      if (!establishment) {
        return res.status(400).json({ error: `Estabelecimento ${establishmentId} não encontrado!` });
      }

      // Insere ou atualiza o cliente
      await Clients.upsert({
        fullName,
        phone,
        email,
        points,
        establishmentId
      });
    }

    return res.json({ message: "Clientes importados com sucesso!" });
  } catch (error) {
    console.error("Erro ao importar clientes:", error);
    return res.status(500).json({ error: "Erro ao importar os clientes." });
  }
});

module.exports = router;
