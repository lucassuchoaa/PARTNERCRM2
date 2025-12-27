#!/bin/bash

echo "========================================"
echo "TESTE COMPLETO DA API DE ROLES"
echo "========================================"
echo ""

# 1. Login
echo "1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"lucasuchoa@hotmail.com","password":"admin123"}')

echo "$LOGIN_RESPONSE" | head -c 500
echo ""
echo ""

# Extrair token
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ ERRO: Não foi possível obter o token"
  exit 1
fi

echo "✅ Token obtido: ${TOKEN:0:50}..."
echo ""

# 2. Buscar roles
echo "2. Buscando roles..."
ROLES_RESPONSE=$(curl -s http://localhost:5000/api/roles \
  -H "Authorization: Bearer $TOKEN")

echo "$ROLES_RESPONSE"
echo ""

# 3. Contar roles
NUM_ROLES=$(echo "$ROLES_RESPONSE" | grep -o '"id":"role_[^"]*"' | wc -l)
echo ""
echo "========================================"
echo "✅ Total de roles encontradas: $NUM_ROLES"
echo "========================================"
