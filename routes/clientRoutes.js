const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

router.get('/', clientController.listClients);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);
router.post('/:id/points', clientController.addPoints);
router.put('/:id/reset', clientController.resetClientPoints);
router.put('/:id/send-voucher', clientController.sendVoucherAndResetPoints);
router.post('/check-points', clientController.checkPoints);

module.exports = router;
