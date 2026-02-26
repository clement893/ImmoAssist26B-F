#!/bin/bash

# Script de diagnostic pour la connexion à l'agent
# Usage: ./scripts/diagnose-agent-connection.sh <AGENT_URL> <API_KEY>

set -e

AGENT_URL="${1:-https://immoassist-agent.railway.app}"
API_KEY="${2:-}"

echo "🔍 Diagnostic de la connexion à l'agent"
echo "========================================"
echo "URL de l'agent: $AGENT_URL"
echo ""

# Test 1: Vérifier que l'URL est accessible
echo "📋 Test 1: Vérification de l'accessibilité de l'URL de base"
if curl -s -f -o /dev/null -w "%{http_code}" "$AGENT_URL" > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$AGENT_URL")
    echo "✅ URL accessible (HTTP $HTTP_CODE)"
else
    echo "❌ URL non accessible"
    echo "   Vérifiez que l'URL est correcte et que le serveur agent est déployé"
    exit 1
fi
echo ""

# Test 2: Vérifier l'endpoint health (si disponible)
echo "📋 Test 2: Vérification de l'endpoint health"
HEALTH_URL="$AGENT_URL/api/external/agent/health"
if curl -s -f -X GET "$HEALTH_URL" -H "X-API-Key: $API_KEY" > /dev/null 2>&1; then
    echo "✅ Endpoint health accessible"
    curl -s -X GET "$HEALTH_URL" -H "X-API-Key: $API_KEY" | jq '.' 2>/dev/null || echo "   (Réponse non-JSON)"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$HEALTH_URL" -H "X-API-Key: $API_KEY" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "404" ]; then
        echo "⚠️  Endpoint health non trouvé (404) - endpoint optionnel"
    else
        echo "⚠️  Endpoint health non accessible (HTTP $HTTP_CODE) - endpoint optionnel"
    fi
fi
echo ""

# Test 3: Vérifier l'endpoint chat
echo "📋 Test 3: Vérification de l'endpoint chat"
CHAT_URL="$AGENT_URL/api/external/agent/chat"
if [ -z "$API_KEY" ]; then
    echo "⚠️  API_KEY non fournie, test sans authentification"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CHAT_URL" \
        -H "Content-Type: application/json" \
        -d '{"message": "test"}' 2>/dev/null || echo "000")
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CHAT_URL" \
        -H "Content-Type: application/json" \
        -H "X-API-Key: $API_KEY" \
        -d '{"message": "test"}' 2>/dev/null || echo "000")
fi

case "$HTTP_CODE" in
    200)
        echo "✅ Endpoint chat accessible et fonctionnel"
        ;;
    401)
        echo "⚠️  Endpoint chat trouvé mais authentification requise (401)"
        echo "   Vérifiez que l'API_KEY est correcte"
        ;;
    404)
        echo "❌ Endpoint chat non trouvé (404)"
        echo "   L'endpoint POST /api/external/agent/chat n'existe pas sur le serveur"
        echo ""
        echo "   Solutions possibles:"
        echo "   1. Vérifier que les routes sont bien configurées dans urls.py de l'agent"
        echo "   2. Vérifier que le serveur agent est bien déployé"
        echo "   3. Vérifier que l'URL de base est correcte (sans trailing slash)"
        echo "   4. Vérifier les logs du serveur agent pour voir les routes disponibles"
        ;;
    500)
        echo "⚠️  Endpoint chat trouvé mais erreur serveur (500)"
        echo "   Vérifiez les logs du serveur agent"
        ;;
    000)
        echo "❌ Impossible de se connecter au serveur"
        echo "   Vérifiez que l'URL est correcte et que le serveur est accessible"
        ;;
    *)
        echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
        echo "   Vérifiez les logs du serveur agent"
        ;;
esac
echo ""

# Test 4: Lister les routes disponibles (si possible)
echo "📋 Test 4: Tentative de détection des routes disponibles"
echo "   (Cette information peut ne pas être disponible selon la configuration du serveur)"
echo ""

# Test 5: Vérifier la configuration
echo "📋 Test 5: Vérification de la configuration"
echo "   URL de base: $AGENT_URL"
echo "   Endpoint chat attendu: $AGENT_URL/api/external/agent/chat"
echo "   Endpoint voice attendu: $AGENT_URL/api/external/agent/chat/voice"
echo ""

if [ "$HTTP_CODE" = "404" ]; then
    echo "🔧 Actions recommandées:"
    echo ""
    echo "1. Vérifier les routes dans urls.py de l'agent Django:"
    echo "   urlpatterns = ["
    echo "       path('api/external/agent/chat', views.agent_chat, name='agent_chat'),"
    echo "       path('api/external/agent/chat/voice', views.agent_chat_voice, name='agent_chat_voice'),"
    echo "   ]"
    echo ""
    echo "2. Vérifier que le serveur agent est bien redémarré après les modifications"
    echo ""
    echo "3. Vérifier les logs du serveur agent pour voir les routes enregistrées"
    echo ""
    echo "4. Tester directement depuis le serveur agent:"
    echo "   curl -X POST http://localhost:8000/api/external/agent/chat \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -H 'X-API-Key: $API_KEY' \\"
    echo "     -d '{\"message\": \"test\"}'"
    echo ""
fi
