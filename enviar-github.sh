#!/bin/bash

echo "=================================="
echo "   ENVIO PARA GITHUB"
echo "=================================="
echo ""

# Verificar se git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado"
    echo "Instale com: sudo dnf install git"
    exit 1
fi

# Verificar se o repositório já foi inicializado
if [ ! -d ".git" ]; then
    echo "📁 Inicializando repositório..."
    git init
fi

# Configurar branch principal
git branch -M main

# Adicionar arquivos
echo "📦 Adicionando arquivos..."
git add .

# Commit
echo "💾 Criando commit..."
git commit -m "Sistema Escola Digital v1.0"

echo ""
echo "✅ Repositório local pronto!"
echo ""
echo "=================================="
echo "   PRÓXIMOS PASSOS"
echo "=================================="
echo ""
echo "1. Acesse: https://github.com/new"
echo "2. Crie um repositório chamado: escola-api"
echo "3. Execute os comandos abaixo:"
echo ""
echo "   git remote add origin https://github.com/SEU-USER/escola-api.git"
echo "   git push -u origin main"
echo ""
echo "Substitua SEU-USER pelo seu usuário do GitHub"
echo ""

# Perguntar se quer continuar
read -p "Pressione Enter para continuar..."
