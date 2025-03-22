// routes/establishmentRoutes.js
const express = require('express');
const router = express.Router();
const { getEstablishmentById, getVoucherMessage } = require('../controllers/establishmentController');

// Rota para retornar os dados do estabelecimento pelo ID
router.get('/:id', getEstablishmentById);

// Rota para retornar a mensagem do voucher para um estabelecimento
router.get('/:id/voucher-message', getVoucherMessage);

module.exports = router;


