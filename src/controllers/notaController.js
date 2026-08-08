const prisma = require('../config/database');
const { notaSchema } = require('../utils/validators');
const notificationService = require('../services/notificationService');

// Listar notas
const listar = async (req, res, next) => {
  try {
    const { alunoId, disciplinaId, bimestre, ano, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (alunoId) where.alunoId = alunoId;
    if (disciplinaId) where.disciplinaId = disciplinaId;
    if (bimestre) where.bimestre = bimestre;
    if (ano) {
      where.disciplina = { turma: { ano: parseInt(ano) } };
    }

    const [notas, total] = await Promise.all([
      prisma.nota.findMany({
        where,
        include: {
          aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
          disciplina: { select: { id: true, nome: true } },
          professor: { select: { id: true, nomeCompleto: true } },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [{ dataLancamento: 'desc' }],
      }),
      prisma.nota.count({ where }),
    ]);

    res.json({
      dados: notas,
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

// Lançar nota
const lancar = async (req, res, next) => {
  try {
    const dados = notaSchema.parse(req.body);

    // Se não for professor, buscar o professor da disciplina
    if (req.usuario.professor?.id) {
      dados.professorId = req.usuario.professor.id;
    } else {
      // Buscar disciplina para obter o professor
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: dados.disciplinaId },
        select: { professorId: true },
      });
      if (disciplina) {
        dados.professorId = disciplina.professorId;
      }
    }

    const nota = await prisma.nota.create({
      data: dados,
      include: {
        aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    // Enviar notificação WhatsApp (não bloqueia resposta)
    notificationService.notifyNotaLancada(nota.id).catch(console.error);

    res.status(201).json(nota);
  } catch (error) {
    next(error);
  }
};

// Lançar notas em lote
const lancarLote = async (req, res, next) => {
  try {
    const { notas } = req.body;

    if (!Array.isArray(notas) || notas.length === 0) {
      return res.status(400).json({ error: 'Deve fornecer pelo menos uma nota' });
    }

    // Se não for professor, buscar o professor da disciplina
    let professorId;
    if (req.usuario.professor?.id) {
      professorId = req.usuario.professor.id;
    } else {
      // Buscar primeira disciplina para obter o professor
      const primeiraDisciplina = await prisma.disciplina.findUnique({
        where: { id: notas[0].disciplinaId },
        select: { professorId: true },
      });
      if (primeiraDisciplina) {
        professorId = primeiraDisciplina.professorId;
      }
    }

    const notasValidadas = notas.map((n) => ({
      ...notaSchema.parse(n),
      professorId,
    }));

    const resultado = await prisma.nota.createMany({
      data: notasValidadas,
    });

    res.status(201).json({
      message: `${resultado.count} notas lançadas com sucesso`,
      count: resultado.count,
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar nota
const atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const nota = await prisma.nota.update({
      where: { id },
      data: dados,
      include: {
        aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    res.json(nota);
  } catch (error) {
    next(error);
  }
};

// Remover nota
const remover = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.nota.delete({ where: { id } });

    res.json({ message: 'Nota removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Média do aluno na disciplina
const mediaAluno = async (req, res, next) => {
  try {
    const { alunoId, disciplinaId } = req.params;

    const notas = await prisma.nota.findMany({
      where: { alunoId, disciplinaId },
      select: { valor: true, bimestre: true, tipo: true },
    });

    if (notas.length === 0) {
      return res.json({ media: 0, notas: [] });
    }

    const soma = notas.reduce((acc, n) => acc + parseFloat(n.valor), 0);
    const media = soma / notas.length;

    res.json({
      media: parseFloat(media.toFixed(2)),
      totalNotas: notas.length,
      notas,
    });
  } catch (error) {
    next(error);
  }
};

// Boletim completo da turma
const boletimTurma = async (req, res, next) => {
  try {
    const { turmaId } = req.params;
    const { ano, bimestre } = req.query;

    const where = {
      aluno: { turmaId },
    };

    if (ano) {
      where.disciplina = { turma: { ano: parseInt(ano) } };
    }
    if (bimestre) {
      where.bimestre = bimestre;
    }

    // Buscar alunos da turma
    const alunos = await prisma.aluno.findMany({
      where: { turmaId },
      select: { id: true, nomeCompleto: true, matricula: true },
      orderBy: { nomeCompleto: 'asc' },
    });

    // Buscar todas as notas da turma
    const notas = await prisma.nota.findMany({
      where,
      include: {
        disciplina: { select: { id: true, nome: true } },
      },
    });

    // Agrupar por aluno
    const boletim = alunos.map((aluno) => {
      const notasAluno = notas.filter((n) => n.alunoId === aluno.id);

      // Calcular média por disciplina
      const porDisciplina = {};
      notasAluno.forEach((nota) => {
        const discId = nota.disciplinaId;
        if (!porDisciplina[discId]) {
          porDisciplina[discId] = {
            disciplina: nota.disciplina,
            notas: [],
            media: 0,
          };
        }
        porDisciplina[discId].notas.push(parseFloat(nota.valor));
      });

      // Calcular médias
      Object.values(porDisciplina).forEach((disc) => {
        const soma = disc.notas.reduce((acc, n) => acc + n, 0);
        disc.media = parseFloat((soma / disc.notas.length).toFixed(2));
      });

      return {
        aluno,
        disciplinas: Object.values(porDisciplina),
      };
    });

    res.json({
      turmaId,
      boletim,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, lancar, lancarLote, atualizar, remover, mediaAluno, boletimTurma };
