// routes/establishmentRoutes.js
const express = require('express');
const router = express.Router();
const { getVoucherMessage } = require('../controllers/establishmentController');

// Rota para retornar a mensagem do voucher para um estabelecimento
router.get('/:id/voucher-message', getVoucherMessage);

module.exports = router;

