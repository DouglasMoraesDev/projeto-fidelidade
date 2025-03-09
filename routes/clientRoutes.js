// routes/clientRoutes.js






const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');


router.get('/', clientController.listClients);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.post('/:id/points', clientController.addPoints);
router.put('/clients/:id/reset', clientController.resetClientPoints);

// Novo endpoint para enviar voucher e resetar pontos
router.put('/:id/send-voucher', clientController.sendVoucherAndResetPoints);

module.exports = router;
