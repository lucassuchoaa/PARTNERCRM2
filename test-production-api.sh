#!/bin/bash

PROD_URL="https://ff6085d4-0d5d-4b78-8bd6-63a746d65b9c-00-28twcn80pm57g.spock.replit.dev"

echo "=========================================="
echo "TESTE DA API EM PRODUÇÃO"
echo "=========================================="
echo ""

# 1. Testar rota raiz
echo "1. Testando rota raiz..."
curl -s "$PROD_URL/" | head -c 100
echo ""
echo ""

# 2. Testar /api/health
echo "2. Testando /api/health..."
curl -s "$PROD_URL/api/health"
echo ""
echo ""

# 3. Login
echo "3. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST "$PROD_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"lucasuchoa@hotmail.com\",\"password\":\"admin123\"}")

echo "$LOGIN_RESPONSE" | head -c 500
echo ""
echo ""

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ ERRO: Não foi possível obter o token"
  echo "Response completa:"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token obtido: ${TOKEN:0:50}..."
echo ""

# 4. Buscar roles
echo "4. Buscando roles..."
ROLES_RESPONSE=$(curl -s "$PROD_URL/api/roles" \
  -H "Authorization: Bearer $TOKEN")

echo "$ROLES_RESPONSE"
echo ""

# 5. Contar roles
NUM_ROLES=$(echo "$ROLES_RESPONSE" | grep -o '"id":"[^"]*"' | wc -l)
echo ""
echo "=========================================="
echo "Total de roles: $NUM_ROLES"
echo "=========================================="
