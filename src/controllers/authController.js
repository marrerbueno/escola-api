const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret, jwtExpiresIn, bcryptSaltRounds } = require('../config/auth');
const { usuarioSchema, loginSchema } = require('../utils/validators');

// Registrar novo usuário
const registrar = async (req, res, next) => {
  try {
    const dados = usuarioSchema.parse(req.body);

    // Verificar se email já existe
    const existente = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (existente) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criptografar senha
    const senhaHash = await bcrypt.hash(dados.senha, bcryptSaltRounds);

    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        ...dados,
        senha: senhaHash,
      },
      select: { id: true, email: true, nome: true, role: true, createdAt: true },
    });

    // Gerar token
    const token = jwt.sign({ usuarioId: usuario.id }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    res.status(201).json({ usuario, token });
  } catch (error) {
    next(error);
  }
};

// Login
const login = async (req, res, next) => {
  try {
    const dados = loginSchema.parse(req.body);

    // Buscar usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: dados.email },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ error: 'Conta desativada' });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(dados.senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = jwt.sign({ usuarioId: usuario.id }, jwtSecret, {
      expiresIn: jwtExpiresIn,
    });

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        role: usuario.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Obter perfil do usuário logado
const perfil = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        createdAt: true,
        aluno: {
          select: { id: true, matricula: true, nomeCompleto: true, turma: true },
        },
        professor: {
          select: { id: true, siape: true, nomeCompleto: true, especialidade: true },
        },
      },
    });

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

// Atualizar perfil
const atualizarPerfil = async (req, res, next) => {
  try {
    const { nome, email } = req.body;

    const usuario = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { nome, email },
      select: { id: true, email: true, nome: true, role: true },
    });

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

module.exports = { registrar, login, perfil, atualizarPerfil };
