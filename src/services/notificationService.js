const prisma = require('../config/database');
const whatsapp = require('./whatsappService');

class NotificationService {
  constructor() {
    this.queues = [];
    this.processing = false;
  }

  // ============================================
  // NOTA LANÇADA
  // ============================================
  async notifyNotaLancada(notaId) {
    try {
      const nota = await prisma.nota.findUnique({
        where: { id: notaId },
        include: {
          aluno: {
            include: {
              usuario: { select: { nome: true } },
            },
          },
          disciplina: { select: { nome: true } },
        },
      });

      if (!nota) return;

      const responsavel = await this.getResponsavel(nota.alunoId);
      if (!responsavel || !responsavel.responsavelTel) return;

      // Definir emoji baseado na nota
      let emojiNota = '📝';
      if (nota.valor >= 7) emojiNota = '✅';
      else if (nota.valor >= 5) emojiNota = '⚠️';
      else emojiNota = '❌';

      const message = `${emojiNota} *Nota Lançada*\n\n` +
        `Olá ${responsavel.responsavelNome}!\n\n` +
        `Foi lançada uma nota para o(a) aluno(a) *${nota.aluno.nomeCompleto}*:\n\n` +
        `📚 Disciplina: *${nota.disciplina.nome}*\n` +
        `📊 Nota: *${nota.valor.toFixed(2)}*\n` +
        `📅 Bimestre: ${this.formatBimestre(nota.bimestre)}\n` +
        `📋 Tipo: ${this.formatTipoNota(nota.tipo)}\n` +
        (nota.descricao ? `📝 ${nota.descricao}\n` : '') +
        `\n📱 Escola Digital`;

      await this.sendWithRetry(responsavel.responsavelTel, message);

      // Registrar notificação
      await this.logNotification({
        tipo: 'NOTA_LANCADA',
        destinatario: responsavel.responsavelTel,
        mensagem: message,
        referenciaId: notaId,
        referenciaTipo: 'NOTA',
      });

    } catch (error) {
      console.error('Erro ao notificar nota lançada:', error);
    }
  }

  // ============================================
  // PRESENÇA REGISTRADA
  // ============================================
  async notifyPresenca(presencaId) {
    try {
      const presenca = await prisma.presenca.findUnique({
        where: { id: presencaId },
        include: {
          aluno: true,
          disciplina: { select: { nome: true } },
          professor: { select: { nomeCompleto: true } },
        },
      });

      if (!presenca) return;

      const responsavel = await this.getResponsavel(presenca.alunoId);
      if (!responsavel || !responsavel.responsavelTel) return;

      let message;

      if (presenca.status === 'PRESENTE') {
        message = `✅ *Presença Confirmada*\n\n` +
          `Olá ${responsavel.responsavelNome}!\n\n` +
          `Seu filho(a) *${presenca.aluno.nomeCompleto}* está presente e participando da aula de *${presenca.disciplina.nome}* com a professora(o) *${presenca.professor.nomeCompleto}*.\n\n` +
          `Agradecemos pelo compromisso conosco!\n\n` +
          `📱 Escola Digital`;
      } else if (presenca.status === 'AUSENTE') {
        const dataFormatada = new Date(presenca.data).toLocaleDateString('pt-BR');
        message = `⚠️ *Ausência Registrada*\n\n` +
          `Olá ${responsavel.responsavelNome}!\n\n` +
          `Informamos que o(a) aluno(a) *${presenca.aluno.nomeCompleto}* ` +
          `esteve ausente na aula de *${presenca.disciplina.nome}* ` +
          `no dia ${dataFormatada}.\n\n` +
          `Se houver justificativa, favor entrar em contato com a escola.\n\n` +
          `📱 Escola Digital`;
      } else if (presenca.status === 'JUSTIFICADO') {
        message = `📋 *Presença Justificada*\n\n` +
          `Olá ${responsavel.responsavelNome}!\n\n` +
          `A ausência do(a) aluno(a) *${presenca.aluno.nomeCompleto}* na aula de *${presenca.disciplina.nome}* foi justificada.\n\n` +
          `📱 Escola Digital`;
      }

      if (message) {
        await this.sendWithRetry(responsavel.responsavelTel, message);

        await this.logNotification({
          tipo: `PRESENCA_${presenca.status}`,
          destinatario: responsavel.responsavelTel,
          mensagem: message,
          referenciaId: presencaId,
          referenciaTipo: 'PRESENCA',
        });
      }

    } catch (error) {
      console.error('Erro ao notificar presença:', error);
    }
  }

  // ============================================
  // PRESENÇA AUSENTE (LEGADO)
  // ============================================
  async notifyAusencia(presencaId) {
    return this.notifyPresenca(presencaId);
  }

  // ============================================
  // BOLETIM COMPLETO
  // ============================================
  async sendBoletim(alunoId, notas) {
    try {
      const aluno = await prisma.aluno.findUnique({
        where: { id: alunoId },
        include: {
          turma: { select: { nome: true, ano: true } },
        },
      });

      if (!aluno) return;

      const responsavel = await this.getResponsavel(alunoId);
      if (!responsavel || !responsavel.telefone) return;

      // Agrupar notas por disciplina
      const porDisciplina = {};
      notas.forEach((nota) => {
        const discId = nota.disciplinaId;
        if (!porDisciplina[discId]) {
          porDisciplina[discId] = {
            nome: nota.disciplina.nome,
            notas: [],
          };
        }
        porDisciplina[discId].notas.push(nota.valor);
      });

      // Calcular médias
      let notasFormatadas = '';
      Object.values(porDisciplina).forEach((disc) => {
        const media = disc.notas.reduce((a, b) => a + b, 0) / disc.notas.length;
        const emoji = media >= 7 ? '✅' : media >= 5 ? '⚠️' : '❌';
        notasFormatadas += `${emoji} ${disc.nome}: *${media.toFixed(2)}*\n`;
      });

      const message = `📚 *Boletim Escolar*\n\n` +
        `Olá ${responsavel.responsavelNome}!\n\n` +
        `Segue o boletim do(a) aluno(a) *${aluno.nomeCompleto}*:\n` +
        `🎓 Turma: ${aluno.turma?.nome || 'N/A'}\n\n` +
        `${notasFormatadas}\n` +
        `📱 Escola Digital`;

      await this.sendWithRetry(responsavel.telefone, message);

      await this.logNotification({
        tipo: 'BOLETIM',
        destinatario: responsavel.telefone,
        mensagem: message,
        referenciaId: alunoId,
        referenciaTipo: 'ALUNO',
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar boletim:', error);
      throw error;
    }
  }

  // ============================================
  // AVISO GERAL
  // ============================================
  async sendAviso(titulo, mensagem, turmaId = null) {
    try {
      // Buscar pais/mães dos alunos
      const where = {};
      if (turmaId) {
        where.turmaId = turmaId;
      }

      const alunos = await prisma.aluno.findMany({
        where,
        include: {
          turma: { select: { nome: true } },
        },
      });

      const resultados = [];

      for (const aluno of alunos) {
        const responsavel = await this.getResponsavel(aluno.id);
        if (!responsavel || !responsavel.responsavelTel) continue;

        const msgFormatada = `📢 *Aviso da Escola*\n\n` +
          `*${titulo}*\n\n` +
          `${mensagem}\n\n` +
          (aluno.turma ? `🎓 Turma: ${aluno.turma.nome}\n` : '') +
          `\n📱 Escola Digital`;

        try {
          await this.sendWithRetry(responsavel.responsavelTel, msgFormatada);
          resultados.push({ aluno: aluno.nomeCompleto, status: 'enviado' });
        } catch (error) {
          resultados.push({ aluno: aluno.nomeCompleto, status: 'erro', erro: error.message });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Erro ao enviar avisos:', error);
      throw error;
    }
  }

  // ============================================
  // UTILITÁRIOS
  // ============================================
  async getResponsavel(alunoId) {
    return prisma.aluno.findUnique({
      where: { id: alunoId },
      select: {
        responsavelNome: true,
        responsavelTel: true,
        responsavelEmail: true,
      },
    });
  }

  formatBimestre(bimestre) {
    const bimestres = {
      PRIMEIRO: '1º Bimestre',
      SEGUNDO: '2º Bimestre',
      TERCEIRO: '3º Bimestre',
      QUARTO: '4º Bimestre',
    };
    return bimestres[bimestre] || bimestre;
  }

  formatTipoNota(tipo) {
    const tipos = {
      PROVA: 'Prova',
      TRABALHO: 'Trabalho',
      AVALIACAO: 'Avaliação',
      RECUPERACAO: 'Recuperação',
    };
    return tipos[tipo] || tipo;
  }

  async sendWithRetry(to, message, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await whatsapp.sendMessage(to, message);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }

  async logNotification(data) {
    try {
      await prisma.auditLog.create({
        data: {
          acao: 'NOTIFICACAO_WHATSAPP',
          tabela: 'NOTIFICACOES',
          dadosDepois: data,
        },
      });
    } catch (error) {
      console.error('Erro ao registrar log:', error);
    }
  }
}

module.exports = new NotificationService();
