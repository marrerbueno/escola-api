require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const prisma = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Importar rotas
const authRoutes = require('./routes/auth');
const alunoRoutes = require('./routes/alunos');
const professorRoutes = require('./routes/professores');
const turmaRoutes = require('./routes/turmas');
const notaRoutes = require('./routes/notas');
const presencaRoutes = require('./routes/presencas');
const notificacaoRoutes = require('./routes/notificacoes');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURANÇA
// ============================================

// Helmet - Headers de segurança
app.use(helmet());

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://192.168.100.111:3000', 'http://192.168.100.111:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // máximo 500 requisições por IP
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});
app.use('/api/', limiter);

// Rate limiting mais restritivo para login
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // máximo 30 tentativas por minuto
  message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' },
});
app.use('/api/auth/login', loginLimiter);

// ============================================
// MIDDLEWARES GERAIS
// ============================================

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Parse URL encoded
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROTAS
// ============================================

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/professores', professorRoutes);
app.use('/api/turmas', turmaRoutes);
app.use('/api/notas', notaRoutes);
app.use('/api/presencas', presencaRoutes);
app.use('/api/notificacoes', notificacaoRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

app.use(errorHandler);

// ============================================
// INICIALIZAÇÃO
// ============================================

async function start() {
  try {
    // Conectar ao banco de dados
    await prisma.$connect();
    console.log('✅ Banco de dados conectado');

    // Iniciar servidor em IPv4 e IPv6
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor rodando na porta ${PORT} (IPv4)`);
      console.log(`📚 API disponível em http://localhost:${PORT}`);
      console.log(`📱 Para celular: http://192.168.100.111:${PORT}`);
      console.log(`🔍 Health check em http://192.168.100.111:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('👋 Servidor encerrado');
  process.exit(0);
});

start();

module.exports = app;
