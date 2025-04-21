// routes/establishmentRoutes.js
const express = require('express');
const router = express.Router();
const {
  getEstablishmentById,
  getVoucherMessage,
  getQRCode
} = require('../controllers/establishmentController');

// Rota de QR Code
router.get('/:id/qrcode', getQRCode);

// Rota de dados e de voucher message
router.get('/:id', getEstablishmentById);
router.get('/:id/voucher-message', getVoucherMessage);

module.exports = router;
