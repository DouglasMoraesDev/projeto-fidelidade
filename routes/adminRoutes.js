// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  listEstablishments,
  updateEstablishment,
  deleteEstablishment
} = require('../controllers/adminController');

router.get('/establishments', listEstablishments);
router.put('/establishments/:id', updateEstablishment);
router.delete('/establishments/:id', deleteEstablishment);

module.exports = router;
