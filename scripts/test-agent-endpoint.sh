#!/bin/bash

# Script de test simple pour vérifier l'endpoint agent
# Usage: ./scripts/test-agent-endpoint.sh <AGENT_URL> <API_KEY>

set -e

AGENT_URL="${1:-https://immoassist-agent.railway.app}"
API_KEY="${2:-}"

echo "🧪 Test de l'endpoint agent"
echo "============================"
echo "URL: $AGENT_URL"
echo ""

# Test 1: URL de base
echo "📋 Test 1: Accessibilité de l'URL de base"
BASE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$AGENT_URL" 2>/dev/null || echo "000")
if [ "$BASE_CODE" != "000" ]; then
    echo "✅ URL accessible (HTTP $BASE_CODE)"
else
    echo "❌ URL non accessible"
    exit 1
fi
echo ""

# Test 2: Endpoint chat
echo "📋 Test 2: Endpoint /api/external/agent/chat"
CHAT_URL="$AGENT_URL/api/external/agent/chat"

if [ -z "$API_KEY" ]; then
    echo "⚠️  Test sans API key (pour voir la réponse)"
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$CHAT_URL" \
        -H "Content-Type: application/json" \
        -d '{"message": "test"}' 2>/dev/null || echo "ERROR")
else
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$CHAT_URL" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -d '{"message": "test"}' 2>/dev/null || echo "ERROR")
fi

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo "Code HTTP: $HTTP_CODE"
echo "Réponse:"
echo "$BODY" | head -20
echo ""

case "$HTTP_CODE" in
    200)
        echo "✅ Endpoint fonctionne correctement !"
        ;;
    401)
        echo "⚠️  Endpoint trouvé mais authentification requise (401)"
        echo "   Vérifiez que l'API_KEY est correcte"
        ;;
    404)
        echo "❌ Endpoint non trouvé (404)"
        echo ""
        echo "🔍 Diagnostic:"
        echo "   L'endpoint POST /api/external/agent/chat n'existe pas sur le serveur"
        echo ""
        echo "✅ Actions à vérifier:"
        echo "   1. Les routes sont-elles dans urls.py ?"
        echo "      path('api/external/agent/chat', views.agent_chat)"
        echo ""
        echo "   2. Les vues existent-elles dans views.py ?"
        echo "      @api_view(['POST'])"
        echo "      def agent_chat(request): ..."
        echo ""
        echo "   3. Le serveur a-t-il été redémarré après les modifications ?"
        echo ""
        echo "   4. Les routes sont-elles dans le bon ordre ?"
        echo "      (spécifiques avant génériques)"
        echo ""
        echo "📖 Voir: docs/AGENT_404_FIX_STEP_BY_STEP.md"
        ;;
    500)
        echo "⚠️  Endpoint trouvé mais erreur serveur (500)"
        echo "   Vérifiez les logs du serveur agent"
        ;;
    *)
        echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
        echo "   Vérifiez les logs du serveur agent"
        ;;
esac
echo ""

# Test 3: Endpoint health (si disponible)
echo "📋 Test 3: Endpoint health (optionnel)"
HEALTH_URL="$AGENT_URL/api/external/agent/health"
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$HEALTH_URL" \
    -H "X-API-Key: $API_KEY" 2>/dev/null || echo "000")

if [ "$HEALTH_CODE" = "200" ]; then
    echo "✅ Endpoint health accessible"
elif [ "$HEALTH_CODE" = "404" ]; then
    echo "⚠️  Endpoint health non trouvé (optionnel)"
else
    echo "⚠️  Endpoint health: HTTP $HEALTH_CODE (optionnel)"
fi
echo ""

# Résumé
echo "📊 Résumé"
echo "=========="
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Tout fonctionne correctement !"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "⚠️  Endpoint trouvé, vérifiez l'API key"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Endpoint non trouvé - Voir docs/AGENT_404_FIX_STEP_BY_STEP.md"
else
    echo "⚠️  Problème détecté - Code HTTP: $HTTP_CODE"
fi
