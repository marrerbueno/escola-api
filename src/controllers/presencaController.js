const prisma = require('../config/database');
const { presencaSchema, presencaLoteSchema } = require('../utils/validators');
const notificationService = require('../services/notificationService');

// Listar presenças
const listar = async (req, res, next) => {
  try {
    const { alunoId, disciplinaId, data, status, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (alunoId) where.alunoId = alunoId;
    if (disciplinaId) where.disciplinaId = disciplinaId;
    if (status) where.status = status;
    if (data) {
      const dataInicio = new Date(data);
      dataInicio.setHours(0, 0, 0, 0);
      const dataFim = new Date(data);
      dataFim.setHours(23, 59, 59, 999);
      where.data = { gte: dataInicio, lte: dataFim };
    }

    const [presencas, total] = await Promise.all([
      prisma.presenca.findMany({
        where,
        include: {
          aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
          disciplina: { select: { id: true, nome: true } },
          professor: { select: { id: true, nomeCompleto: true } },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: [{ data: 'desc' }],
      }),
      prisma.presenca.count({ where }),
    ]);

    res.json({
      dados: presencas,
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

// Registrar presença individual
const registrar = async (req, res, next) => {
  try {
    const dados = presencaSchema.parse(req.body);

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

    // Converter data para formato ISO
    if (dados.data) {
      dados.data = new Date(dados.data).toISOString();
    }

    const presenca = await prisma.presenca.create({
      data: dados,
      include: {
        aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
        disciplina: { select: { id: true, nome: true } },
        professor: { select: { id: true, nomeCompleto: true } },
      },
    });

    // Enviar notificação WhatsApp (não bloqueia resposta)
    notificationService.notifyPresenca(presenca.id).catch(console.error);

    res.status(201).json(presenca);
  } catch (error) {
    next(error);
  }
};

// Registrar presenças em lote
const registrarLote = async (req, res, next) => {
  try {
    const dados = presencaLoteSchema.parse(req.body);

    // Se não for professor, buscar o professor da disciplina
    let professorId;
    if (req.usuario.professor?.id) {
      professorId = req.usuario.professor.id;
    } else {
      // Buscar disciplina para obter o professor
      const disciplina = await prisma.disciplina.findUnique({
        where: { id: dados.disciplinaId },
        select: { professorId: true },
      });
      if (disciplina) {
        professorId = disciplina.professorId;
      }
    }

    // Converter data para formato ISO
    const dataISO = new Date(dados.data).toISOString();

    let totalRegistradas = 0;

    // Processar cada presença
    for (const p of dados.presencas) {
      // Verificar se já existe presença para este aluno/disciplina/data
      const presencaExistente = await prisma.presenca.findFirst({
        where: {
          alunoId: p.alunoId,
          disciplinaId: dados.disciplinaId,
          data: dataISO,
        },
      });

      let presenca;

      if (presencaExistente) {
        // Atualizar presença existente
        presenca = await prisma.presenca.update({
          where: { id: presencaExistente.id },
          data: {
            status: p.status,
            observacao: p.observacao,
          },
          include: {
            aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
            disciplina: { select: { id: true, nome: true } },
            professor: { select: { id: true, nomeCompleto: true } },
          },
        });
      } else {
        // Criar nova presença
        presenca = await prisma.presenca.create({
          data: {
            alunoId: p.alunoId,
            disciplinaId: dados.disciplinaId,
            professorId,
            data: dataISO,
            status: p.status,
            observacao: p.observacao,
          },
          include: {
            aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
            disciplina: { select: { id: true, nome: true } },
            professor: { select: { id: true, nomeCompleto: true } },
          },
        });
      }

      // Enviar notificação WhatsApp para cada presença
      notificationService.notifyPresenca(presenca.id).catch(console.error);
      totalRegistradas++;
    }

    res.status(201).json({
      message: `${totalRegistradas} presenças registradas`,
      count: totalRegistradas,
    });
  } catch (error) {
    next(error);
  }
};

// Atualizar presença
const atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const presenca = await prisma.presenca.update({
      where: { id },
      data: dados,
      include: {
        aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
        disciplina: { select: { id: true, nome: true } },
      },
    });

    res.json(presenca);
  } catch (error) {
    next(error);
  }
};

// Remover presença
const remover = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.presenca.delete({ where: { id } });

    res.json({ message: 'Presença removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Estatísticas de presença do aluno
const estatisticasAluno = async (req, res, next) => {
  try {
    const { alunoId } = req.params;
    const { disciplinaId, dataInicio, dataFim } = req.query;

    const where = { alunoId };
    if (disciplinaId) where.disciplinaId = disciplinaId;
    if (dataInicio || dataFim) {
      where.data = {};
      if (dataInicio) where.data.gte = new Date(dataInicio);
      if (dataFim) where.data.lte = new Date(dataFim);
    }

    const presencas = await prisma.presenca.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const total = presencas.reduce((acc, p) => acc + p._count.id, 0);
    const presentes = presencas.find((p) => p.status === 'PRESENTE')?._count.id || 0;
    const ausentes = presencas.find((p) => p.status === 'AUSENTE')?._count.id || 0;
    const justificados = presencas.find((p) => p.status === 'JUSTIFICADO')?._count.id || 0;
    const atestado = presencas.find((p) => p.status === 'ATASDO')?._count.id || 0;

    const percentualPresenca = total > 0 ? ((presentes / total) * 100).toFixed(2) : 0;

    res.json({
      alunoId,
      total,
      presentes,
      ausentes,
      justificados,
      atestado,
      percentualPresenca: parseFloat(percentualPresenca),
      detalhes: presencas,
    });
  } catch (error) {
    next(error);
  }
};

// Presenças do dia por disciplina
const presencasDia = async (req, res, next) => {
  try {
    const { disciplinaId } = req.params;
    const { data } = req.query;

    const dataConsulta = data ? new Date(data) : new Date();
    dataConsulta.setHours(0, 0, 0, 0);
    const dataFim = new Date(dataConsulta);
    dataFim.setHours(23, 59, 59, 999);

    const presencas = await prisma.presenca.findMany({
      where: {
        disciplinaId,
        data: { gte: dataConsulta, lte: dataFim },
      },
      include: {
        aluno: { select: { id: true, nomeCompleto: true, matricula: true } },
      },
      orderBy: { aluno: { nomeCompleto: 'asc' } },
    });

    // Buscar todos os alunos da disciplina
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
      include: {
        turma: {
          include: {
            alunos: {
              select: { id: true, nomeCompleto: true, matricula: true },
              orderBy: { nomeCompleto: 'asc' },
            },
          },
        },
      },
    });

    // Marcar quem não foi registrado
    const alunosComPresenca = disciplina.turma.alunos.map((aluno) => {
      const presenca = presencas.find((p) => p.alunoId === aluno.id);
      return {
        ...aluno,
        presenca: presenca || { status: 'NAO_REGISTRADO' },
      };
    });

    res.json({
      disciplinaId,
      data: dataConsulta,
      total: alunosComPresenca.length,
      alunos: alunosComPresenca,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listar,
  registrar,
  registrarLote,
  atualizar,
  remover,
  estatisticasAluno,
  presencasDia,
};
