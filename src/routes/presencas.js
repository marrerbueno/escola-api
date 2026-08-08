const express = require('express');
const router = express.Router();
const {
  listar,
  registrar,
  registrarLote,
  atualizar,
  remover,
  estatisticasAluno,
  presencasDia,
} = require('../controllers/presencaController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar presenças
router.get('/', listar);

// Estatísticas de presença do aluno
router.get('/estatisticas/:alunoId', estatisticasAluno);

// Presenças do dia por disciplina
router.get('/dia/:disciplinaId', presencasDia);

// Registrar presença individual
router.post('/', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), registrar);

// Registrar presenças em lote
router.post('/lote', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), registrarLote);

// Atualizar presença
router.put('/:id', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), atualizar);

// Remover presença
router.delete('/:id', authorize('ADMIN', 'DIRETOR'), remover);

module.exports = router;
