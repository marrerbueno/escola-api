FROM node:20-slim

# Instalar dependências do Puppeteer/Chrome
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar Chromium como navegador padrão
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

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
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${PORT:-3001}/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Iniciar
CMD ["node", "whatsapp-server.js"]
