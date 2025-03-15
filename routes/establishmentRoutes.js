// routes/establishmentRoutes.js
const express = require('express');
const router = express.Router();
const { getVoucherMessage } = require('../controllers/establishmentController');

// Rota para retornar a mensagem do voucher para um estabelecimento
router.get('/:id/voucher-message', (req, res) => {
    const establishmentId = req.params.id;
    // Aqui você pode buscar a mensagem do voucher no banco de dados ou definir uma mensagem padrão
    const voucherMessage = `Parabéns! Você ganhou um voucher exclusivo do estabelecimento ${establishmentId}!`;
    res.json({ voucherMessage });
  });

  
module.exports = router;
