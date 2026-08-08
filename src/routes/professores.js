const express = require('express');
const router = express.Router();
const { listar, obter, criar, atualizar, remover } = require('../controllers/professorController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar professores
router.get('/', listar);

// Obter professor por ID
router.get('/:id', obter);

// Criar professor (admin, diretor)
router.post('/', authorize('ADMIN', 'DIRETOR'), criar);

// Atualizar professor (admin, diretor)
router.put('/:id', authorize('ADMIN', 'DIRETOR'), atualizar);

// Remover professor (admin, diretor)
router.delete('/:id', authorize('ADMIN', 'DIRETOR'), remover);

module.exports = router;
