const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rota para importar clientes
router.post('/', async (req, res) => {
  try {
    const clientes = req.body;
    
    for (const cliente of clientes) {
      const { fullName, phone, email, points } = cliente;
      // Se o establishmentId não for informado, define um valor padrão (ou obtenha do contexto do usuário)
      const establishmentId = cliente.establishmentId || 2;

      // Verifica se o estabelecimento existe
      const establishment = await prisma.establishment.findUnique({
        where: { id: establishmentId }
      });
      if (!establishment) {
        return res.status(400).json({ error: `Estabelecimento ${establishmentId} não encontrado!` });
      }

      // Upsert do cliente baseado em phone (assumindo que seja único)
      await prisma.client.upsert({
        where: { phone },
        update: { fullName, email, points, establishmentId },
        create: { fullName, phone, email, points, establishmentId }
      });
    }

    return res.json({ message: "Clientes importados com sucesso!" });
  } catch (error) {
    console.error("Erro ao importar clientes:", error);
    return res.status(500).json({ error: "Erro ao importar os clientes." });
  }
});

module.exports = router;

