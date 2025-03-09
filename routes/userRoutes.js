// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Rota de login: /api/login
router.post('/login', userController.login);

module.exports = router;
