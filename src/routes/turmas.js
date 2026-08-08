const express = require('express');
const router = express.Router();
const { turmas, disciplinas } = require('../controllers/turmaController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// ============================================
// TURMAS
// ============================================

router.get('/turmas', turmas.listar);
router.get('/turmas/:id', turmas.obter);
router.post('/turmas', authorize('ADMIN', 'DIRETOR'), turmas.criar);
router.put('/turmas/:id', authorize('ADMIN', 'DIRETOR'), turmas.atualizar);
router.delete('/turmas/:id', authorize('ADMIN', 'DIRETOR'), turmas.remover);

// ============================================
// DISCIPLINAS
// ============================================

router.get('/disciplinas', disciplinas.listar);
router.get('/disciplinas/:id', disciplinas.obter);
router.post('/disciplinas', authorize('ADMIN', 'DIRETOR'), disciplinas.criar);
router.put('/disciplinas/:id', authorize('ADMIN', 'DIRETOR'), disciplinas.atualizar);
router.delete('/disciplinas/:id', authorize('ADMIN', 'DIRETOR'), disciplinas.remover);

module.exports = router;
