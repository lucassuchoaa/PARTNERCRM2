#!/bin/bash
# Script para atualizar todas as chamadas fetch() para usar fetchWithAuth()

echo "🔧 Atualizando chamadas de API para usar autenticação..."

# Lista de arquivos para atualizar
FILES=(
  "src/components/ui/Referrals.tsx"
  "src/components/ui/ManagerDashboard.tsx"
  "src/components/ui/Profile.tsx"
  "src/components/ui/NetSuiteIntegration.tsx"
  "src/components/ui/Reports.tsx"
  "src/services/netsuiteService.ts"
  "src/services/chatMetricsService.ts"
  "src/services/productService.ts"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "📝 Processando $FILE..."

    # Adicionar import do fetchWithAuth se não existir
    if ! grep -q "fetchWithAuth" "$FILE"; then
      # Encontrar a primeira linha de import
      FIRST_IMPORT=$(grep -n "^import" "$FILE" | head -1 | cut -d: -f1)
      if [ ! -z "$FIRST_IMPORT" ]; then
        sed -i "${FIRST_IMPORT}i import { fetchWithAuth } from '../../services/api/fetch-with-auth'" "$FILE"
        echo "  ✓ Import adicionado"
      fi
    fi

    # Substituir fetch( por fetchWithAuth( apenas quando não é import ou comentário
    sed -i "/^import/! s/\bfetch(/fetchWithAuth(/g" "$FILE"

    echo "  ✓ Chamadas atualizadas"
  else
    echo "⚠️  Arquivo não encontrado: $FILE"
  fi
done

echo ""
echo "✅ Script concluído!"
echo "⚠️  IMPORTANTE: Revise os arquivos modificados antes de commitar"
