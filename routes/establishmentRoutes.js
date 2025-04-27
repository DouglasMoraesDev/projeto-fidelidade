const express = require('express');
const router = express.Router();
const {
  getEstablishmentById,
  getVoucherMessage,
  getQRCode
} = require('../controllers/establishmentController');

// QR Code
router.get('/:id/qrcode', getQRCode);

// Dados do estabelecimento e mensagem de voucher
router.get('/:id', getEstablishmentById);
router.get('/:id/voucher-message', getVoucherMessage);

module.exports = router;
