const axios = require('axios');

// ============================================
// SERVIÇO DE WHATSAPP
// Suporta múltiplos provedores:
// 1. WhatsApp Web (gratuito, local)
// 2. Twilio (pago, confiável)
// 3. Evolution API (gratuito, self-hosted)
// ============================================

class WhatsAppService {
  constructor() {
    this.provider = process.env.WHATSAPP_PROVIDER || 'whatsapp-web';
    this.whatsappWebUrl = process.env.WHATSAPP_WEB_URL || 'http://localhost:3001';
    this.client = null;
    this.init();
  }

  init() {
    switch (this.provider) {
      case 'whatsapp-web':
        this.initWhatsAppWeb();
        break;
      case 'twilio':
        this.initTwilio();
        break;
      case 'evolution':
        this.initEvolution();
        break;
      default:
        console.warn('WhatsApp provider não configurado. Usando mock.');
    }
  }

  // ============================================
  // WHATSAPP WEB (gratuito)
  // ============================================
  initWhatsAppWeb() {
    this.whatsappWebUrl = process.env.WHATSAPP_WEB_URL || 'http://localhost:3001';
    console.log(`📱 WhatsApp Web configurado: ${this.whatsappWebUrl}`);
  }

  async sendWhatsAppWeb(to, message) {
    try {
      const response = await axios.post(
        `${this.whatsappWebUrl}/send`,
        {
          phone: to,
          message: message,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      if (error.response?.status === 503) {
        throw new Error('WhatsApp não conectado. Escaneie o QR Code.');
      }
      throw error;
    }
  }

  // ============================================
  // TWILIO
  // ============================================
  initTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken) {
      console.warn('Twilio não configurado. Defina TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN');
      return;
    }

    this.client = {
      baseUrl: `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`,
      auth: Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
    };
  }

  async sendTwilio(to, message) {
    if (!this.client) {
      throw new Error('Twilio não configurado');
    }

    const response = await axios.post(
      `${this.client.baseUrl}/Messages.json`,
      new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${this.twilioPhone}`,
        Body: message,
      }),
      {
        headers: {
          Authorization: `Basic ${this.client.auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return { success: true, messageId: response.data.sid };
  }

  // ============================================
  // EVOLUTION API (gratuito, self-hosted)
  // ============================================
  initEvolution() {
    this.evolutionUrl = process.env.EVOLUTION_API_URL;
    this.evolutionKey = process.env.EVOLUTION_API_KEY;
    this.evolutionInstance = process.env.EVOLUTION_API_INSTANCE || 'escola';

    if (!this.evolutionUrl) {
      console.warn('Evolution API não configurada. Defina EVOLUTION_API_URL');
      return;
    }
  }

  async sendEvolution(to, message) {
    if (!this.evolutionUrl) {
      throw new Error('Evolution API não configurada');
    }

    const response = await axios.post(
      `${this.evolutionUrl}/message/sendText/${this.evolutionInstance}`,
      {
        number: to,
        text: message,
      },
      {
        headers: {
          apikey: this.evolutionKey,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, messageId: response.data.key?.id };
  }

  // ============================================
  // MÉTODO PRINCIPAL
  // ============================================
  async sendMessage(to, message) {
    // Formatar número (remover caracteres especiais)
    let formattedNumber = to.replace(/\D/g, '');

    // Adicionar código do país se não tiver (Brasil = 55)
    if (formattedNumber.length === 11 || formattedNumber.length === 10) {
      formattedNumber = '55' + formattedNumber;
    }

    // Verificar se é número válido (Brasil: 12-13 dígitos com código do país)
    if (formattedNumber.length < 12 || formattedNumber.length > 13) {
      throw new Error('Número de telefone inválido');
    }

    try {
      let result;

      switch (this.provider) {
        case 'whatsapp-web':
          result = await this.sendWhatsAppWeb(formattedNumber, message);
          break;
        case 'twilio':
          result = await this.sendTwilio(formattedNumber, message);
          break;
        case 'evolution':
          result = await this.sendEvolution(formattedNumber, message);
          break;
        default:
          // Modo mock (desenvolvimento)
          console.log(`📱 [MOCK] WhatsApp para ${formattedNumber}:\n${message}`);
          result = { success: true, messageId: `mock-${Date.now()}` };
      }

      return result;
    } catch (error) {
      console.error(`❌ Erro ao enviar WhatsApp:`, error.message);
      throw error;
    }
  }

  // Enviar mensagem de boletim
  async sendBoletim(aluno, notas, responsavel) {
    const notasFormatadas = notas
      .map((n) => `• ${n.disciplina}: ${n.media.toFixed(2)}`)
      .join('\n');

    const message = `📚 *Boletim Escolar*\n\n` +
      `Olá ${responsavel.nome}!\n\n` +
      `Segue o boletim do(a) aluno(a) *${aluno.nomeCompleto}*:\n\n` +
      `${notasFormatadas}\n\n` +
      `📅 Período: ${notas[0]?.bimestre || 'N/A'}\n` +
      `📱 Escola Digital`;

    return this.sendMessage(responsavel.telefone, message);
  }

  // Enviar notificação de falta
  async sendFalta(aluno, disciplina, responsavel, data) {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR');

    const message = `⚠️ *Registro de Presença*\n\n` +
      `Olá ${responsavel.nome}!\n\n` +
      `Informamos que o(a) aluno(a) *${aluno.nomeCompleto}* ` +
      `esteve *ausente* na aula de *${disciplina.nome}* ` +
      `no dia ${dataFormatada}.\n\n` +
      `Se houver justificativa, favor entrar em contato com a escola.\n\n` +
      `📱 Escola Digital`;

    return this.sendMessage(responsavel.telefone, message);
  }

  // Enviar notificação de prova
  async sendProva(aluno, disciplina, responsavel, data, tipo) {
    const dataFormatada = new Date(data).toLocaleDateString('pt-BR');

    const message = `📝 *Lembrete de Avaliação*\n\n` +
      `Olá ${responsavel.nome}!\n\n` +
      `O(a) aluno(a) *${aluno.nomeCompleto}* tem ` +
      `*${tipo}* de *${disciplina.nome}* ` +
      `no dia ${dataFormatada}.\n\n` +
      `Desejamos bom desempenho!\n\n` +
      `📱 Escola Digital`;

    return this.sendMessage(responsavel.telefone, message);
  }

  // Enviar aviso geral
  async sendAviso(responsavel, titulo, mensagem) {
    const message = `📢 *Aviso da Escola*\n\n` +
      `*${titulo}*\n\n` +
      `${mensagem}\n\n` +
      `📱 Escola Digital`;

    return this.sendMessage(responsavel.telefone, message);
  }
}

module.exports = new WhatsAppService();
