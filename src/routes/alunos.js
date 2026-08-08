const express = require('express');
const router = express.Router();
const { listar, obter, criar, atualizar, remover, boletim } = require('../controllers/alunoController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Listar alunos
router.get('/', listar);

// Obter boletim do aluno
router.get('/:id/boletim', boletim);

// Obter aluno por ID
router.get('/:id', obter);

// Criar aluno (admin, diretor)
router.post('/', authorize('ADMIN', 'DIRETOR'), criar);

// Atualizar aluno (admin, diretor, professor da turma)
router.put('/:id', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), atualizar);

// Remover aluno (admin, diretor)
router.delete('/:id', authorize('ADMIN', 'DIRETOR'), remover);

module.exports = router;
