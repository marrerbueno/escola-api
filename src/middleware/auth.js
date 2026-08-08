const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const prisma = require('../config/database');

// Middleware de autenticação
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const usuario = await prisma.usuario.findUnique({
      where: { id: decoded.usuarioId },
      select: { id: true, email: true, nome: true, role: true, ativo: true },
    });

    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    next(error);
  }
};

// Middleware de autorização por role
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    if (!roles.includes(req.usuario.role)) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }

    next();
  };
};

module.exports = { authenticate, authorize };
