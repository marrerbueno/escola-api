const prisma = require('../config/database');
const { turmaSchema, disciplinaSchema } = require('../utils/validators');

// ============================================
// TURMAS
// ============================================

const turmas = {
  listar: async (req, res, next) => {
    try {
      const { ano, periodo, page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      const where = {};
      if (ano) where.ano = parseInt(ano);
      if (periodo) where.periodo = periodo;

      const [lista, total] = await Promise.all([
        prisma.turma.findMany({
          where,
          include: {
            professor: { select: { id: true, nomeCompleto: true } },
            _count: { select: { alunos: true, disciplinas: true } },
          },
          skip: parseInt(skip),
          take: parseInt(limit),
          orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
        }),
        prisma.turma.count({ where }),
      ]);

      res.json({
        dados: lista,
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
  },

  obter: async (req, res, next) => {
    try {
      const { id } = req.params;

      const turma = await prisma.turma.findUnique({
        where: { id },
        include: {
          professor: { select: { id: true, nomeCompleto: true, siape: true } },
          alunos: {
            select: { id: true, nomeCompleto: true, matricula: true },
            orderBy: { nomeCompleto: 'asc' },
          },
          disciplinas: {
            include: {
              professor: { select: { id: true, nomeCompleto: true } },
            },
          },
        },
      });

      if (!turma) {
        return res.status(404).json({ error: 'Turma não encontrada' });
      }

      res.json(turma);
    } catch (error) {
      next(error);
    }
  },

  criar: async (req, res, next) => {
    try {
      const dados = turmaSchema.parse(req.body);

      const turma = await prisma.turma.create({ data: dados });

      res.status(201).json(turma);
    } catch (error) {
      next(error);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      const { id } = req.params;
      const dados = req.body;

      const turma = await prisma.turma.update({
        where: { id },
        data: dados,
      });

      res.json(turma);
    } catch (error) {
      next(error);
    }
  },

  remover: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.turma.delete({ where: { id } });

      res.json({ message: 'Turma removida com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};

// ============================================
// DISCIPLINAS
// ============================================

const disciplinas = {
  listar: async (req, res, next) => {
    try {
      const { turmaId, professorId } = req.query;

      const where = {};
      if (turmaId) where.turmaId = turmaId;
      if (professorId) where.professorId = professorId;

      const lista = await prisma.disciplina.findMany({
        where,
        include: {
          turma: { select: { id: true, nome: true, ano: true } },
          professor: { select: { id: true, nomeCompleto: true } },
          _count: { select: { notas: true, presencas: true } },
        },
        orderBy: { nome: 'asc' },
      });

      res.json(lista);
    } catch (error) {
      next(error);
    }
  },

  obter: async (req, res, next) => {
    try {
      const { id } = req.params;

      const disciplina = await prisma.disciplina.findUnique({
        where: { id },
        include: {
          turma: true,
          professor: { select: { id: true, nomeCompleto: true, siape: true } },
          _count: { select: { notas: true, presencas: true } },
        },
      });

      if (!disciplina) {
        return res.status(404).json({ error: 'Disciplina não encontrada' });
      }

      res.json(disciplina);
    } catch (error) {
      next(error);
    }
  },

  criar: async (req, res, next) => {
    try {
      const dados = disciplinaSchema.parse(req.body);

      const disciplina = await prisma.disciplina.create({ data: dados });

      res.status(201).json(disciplina);
    } catch (error) {
      next(error);
    }
  },

  atualizar: async (req, res, next) => {
    try {
      const { id } = req.params;
      const dados = req.body;

      const disciplina = await prisma.disciplina.update({
        where: { id },
        data: dados,
      });

      res.json(disciplina);
    } catch (error) {
      next(error);
    }
  },

  remover: async (req, res, next) => {
    try {
      const { id } = req.params;

      await prisma.disciplina.delete({ where: { id } });

      res.json({ message: 'Disciplina removida com sucesso' });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = { turmas, disciplinas };
