#!/bin/bash

echo "🚀 Iniciando Partners CRM..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script na pasta do projeto${NC}"
    exit 1
fi

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Instalando dependências...${NC}"
    npm install
fi

# Função para limpar processos ao sair
cleanup() {
    echo -e "\n${RED}🛑 Encerrando servidores...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Capturar Ctrl+C para limpar processos
trap cleanup SIGINT SIGTERM

# Verificar e matar processos existentes nas portas
echo -e "${BLUE}🔍 Verificando portas...${NC}"

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${BLUE}📌 Liberando porta 3001...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${BLUE}📌 Liberando porta 5173...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null
fi

echo ""
echo -e "${GREEN}✅ Portas liberadas!${NC}"
echo ""

# Iniciar JSON Server em background
echo -e "${BLUE}🗄️  Iniciando Backend (JSON Server) na porta 3001...${NC}"
npm run server > /dev/null 2>&1 &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 2

# Verificar se backend iniciou
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${RED}❌ Erro ao iniciar backend${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend rodando!${NC}"
echo -e "${BLUE}   http://localhost:3001${NC}"
echo ""

# Iniciar Vite em background
echo -e "${BLUE}🎨 Iniciando Frontend (Vite) na porta 5173...${NC}"
npm run dev &
FRONTEND_PID=$!

# Aguardar frontend iniciar
sleep 3

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ Sistema Iniciado com Sucesso! ✨${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📡 Servidores Rodando:${NC}"
echo -e "   Backend (API):  ${GREEN}http://localhost:3001${NC}"
echo -e "   Frontend (App): ${GREEN}http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}🔐 Credenciais de Login:${NC}"
echo -e "   Admin:    ${GREEN}admin@somapay.com.br${NC} / ${GREEN}SomaPay@2024!${NC}"
echo -e "   Seu User: ${GREEN}lucasuchoa@hotmail.com${NC} / ${GREEN}lucas123${NC}"
echo -e "   Parceiro: ${GREEN}parceiro1@empresa.com${NC} / ${GREEN}parceiro123${NC}"
echo ""
echo -e "${BLUE}⚙️  Funcionalidades:${NC}"
echo -e "   ✅ ChatBot com IA"
echo -e "   ✅ Busca automática de CNPJ"
echo -e "   ✅ Dashboard completo"
echo -e "   ✅ Indicações de clientes"
echo ""
echo -e "${RED}Para parar os servidores: Pressione Ctrl+C${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Abrir navegador automaticamente (opcional)
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Abrindo navegador...${NC}"
    sleep 2
    open http://localhost:5173
fi

# Manter script rodando
wait
