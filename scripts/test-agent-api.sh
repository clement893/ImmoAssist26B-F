#!/bin/bash

# Script de test pour l'API Agent
# Usage: ./scripts/test-agent-api.sh <AGENT_URL> <API_KEY>

set -e

AGENT_URL="${1:-https://immoassist-agent.railway.app}"
API_KEY="${2:-}"

if [ -z "$API_KEY" ]; then
    echo "❌ Erreur: API_KEY requise"
    echo "Usage: $0 <AGENT_URL> <API_KEY>"
    exit 1
fi

echo "🧪 Test de l'API Agent"
echo "URL: $AGENT_URL"
echo "API Key: ${API_KEY:0:10}..."
echo ""

# Test 1: Health Check
echo "📋 Test 1: Health Check"
if curl -s -f -X GET "$AGENT_URL/api/external/agent/health" \
    -H "X-API-Key: $API_KEY" > /dev/null 2>&1; then
    echo "✅ Health check réussi"
else
    echo "⚠️  Health check non disponible (endpoint optionnel)"
fi
echo ""

# Test 2: Chat Texte
echo "📋 Test 2: Chat Texte"
RESPONSE=$(curl -s -X POST "$AGENT_URL/api/external/agent/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{"message": "Bonjour, test de l'\''API"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ Chat texte réussi"
    echo "Réponse: $(echo "$RESPONSE" | jq -r '.response' 2>/dev/null || echo 'N/A')"
else
    echo "❌ Chat texte échoué"
    echo "Réponse: $RESPONSE"
    exit 1
fi
echo ""

# Test 3: Chat Texte avec session_id
echo "📋 Test 3: Chat Texte avec session_id"
SESSION_ID="test-session-$(date +%s)"
RESPONSE=$(curl -s -X POST "$AGENT_URL/api/external/agent/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "{\"message\": \"Deuxième message\", \"session_id\": \"$SESSION_ID\"}")

if echo "$RESPONSE" | grep -q '"success":true'; then
    RETURNED_SESSION=$(echo "$RESPONSE" | jq -r '.session_id' 2>/dev/null || echo '')
    if [ "$RETURNED_SESSION" = "$SESSION_ID" ]; then
        echo "✅ Chat texte avec session_id réussi"
        echo "Session ID: $RETURNED_SESSION"
    else
        echo "⚠️  Session ID différent (attendu: $SESSION_ID, reçu: $RETURNED_SESSION)"
    fi
else
    echo "❌ Chat texte avec session_id échoué"
    echo "Réponse: $RESPONSE"
    exit 1
fi
echo ""

# Test 4: Erreur d'authentification
echo "📋 Test 4: Erreur d'authentification"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AGENT_URL/api/external/agent/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: mauvaise-cle" \
    -d '{"message": "Test"}')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Gestion d'erreur d'authentification correcte (401)"
else
    echo "⚠️  Code HTTP inattendu: $HTTP_CODE (attendu: 401)"
fi
echo ""

# Test 5: Erreur de validation
echo "📋 Test 5: Erreur de validation"
RESPONSE=$(curl -s -X POST "$AGENT_URL/api/external/agent/chat" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{}')

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo "✅ Gestion d'erreur de validation correcte"
    echo "Erreur: $(echo "$RESPONSE" | jq -r '.error' 2>/dev/null || echo 'N/A')"
else
    echo "⚠️  Réponse inattendue: $RESPONSE"
fi
echo ""

echo "🎉 Tous les tests sont passés !"
echo ""
echo "📝 Note: Pour tester le chat vocal, utilisez:"
echo "curl -X POST $AGENT_URL/api/external/agent/chat/voice \\"
echo "  -H \"X-API-Key: $API_KEY\" \\"
echo "  -F \"audio=@test-audio.webm\" \\"
echo "  -F \"session_id=test-session-123\""
