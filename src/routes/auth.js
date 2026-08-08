const express = require('express');
const router = express.Router();
const { registrar, login, perfil, atualizarPerfil } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Rotas públicas
router.post('/registrar', registrar);
router.post('/login', login);

// Rotas autenticadas
router.get('/perfil', authenticate, perfil);
router.put('/perfil', authenticate, atualizarPerfil);

module.exports = router;
