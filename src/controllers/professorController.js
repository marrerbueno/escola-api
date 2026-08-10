const prisma = require('../config/database');
const { professorSchema } = require('../utils/validators');

// Listar professores
const listar = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (search) {
      where.OR = [
        { nomeCompleto: { contains: search, mode: 'insensitive' } },
        { siape: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [professores, total] = await Promise.all([
      prisma.professor.findMany({
        where,
        include: {
          usuario: { select: { email: true, ativo: true } },
          turmas: { select: { id: true, nome: true, ano: true } },
          disciplinas: { select: { id: true, nome: true } },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { nomeCompleto: 'asc' },
      }),
      prisma.professor.count({ where }),
    ]);

    res.json({
      dados: professores,
      paginacao: {
        total,
        pagina: parseInt(page),
        limit: parseInt(limit),
        paginas: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Obter professor por ID
const obter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const professor = await prisma.professor.findUnique({
      where: { id },
      include: {
        usuario: { select: { email: true, ativo: true } },
        turmas: true,
        disciplinas: true,
      },
    });

    if (!professor) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    res.json(professor);
  } catch (error) {
    next(error);
  }
};

// Criar professor
const criar = async (req, res, next) => {
  try {
    const dados = req.body;

    // Se não tiver usuarioId, criar um usuário automaticamente
    if (!dados.usuarioId && dados.email) {
      const bcrypt = require('bcryptjs');
      const senhaHash = await bcrypt.hash(dados.senha || '123456', 10);

      const usuario = await prisma.usuario.create({
        data: {
          email: dados.email,
          senha: senhaHash,
          nome: dados.nomeCompleto,
          role: 'PROFESSOR',
        },
      });

      dados.usuarioId = usuario.id;
    }

    const dadosValidados = professorSchema.parse(dados);

    const professor = await prisma.professor.create({
      data: dadosValidados,
      include: {
        usuario: { select: { email: true } },
      },
    });

    res.status(201).json(professor);
  } catch (error) {
    next(error);
  }
};

// Atualizar professor
const atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const professor = await prisma.professor.update({
      where: { id },
      data: dados,
      include: {
        usuario: { select: { email: true } },
      },
    });

    res.json(professor);
  } catch (error) {
    next(error);
  }
};

// Remover professor
const remover = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.professor.delete({ where: { id } });

    res.json({ message: 'Professor removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, obter, criar, atualizar, remover };
