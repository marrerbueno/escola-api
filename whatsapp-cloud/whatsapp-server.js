const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// WHATSAPP SOCKET (Baileys - sem Chrome!)
// ============================================

let sock = null;
let isReady = false;
let currentQR = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

async function connectWhatsApp() {
  // Limpar sessão anterior se existir
  if (sock) {
    try {
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }

  const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-session');

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Escola Digital', 'Chrome', '120.0'],
    connectTimeout: 60000,
    qrTimeout: 120000,
  });

  // QR Code
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      reconnectAttempts = 0;
      console.log('\n📱 QR Code recebido! Gerando imagem...\n');
      try {
        currentQR = await QRCode.toDataURL(qr, {
          width: 300,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' }
        });
        console.log('✅ QR Code pronto para escanear!');
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`⚠️ Conexão fechada. Status: ${statusCode}`);
      isReady = false;
      currentQR = null;

      if (shouldReconnect && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = Math.min(5000 * reconnectAttempts, 60000);
        console.log(`🔄 Reconectando em ${delay/1000}s (tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        reconnectTimeout = setTimeout(connectWhatsApp, delay);
      } else {
        console.log('❌ Sessão expirada. Gerando novo QR Code...');
        currentQR = null;
        // Limpar sessão antiga e reconectar
        reconnectTimeout = setTimeout(async () => {
          try {
            const fs = require('fs');
            const sessionPath = './whatsapp-session';
            if (fs.existsSync(sessionPath)) {
              fs.rmSync(sessionPath, { recursive: true, force: true });
              console.log('🗑️ Sessão antiga removida');
            }
          } catch (e) {}
          reconnectAttempts = 0;
          connectWhatsApp();
        }, 5000);
      }
    }

    if (connection === 'open') {
      console.log('✅ WhatsApp conectado!');
      isReady = true;
      currentQR = null;
      reconnectAttempts = 0;
    }
  });

  // Salvar credenciais
  sock.ev.on('creds.update', saveCreds);

  // Keep-alive
  setInterval(() => {
    if (isReady) {
      console.log('💓 WhatsApp ativo');
    }
  }, 30000);
}

// ============================================
// ROTAS DA API
// ============================================

// Healthcheck
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
    
    if (sock) {
      await sock.logout();
      sock = null;
    }
    
    clearTimeout(reconnectTimeout);
    await connectWhatsApp();
    
    res.json({ message: 'Reconectando... Aguarde o QR Code' });
  } catch (error) {
    console.error('❌ Erro ao reconectar:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// QR Code como JSON
app.get('/qr/json', (req, res) => {
  if (isReady) {
    res.json({ connected: true, message: 'WhatsApp conectado' });
  } else if (currentQR) {
    res.json({ connected: false, qr: currentQR, message: 'Escaneie o QR Code' });
  } else {
    res.json({ connected: false, message: 'Aguardando QR Code...' });
  }
});

// QR Code como imagem
app.get('/qr', async (req, res) => {
  if (isReady) {
    res.send('<h1>✅ WhatsApp Conectado!</h1>');
    return;
  }

  if (!currentQR) {
    res.send('<h1>⏳ Aguardando QR Code...</h1><p>Atualize em alguns segundos.</p>');
    return;
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - WhatsApp</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: Arial; text-align: center; padding: 2rem; background: #f5f5f5; }
        img { max-width: 300px; border: 1px solid #ddd; border-radius: 16px; padding: 1rem; background: white; }
        .status { margin-top: 1rem; padding: 1rem; border-radius: 8px; }
        .waiting { background: #fff3cd; color: #856404; }
        .connected { background: #d4edda; color: #155724; }
      </style>
    </head>
    <body>
      <h1>📱 QR Code WhatsApp</h1>
      <div class="status waiting" id="status-box">
        <h2 id="status-title">📱 Escaneie o QR Code</h2>
        <p id="status-text">Após escanear, esta página atualizará automaticamente.</p>
      </div>
      <div id="qrcode-container">
        <img id="qrcode" src="${currentQR}" alt="QR Code WhatsApp">
      </div>
      <p><strong>1.</strong> Abra o WhatsApp<br>
      <strong>2.</strong> Configurações → Dispositivos conectados<br>
      <strong>3.</strong> Conectar dispositivo<br>
      <strong>4.</strong> Escaneie o QR Code</p>
      <script>
        async function checkStatus() {
          try {
            const res = await fetch('/qr/json');
            const data = await res.json();
            if (data.connected) {
              document.getElementById('status-title').textContent = '✅ Conectado!';
              document.getElementById('status-text').textContent = 'Seu WhatsApp está conectado!';
              document.getElementById('status-box').className = 'status connected';
              document.getElementById('qrcode-container').style.display = 'none';
            } else if (data.qr) {
              document.getElementById('qrcode').src = data.qr;
              document.getElementById('qrcode-container').style.display = 'inline-block';
            }
          } catch (error) {
            console.error('Erro ao verificar status:', error);
          }
        }
        setInterval(checkStatus, 3000);
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

    if (!isReady || !sock) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    // Formatar número
    let phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.length === 11 || phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber;
    }

    const jid = phoneNumber + '@s.whatsapp.net';

    console.log(`📱 Enviando mensagem para: ${jid}`);

    // Verificar se o número existe
    const [result] = await sock.onWhatsApp(jid);
    if (!result?.exists) {
      console.log(`⚠️ Número ${phoneNumber} não está no WhatsApp`);
      return res.status(400).json({ 
        error: 'Número não encontrado no WhatsApp',
        phone: phoneNumber
      });
    }

    // Enviar mensagem
    const sentMsg = await sock.sendMessage(jid, { text: message });

    console.log(`✅ Mensagem enviada com sucesso!`);

    res.json({ 
      success: true, 
      messageId: sentMsg?.key?.id || 'enviado',
      to: phone,
      formattedTo: phoneNumber
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Verificar se número existe
app.get('/check/:phone', async (req, res) => {
  try {
    const { phone } = req.params;

    if (!isReady || !sock) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    let phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.length === 11 || phoneNumber.length === 10) {
      phoneNumber = '55' + phoneNumber;
    }

    const jid = phoneNumber + '@s.whatsapp.net';
    const [result] = await sock.onWhatsApp(jid);

    res.json({ 
      phone: phoneNumber,
      exists: result?.exists || false,
      message: result?.exists ? 'Número encontrado no WhatsApp' : 'Número não encontrado'
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

    if (!isReady || !sock) {
      return res.status(503).json({ error: 'WhatsApp not connected' });
    }

    const results = [];

    for (const phone of contacts) {
      try {
        let phoneNumber = phone.replace(/\D/g, '');
        if (phoneNumber.length === 11 || phoneNumber.length === 10) {
          phoneNumber = '55' + phoneNumber;
        }
        const jid = phoneNumber + '@s.whatsapp.net';
        const sentMsg = await sock.sendMessage(jid, { text: message });
        results.push({ phone, success: true, messageId: sentMsg?.key?.id });
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
    message: 'WhatsApp Service is running (Baileys)',
    connected: isReady,
    hasQR: !!currentQR,
    timestamp: new Date().toISOString()
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`\n🚀 WhatsApp Service rodando em http://localhost:${PORT}`);
  console.log(`📱 Status: http://localhost:${PORT}/status`);
  console.log(`🔗 QR Code: http://localhost:${PORT}/qr`);
  console.log(`\n⏳ Iniciando WhatsApp (Baileys)...\n`);
  
  await connectWhatsApp();
});
