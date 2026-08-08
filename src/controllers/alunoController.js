const prisma = require('../config/database');
const { alunoSchema } = require('../utils/validators');

// Listar alunos
const listar = async (req, res, next) => {
  try {
    const { turmaId, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (turmaId) where.turmaId = turmaId;
    if (search) {
      where.OR = [
        { nomeCompleto: { contains: search, mode: 'insensitive' } },
        { matricula: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [alunos, total] = await Promise.all([
      prisma.aluno.findMany({
        where,
        include: {
          turma: { select: { id: true, nome: true, ano: true, periodo: true } },
          usuario: { select: { email: true, ativo: true } },
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { nomeCompleto: 'asc' },
      }),
      prisma.aluno.count({ where }),
    ]);

    res.json({
      dados: alunos,
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

// Obter aluno por ID
const obter = async (req, res, next) => {
  try {
    const { id } = req.params;

    const aluno = await prisma.aluno.findUnique({
      where: { id },
      include: {
        turma: true,
        usuario: { select: { email: true, ativo: true } },
        notas: {
          include: { disciplina: { select: { nome: true } } },
          orderBy: { dataLancamento: 'desc' },
        },
        presencas: {
          include: { disciplina: { select: { nome: true } } },
          orderBy: { data: 'desc' },
          take: 10,
        },
      },
    });

    if (!aluno) {
      return res.status(404).json({ error: 'Aluno não encontrado' });
    }

    res.json(aluno);
  } catch (error) {
    next(error);
  }
};
// Função para formatar telefone (remover 9 extras)
const formatarTelefone = (telefone) => {
  if (!telefone) return telefone;
  
  // Remover caracteres não numéricos
  let tel = telefone.replace(/\D/g, '');
  
  // Se tiver 11 dígitos e o 9º dígito for 9, remover o 9
  if (tel.length === 11 && tel[2] === '9') {
    tel = tel.substring(0, 2) + tel.substring(3);
  }
  
  return tel;
};

// Criar aluno
const criar = async (req, res, next) => {
  try {
    const dados = req.body;

    // Formatartelefones
    if (dados.responsavelTel) {
      dados.responsavelTel = formatarTelefone(dados.responsavelTel);
    }
    if (dados.telefone) {
      dados.telefone = formatarTelefone(dados.telefone);
    }

    // Se não tiver usuarioId, criar um usuário automaticamente
    if (!dados.usuarioId && dados.email) {
      const bcrypt = require('bcryptjs');
      const senhaHash = await bcrypt.hash(dados.senha || '123456', 10);

      const usuario = await prisma.usuario.create({
        data: {
          email: dados.email,
          senha: senhaHash,
          nome: dados.nomeCompleto,
          role: 'ALUNO',
        },
      });

      dados.usuarioId = usuario.id;
    }

    // Validar dados
    const dadosValidados = alunoSchema.parse(dados);

    // Converter dataNascimento para formato ISO
    if (dadosValidados.dataNascimento) {
      dadosValidados.dataNascimento = new Date(dadosValidados.dataNascimento).toISOString();
    }

    const aluno = await prisma.aluno.create({
      data: dadosValidados,
      include: {
        turma: { select: { id: true, nome: true } },
        usuario: { select: { email: true } },
      },
    });

    res.status(201).json(aluno);
  } catch (error) {
    next(error);
  }
};

// Atualizar aluno
const atualizar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    // Formatartelefones
    if (dados.responsavelTel) {
      dados.responsavelTel = formatarTelefone(dados.responsavelTel);
    }
    if (dados.telefone) {
      dados.telefone = formatarTelefone(dados.telefone);
    }

    // Converter dataNascimento para formato ISO se fornecida
    if (dados.dataNascimento) {
      dados.dataNascimento = new Date(dados.dataNascimento).toISOString();
    }

    const aluno = await prisma.aluno.update({
      where: { id },
      data: dados,
      include: {
        turma: { select: { id: true, nome: true } },
        usuario: { select: { email: true } },
      },
    });

    res.json(aluno);
  } catch (error) {
    next(error);
  }
};

// Remover aluno
const remover = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Remover registros relacionados primeiro
    await prisma.nota.deleteMany({ where: { alunoId: id } });
    await prisma.presenca.deleteMany({ where: { alunoId: id } });

    // Remover o aluno
    await prisma.aluno.delete({ where: { id } });

    res.json({ message: 'Aluno removido com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Obter boletim do aluno
const boletim = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ano, bimestre } = req.query;

    const where = { alunoId: id };
    if (ano) {
      where.disciplina = { turma: { ano: parseInt(ano) } };
    }
    if (bimestre) {
      where.bimestre = bimestre;
    }

    const notas = await prisma.nota.groupBy({
      by: ['disciplinaId', 'bimestre'],
      where,
      _avg: { valor: true },
      _sum: { valor: true },
      _count: { id: true },
    });

    // Buscar médias por disciplina
    const medias = await prisma.nota.findMany({
      where: { alunoId: id },
      include: {
        disciplina: { select: { id: true, nome: true, cargaHoraria: true } },
      },
    });

    // Calcular média por disciplina
    const boletim = {};
    medias.forEach((nota) => {
      const discId = nota.disciplinaId;
      if (!boletim[discId]) {
        boletim[discId] = {
          disciplina: nota.disciplina,
          notas: [],
          media: 0,
        };
      }
      boletim[discId].notas.push({
        valor: parseFloat(nota.valor),
        bimestre: nota.bimestre,
        tipo: nota.tipo,
      });
    });

    // Calcular médias
    Object.values(boletim).forEach((disc) => {
      const soma = disc.notas.reduce((acc, n) => acc + n.valor, 0);
      disc.media = soma / disc.notas.length;
    });

    // Buscar presenças
    const presencas = await prisma.presenca.groupBy({
      by: ['status'],
      where: { alunoId: id },
      _count: { id: true },
    });

    res.json({
      alunoId: id,
      boletim: Object.values(boletim),
      presencas,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { listar, obter, criar, atualizar, remover, boletim };
