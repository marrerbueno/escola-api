const prisma = require('../config/database');
const notificationService = require('../services/notificationService');
const whatsapp = require('../services/whatsappService');

// Enviar boletim do aluno
const enviarBoletim = async (req, res, next) => {
  try {
    const { alunoId } = req.params;

    // Buscar notas do aluno
    const notas = await prisma.nota.findMany({
      where: { alunoId },
      include: {
        disciplina: { select: { nome: true } },
      },
    });

    if (notas.length === 0) {
      return res.status(404).json({ error: 'Nenhuma nota encontrada para este aluno' });
    }

    await notificationService.sendBoletim(alunoId, notas);

    res.json({ message: 'Boletim enviado com sucesso via WhatsApp' });
  } catch (error) {
    next(error);
  }
};

// Enviar avisos gerais
const enviarAviso = async (req, res, next) => {
  try {
    const { titulo, mensagem, turmaId } = req.body;

    if (!titulo || !mensagem) {
      return res.status(400).json({ error: 'Título e mensagem são obrigatórios' });
    }

    const resultados = await notificationService.sendAviso(titulo, mensagem, turmaId);

    res.json({
      message: 'Avisos enviados',
      total: resultados.length,
      resultados,
    });
  } catch (error) {
    next(error);
  }
};

// Enviar mensagem personalizada
const enviarMensagem = async (req, res, next) => {
  try {
    const { telefone, mensagem } = req.body;

    if (!telefone || !mensagem) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    await whatsapp.sendMessage(telefone, mensagem);

    res.json({ message: 'Mensagem enviada com sucesso' });
  } catch (error) {
    next(error);
  }
};

// Verificar status do WhatsApp
const verificarStatus = async (req, res, next) => {
  try {
    const provider = process.env.WHATSAPP_PROVIDER || 'mock';
    
    res.json({
      provider,
      status: provider === 'mock' ? 'desenvolvimento' : 'produção',
      configurado: provider !== 'mock',
    });
  } catch (error) {
    next(error);
  }
};

// Testar envio
const testarEnvio = async (req, res, next) => {
  try {
    const { telefone } = req.body;

    if (!telefone) {
      return res.status(400).json({ error: 'Telefone é obrigatório' });
    }

    const message = `✅ *Teste de Conexão*\n\n` +
      `Olá! Esta é uma mensagem de teste da Escola Digital.\n\n` +
      `Se você recebeu esta mensagem, o WhatsApp está funcionando corretamente!\n\n` +
      `📱 Escola Digital`;

    await whatsapp.sendMessage(telefone, message);

    res.json({ message: 'Mensagem de teste enviada' });
  } catch (error) {
    next(error);
  }
};

// Listar notificações enviadas
const listarNotificacoes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [notificacoes, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { acao: 'NOTIFICACAO_WHATSAPP' },
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit),
      }),
      prisma.auditLog.count({
        where: { acao: 'NOTIFICACAO_WHATSAPP' },
      }),
    ]);

    res.json({
      dados: notificacoes,
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

module.exports = {
  enviarBoletim,
  enviarAviso,
  enviarMensagem,
  verificarStatus,
  testarEnvio,
  listarNotificacoes,
};
