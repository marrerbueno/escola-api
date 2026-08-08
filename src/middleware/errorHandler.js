// Middleware de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.usuario?.id,
  });

  // Erro de validação do Prisma
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(400).json({
      error: `Já existe registro com este ${field}`,
    });
  }

  // Registro não encontrado
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }

  // Erro de validação
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors,
    });
  }

  // Erro JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Erro padrão
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
};

module.exports = errorHandler;
