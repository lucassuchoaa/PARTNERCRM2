#!/bin/bash

# =============================================================================
# Security Check Script
# =============================================================================
# Validates that no API keys are exposed in the production bundle
# =============================================================================

set -e

echo "🔍 Partners Platform - Security Check"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if build exists
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}⚠️  No build found. Running build...${NC}"
  npm run build
fi

echo "📦 Checking production bundle for exposed secrets..."
echo ""

# Pattern to search for API keys
PATTERNS=(
  "RESEND_API_KEY"
  "HUBSPOT.*API.*KEY"
  "HUBSPOT.*ACCESS.*TOKEN"
  "GEMINI_API_KEY"
  "NETSUITE.*KEY"
  "NETSUITE.*SECRET"
  "re_[a-zA-Z0-9]{40}"  # Resend API key pattern
  "pat-na1-[a-zA-Z0-9-]{36}"  # HubSpot private app token pattern
  "AIza[a-zA-Z0-9_-]{35}"  # Google API key pattern
)

ERRORS=0
WARNINGS=0

# Search in all JS files in dist
for pattern in "${PATTERNS[@]}"; do
  echo "Searching for: $pattern"

  # Search in JS files
  if grep -r -i -E "$pattern" dist/*.js 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Found potential API key: $pattern${NC}"
    ERRORS=$((ERRORS + 1))
  fi

  # Search in HTML files
  if grep -r -i -E "$pattern" dist/*.html 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: Found potential API key in HTML: $pattern${NC}"
    ERRORS=$((ERRORS + 1))
  fi
done

echo ""
echo "🔐 Checking for hardcoded secrets..."

# Check for hardcoded secrets (basic patterns)
if grep -r -E "(api[_-]?key|secret|password|token).*=.*['\"][a-zA-Z0-9]{20,}['\"]" dist/*.js 2>/dev/null; then
  echo -e "${YELLOW}⚠️  Warning: Found potential hardcoded secrets${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🌐 Checking API calls..."

# Check that API calls go to /api/* instead of external services
if grep -r -E "https://(api\.resend\.com|api\.hubapi\.com|generativelanguage\.googleapis\.com)" dist/*.js 2>/dev/null; then
  echo -e "${RED}❌ CRITICAL: Found direct external API calls (should use /api/* proxy)${NC}"
  ERRORS=$((ERRORS + 1))
fi

echo ""
echo "======================================"

if [ $ERRORS -gt 0 ]; then
  echo -e "${RED}❌ SECURITY CHECK FAILED${NC}"
  echo -e "${RED}Found $ERRORS critical security issues${NC}"
  echo ""
  echo "Action Required:"
  echo "1. Remove all API keys from frontend code"
  echo "2. Use /api/* endpoints instead of direct API calls"
  echo "3. Move sensitive configuration to backend environment variables"
  exit 1
elif [ $WARNINGS -gt 0 ]; then
  echo -e "${YELLOW}⚠️  SECURITY CHECK PASSED WITH WARNINGS${NC}"
  echo -e "${YELLOW}Found $WARNINGS warnings${NC}"
  echo ""
  echo "Recommended:"
  echo "1. Review flagged potential secrets"
  echo "2. Ensure all sensitive data is server-side only"
  exit 0
else
  echo -e "${GREEN}✅ SECURITY CHECK PASSED${NC}"
  echo -e "${GREEN}No API keys or secrets found in bundle${NC}"
  exit 0
fi
