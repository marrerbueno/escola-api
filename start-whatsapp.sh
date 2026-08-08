#!/bin/bash
echo "🚀 Iniciando WhatsApp Server + Tunnel..."
echo ""

# Iniciar WhatsApp Server em background
node whatsapp-server.js &
WHATSAPP_PID=$!

# Aguardar WhatsApp iniciar
sleep 3

# Iniciar Cloudflare Tunnel
echo "🌐 Criando túnel público..."
/tmp/cloudflared tunnel --url http://localhost:3001 2>&1 &
TUNNEL_PID=$!

# Aguardar tunnel iniciar e capturar URL
sleep 5

echo ""
echo "========================================"
echo "✅ Tudo rodando!"
echo ""
echo "📱 WhatsApp Server: http://localhost:3001"
echo "🌐 Tunnel ativo - veja a URL acima"
echo ""
echo "Copie a URL do tunnel (https://xxx.trycloudflare.com)"
echo "e atualize no Render:"
echo "  WHATSAPP_WEB_URL = <sua-url-do-tunnel>"
echo ""
echo "Pressione Ctrl+C para parar"
echo "========================================"

# Aguardar Ctrl+C
trap "kill $WHATSAPP_PID $TUNNEL_PID 2>/dev/null; exit" INT TERM
wait