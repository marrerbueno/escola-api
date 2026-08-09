FROM node:20-slim

# Instalar git (necessário para o Baileys)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar dependências
COPY package*.json ./
RUN npm install --production

# Copiar código
COPY whatsapp-server.js .

# Porta do servidor
EXPOSE 3001
ENV PORT=3001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Iniciar
CMD ["node", "whatsapp-server.js"]
