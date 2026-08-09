const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// WHATSAPP WEB CLIENT
// ============================================

const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: './whatsapp-session'
  }),
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ]
  },
  webVersionCache: {
    type: 'remote',
    remotePath: 'https://raw.githubusercontent.com/nicholasgasior/test/master/whatsapp-web.js-versions.json',
  }
});

let isReady = false;
let currentQR = null;

client.on('qr', async (qr) => {
  console.log('\n📱 QR Code recebido! Gerando imagem...\n');
  try {
    // Gerar QR Code como imagem PNG
    currentQR = await QRCode.toDataURL(qr, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    console.log('✅ QR Code pronto para escanear!');
    console.log('🔗 Acesse: http://localhost:3001/qr\n');
  } catch (error) {
    console.error('Erro ao gerar QR Code:', error);
  }
});

client.on('ready', () => {
  console.log('✅ WhatsApp conectado!');
  isReady = true;
  currentQR = null;
});

client.on('authenticated', () => {
  console.log('🔐 Autenticado com sucesso!');
});

client.on('auth_failure', (msg) => {
  console.error('❌ Falha na autenticação:', msg);
  isReady = false;
});

client.on('disconnected', (reason) => {
  console.log('⚠️ Desconectado:', reason);
  isReady = false;
  currentQR = null;
  
  // Tentar reconectar após 5 segundos
  console.log('🔄 Tentando reconectar em 5 segundos...');
  setTimeout(() => {
    console.log('🔄 Reconectando...');
    client.initialize().catch(err => {
      console.error('❌ Erro ao reconectar:', err.message);
    });
  }, 5000);
});

// Keep-alive - verificar conexão a cada 30 segundos
setInterval(() => {
  if (isReady) {
    console.log('💓 WhatsApp ativo');
  }
}, 30000);

// ============================================
// ROTAS DA API
// ============================================

// Healthcheck - responde imediatamente
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Status do WhatsApp
app.get('/status', (req, res) => {
  res.json({
    connected: isReady,
    hasQR: !!currentQR,
    message: isReady ? 'WhatsApp conectado' : currentQR ? 'QR Code pronto' : 'Aguardando QR Code...'
  });
});

// Reconectar WhatsApp
app.get('/reconnect', async (req, res) => {
  try {
    console.log('🔄 Reconectando WhatsApp...');
    isReady = false;
    currentQR = null;
    
    await client.destroy();
    await client.initialize();
    
    res.json({ message: 'Reconectando... Aguarde o QR Code' });
  } catch (error) {
    console.error('❌ Erro ao reconectar:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// QR Code como JSON (para usar via API)
app.get('/qr/json', (req, res) => {
  if (isReady) {
    return res.json({ connected: true, message: 'WhatsApp já conectado' });
  }
  
  if (!currentQR) {
    return res.json({ connected: false, qr: null, message: 'Aguardando QR Code...' });
  }
  
  res.json({ connected: false, qr: currentQR, message: 'Escaneie o QR Code' });
});

// QR Code como página HTML
app.get('/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp QR Code</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #111b21 0%, #1f2c34 100%);
          color: white;
        }
        .container { 
          text-align: center; 
          padding: 2rem;
          max-width: 500px;
          width: 100%;
        }
        h1 { 
          color: #25d366; 
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        .status { 
          margin: 1.5rem 0; 
          padding: 1.5rem;
          border-radius: 12px;
          background: #1f2c34;
          border: 2px solid #2d3940;
        }
        .connected { 
          border-color: #25d366;
          background: rgba(37, 211, 102, 0.1);
        }
        .waiting { 
          border-color: #f59e0b;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .status h2 { 
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .status p { 
          color: #8696a0;
          font-size: 0.9rem;
        }
        #qrcode-container {
          margin: 2rem 0;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          display: inline-block;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        #qrcode {
          display: block;
          max-width: 300px;
        }
        .instructions {
          margin-top: 2rem;
          text-align: left;
          background: rgba(255,255,255,0.05);
          padding: 1.5rem;
          border-radius: 12px;
        }
        .instructions h3 { 
          margin-bottom: 1rem;
          color: #25d366;
        }
        .instructions ol { 
          padding-left: 1.5rem;
        }
        .instructions li { 
          margin: 0.75rem 0;
          color: #d1d5db;
          line-height: 1.6;
        }
        .instructions strong { color: white; }
        .footer {
          margin-top: 2rem;
          color: #6b7280;
          font-size: 0.85rem;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #2d3940;
          border-top-color: #25d366;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 1rem auto;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-reload {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: #25d366;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-reload:hover {
          background: #20bd5a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 WhatsApp Conexão</h1>
        
        <div class="status ${isReady ? 'connected' : 'waiting'}" id="status-box">
          <h2 id="status-title">${isReady ? '✅ Conectado!' : '⏳ Aguardando QR Code...'}</h2>
          <p id="status-text">${isReady ? 'Seu WhatsApp está conectado e pronto para uso!' : 'O QR Code aparecerá aqui em instantes...'}</p>
        </div>

        <div id="qrcode-container" style="display: ${currentQR ? 'inline-block' : 'none'}">
          <img id="qrcode" src="${currentQR || ''}" alt="QR Code WhatsApp">
        </div>
        
        <div id="spinner" style="display: ${currentQR ? 'none' : 'block'}">
          <div class="spinner"></div>
          <p style="color: #8696a0; margin-top: 1rem;">Gerando QR Code...</p>
        </div>

        <div class="instructions">
          <h3>📖 Como conectar:</h3>
          <ol>
            <li>Abra o <strong>WhatsApp</strong> no celular</li>
            <li>Vá em <strong>Configurações</strong> ⚙️</li>
            <li>Toque em <strong>Dispositivos conectados</strong></li>
            <li>Toque em <strong>Conectar dispositivo</strong></li>
            <li>Escaneie o <strong>QR Code</strong> acima</li>
          </ol>
        </div>

        <button class="btn-reload" onclick="location.reload()">🔄 Atualizar QR Code</button>

        <p class="footer">
          Após escanear, esta página atualizará automaticamente.<br>
          Não feche esta página enquanto não conectar.
        </p>
      </div>

      <script>
        // Verificar status e atualizar QR Code
        async function checkStatus() {
          try {
            const res = await fetch('/qr/json');
            const data = await res.json();
            
            if (data.connected) {
              document.getElementById('status-title').textContent = '✅ Conectado!';
              document.getElementById('status-text').textContent = 'Seu WhatsApp está conectado!';
              document.getElementById('status-box').className = 'status connected';
              document.getElementById('qrcode-container').style.display = 'none';
              document.getElementById('spinner').style.display = 'none';
            } else if (data.qr) {
              document.getElementById('qrcode').src = data.qr;
              document.getElementById('qrcode-container').style.display = 'inline-block';
              document.getElementById('spinner').style.display = 'none';
              document.getElementById('status-title').textContent = '📱 Escaneie o QR Code';
              document.getElementById('status-text').textContent = 'Após escanear, esta página atualizará automaticamente.';
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }

        // Verificar a cada 3 segundos
        setInterval(checkStatus, 3000);
        
        // Verificar imediatamente
        checkStatus();
      </script>
    </body>
    </html>
  `);
});

// Enviar mensagem
app.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    if (!isReady) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    // Formatar número corretamente
    let phoneNumber = phone.replace(/\D/g, '');
    
    // Adicionar código do país se não tiver (Brasil = 55)
    if (phoneNumber.length === 11 || phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber;
    }
    
    // Formato correto: numero@c.us
    const chatId = phoneNumber + '@c.us';

    console.log(`📱 Enviando mensagem para: ${chatId}`);

    // Verificar se o número existe no WhatsApp
    try {
      const numberExists = await client.isRegisteredUser(chatId);
      if (!numberExists) {
        console.log(`⚠️ Número ${phoneNumber} não está no WhatsApp`);
        return res.status(400).json({ 
          error: 'Número não encontrado no WhatsApp',
          phone: phoneNumber
        });
      }
    } catch (checkError) {
      console.log(`⚠️ Não foi possível verificar o número: ${checkError.message}`);
      // Continuar mesmo assim
    }

    // Enviar mensagem
    const result = await client.sendMessage(chatId, message);

    console.log(`✅ Mensagem enviada com sucesso!`);
    console.log(`📋 Resultado:`, result);

    res.json({ 
      success: true, 
      messageId: result?.id?._serialized || 'enviado',
      to: phone,
      formattedTo: phoneNumber
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verificar se número existe no WhatsApp
app.get('/check/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    if (!isReady) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    // Formatar número
    let phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.length === 11 || phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber;
    }

    const chatId = phoneNumber + '@c.us';

    // Verificar se o número existe
    const numberExists = await client.isRegisteredUser(chatId);

    res.json({ 
      phone: phoneNumber,
      exists: numberExists,
      message: numberExists ? 'Número encontrado no WhatsApp' : 'Número não encontrado'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar para múltiplos destinatários
app.post('/send-bulk', async (req, res) => {
  try {
    const { contacts, message } = req.body;

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ error: 'Contacts array is required' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!isReady) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    const results = [];

    for (const phone of contacts) {
      try {
        let phoneNumber = phone.replace(/\D/g, '');
        if (phoneNumber.length === 11 || phoneNumber.length === 10) {
          phoneNumber = '55' + phoneNumber;
        }
        const chatId = phoneNumber + '@c.us';
        const result = await client.sendMessage(chatId, message);
        results.push({ phone, success: true, messageId: result.id._serialized });
      } catch (error) {
        results.push({ phone, success: false, error: error.message });
      }
    }

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ 
    message: 'WhatsApp Service is running',
    connected: isReady,
    hasQR: !!currentQR,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 WhatsApp Service rodando em http://localhost:${PORT}`);
  console.log(`📱 Status: http://localhost:${PORT}/status`);
  console.log(`🔗 QR Code: http://localhost:${PORT}/qr`);
  console.log(`\n⏳ Iniciando WhatsApp Web...\n`);
  
  // Iniciar cliente WhatsApp
  client.initialize();
});
