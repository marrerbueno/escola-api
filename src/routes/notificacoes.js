const express = require('express');
const router = express.Router();
const {
  enviarBoletim,
  enviarAviso,
  enviarMensagem,
  verificarStatus,
  testarEnvio,
  listarNotificacoes,
} = require('../controllers/notificacaoController');
const { authenticate, authorize } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(authenticate);

// Verificar status do WhatsApp
router.get('/status', verificarStatus);

// Listar notificações enviadas
router.get('/', listarNotificacoes);

// Enviar boletim do aluno
router.post('/boletim/:alunoId', authorize('ADMIN', 'DIRETOR', 'PROFESSOR'), enviarBoletim);

// Enviar avisos gerais
router.post('/aviso', authorize('ADMIN', 'DIRETOR'), enviarAviso);

// Enviar mensagem personalizada
router.post('/mensagem', authorize('ADMIN', 'DIRETOR'), enviarMensagem);

// Testar envio
router.post('/testar', authorize('ADMIN'), testarEnvio);

module.exports = router;
