const express = require('express');
const router = express.Router();
const { listar, lancar, lancarLote, atualizar, remover, mediaAluno, boletimTurma } = require('../controllers/notaController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar notas
router.get('/', listar);

// Média do aluno na disciplina
router.get('/media/:alunoId/:disciplinaId', mediaAluno);

// Boletim da turma
router.get('/boletim/:turmaId', boletimTurma);

// Lançar nota (professor, admin)
router.post('/', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), lancar);

// Lançar notas em lote
router.post('/lote', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), lancarLote);

// Atualizar nota
router.put('/:id', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), atualizar);

// Remover nota
router.delete('/:id', authorize('ADMIN', 'DIRETOR'), remover);

module.exports = router;
