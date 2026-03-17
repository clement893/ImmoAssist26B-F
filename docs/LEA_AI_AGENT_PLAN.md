# 🤖 Plan Complet : Agent AI "Léa" pour Application Immobilière

## 📋 Vue d'ensemble

**Léa** est un assistant AI vocal intelligent conçu pour aider les utilisateurs dans toute l'application immobilière. Elle peut répondre aux questions, accéder à la base de données, et interagir via la voix.

---

## 🎯 Objectifs Principaux

1. **Assistant Conversationnel** : Répondre aux questions des utilisateurs
2. **Fonction Vocale** : Parler et écouter (Speech-to-Text + Text-to-Speech)
3. **Accès Base de Données** : Interroger et manipuler les données immobilières
4. **Intégration Globale** : Disponible partout dans l'application
5. **Contexte Immobilier** : Spécialisé dans le domaine immobilier

---

## 🏗️ Architecture Technique

### **Stack Technologique**

#### Backend
- **AI Service** : OpenAI GPT-4o / Claude (déjà en place)
- **Database Access** : SQLAlchemy avec fonction tools/functions
- **Voice Processing** : 
  - Speech-to-Text : OpenAI Whisper API ou Web Speech API
  - Text-to-Speech : OpenAI TTS API ou Web Speech Synthesis API
- **API Endpoints** : FastAPI (déjà en place)

#### Frontend
- **React Components** : Interface chat + contrôle vocal
- **Web Speech API** : Pour la reconnaissance vocale navigateur
- **Audio Playback** : Pour la synthèse vocale
- **Floating Widget** : Widget flottant accessible partout

---

## 📐 Structure des Composants

### **1. Backend - Service Léa**

```
backend/app/services/lea_service.py
```

**Fonctionnalités** :
- Gestion du contexte de conversation
- Intégration avec AIService existant
- Accès à la base de données via SQLAlchemy
- Fonctions tools pour requêtes DB
- Gestion de la mémoire conversationnelle

**Fonctions Tools disponibles** :
- `search_properties` : Rechercher des biens immobiliers
- `get_agent_info` : Obtenir les infos d'un agent
- `get_property_details` : Détails d'un bien
- `create_note` : Créer une note
- `search_contacts` : Rechercher des contacts
- `get_statistics` : Statistiques immobilières

### **2. Backend - API Endpoints**

```
backend/app/api/v1/endpoints/lea.py
```

**Endpoints** :
- `POST /api/v1/lea/chat` : Chat avec Léa
- `POST /api/v1/lea/voice/transcribe` : Transcription audio → texte
- `POST /api/v1/lea/voice/synthesize` : Texte → audio
- `GET /api/v1/lea/context` : Obtenir le contexte de conversation
- `DELETE /api/v1/lea/context` : Réinitialiser le contexte

### **3. Frontend - Composant Léa**

```
apps/web/src/components/lea/LeaWidget.tsx
apps/web/src/components/lea/LeaChat.tsx
apps/web/src/components/lea/LeaVoice.tsx
```

**Composants** :
- **LeaWidget** : Widget flottant avec bouton d'activation
- **LeaChat** : Interface de chat avec historique
- **LeaVoice** : Contrôles vocaux (microphone, lecture)

### **4. Frontend - Hooks**

```
apps/web/src/hooks/useLea.ts
apps/web/src/hooks/useVoiceRecognition.ts
apps/web/src/hooks/useVoiceSynthesis.ts
```

**Hooks** :
- `useLea` : Gestion de l'état et communication avec Léa
- `useVoiceRecognition` : Reconnaissance vocale navigateur
- `useVoiceSynthesis` : Synthèse vocale navigateur

### **5. Frontend - Page Dédiée**

```
apps/web/src/app/[locale]/dashboard/lea/page.tsx
```

Page dédiée pour une expérience complète avec Léa.

---

## 🔧 Fonctionnalités Détaillées

### **1. Chat Conversationnel**

**Capacités** :
- ✅ Répondre aux questions générales
- ✅ Accéder à la base de données pour répondre
- ✅ Mémoriser le contexte de conversation
- ✅ Comprendre le contexte immobilier
- ✅ Formater les réponses de manière claire

**Exemples de questions** :
- "Combien de biens sont disponibles ?"
- "Montre-moi les biens à Paris"
- "Quels sont les agents actifs ?"
- "Crée une note pour le bien #123"
- "Quelles sont les statistiques de ce mois ?"

### **2. Fonction Vocale**

#### **Speech-to-Text (Écouter)**
- Utilisation de Web Speech API (navigateur)
- Alternative : OpenAI Whisper API (backend)
- Support multilingue (FR, EN)
- Indicateur visuel pendant l'écoute
- Gestion des erreurs de reconnaissance

#### **Text-to-Speech (Parler)**
- Utilisation de Web Speech Synthesis API (navigateur)
- Alternative : OpenAI TTS API (backend)
- Voix naturelle et fluide
- Contrôle de la vitesse et du volume
- Support multilingue

### **3. Accès Base de Données**

**Via OpenAI Function Calling / Anthropic Tools** :

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_properties",
            "description": "Rechercher des biens immobiliers",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"},
                    "price_min": {"type": "number"},
                    "price_max": {"type": "number"},
                    "property_type": {"type": "string"}
                }
            }
        }
    },
    # ... autres fonctions
]
```

**Sécurité** :
- Vérification des permissions utilisateur
- Validation des requêtes SQL
- Protection contre les injections
- Logging des accès DB

### **4. Contexte et Mémoire**

**Gestion du contexte** :
- Stockage de l'historique de conversation (session)
- Contexte utilisateur (nom, rôle, permissions)
- Contexte de la page actuelle
- Limite de tokens pour optimiser les coûts

**Stockage** :
- Redis pour le cache de session (optionnel)
- Base de données pour l'historique long terme
- LocalStorage pour le contexte client

---

## 🎨 Interface Utilisateur

### **Widget Flottant**

**Design** :
- Bouton flottant en bas à droite
- Animation d'apparition/disparition
- Indicateur de statut (écoute, traitement, réponse)
- Badge de notification si nouvelle fonctionnalité

**États** :
- **Fermé** : Bouton rond avec icône microphone
- **Ouvert** : Fenêtre de chat avec historique
- **Écoute** : Animation microphone + indicateur visuel
- **Parole** : Animation onde sonore

### **Interface de Chat**

**Composants** :
- Zone de messages avec historique
- Input texte + bouton microphone
- Boutons d'action rapide
- Indicateur de frappe (typing indicator)
- Timestamps des messages

**Messages** :
- Messages utilisateur (droite)
- Messages Léa (gauche) avec avatar
- Messages système (centré)
- Messages d'erreur (rouge)

---

## 📊 Base de Données

### **Nouvelle Table : `lea_conversations`**

```sql
CREATE TABLE lea_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(255) UNIQUE,
    messages JSONB,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Nouvelle Table : `lea_tools_usage`**

```sql
CREATE TABLE lea_tools_usage (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES lea_conversations(id),
    tool_name VARCHAR(100),
    tool_input JSONB,
    tool_output JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Sécurité

### **Authentification**
- ✅ Utilisateur doit être connecté
- ✅ Vérification du token JWT
- ✅ Rate limiting par utilisateur

### **Autorisations**
- ✅ Vérification des permissions pour accès DB
- ✅ Filtrage des données selon le rôle
- ✅ Validation des requêtes SQL

### **Données Sensibles**
- ✅ Pas d'exposition de mots de passe
- ✅ Masquage des données sensibles dans les réponses
- ✅ Logging sécurisé

---

## 🚀 Plan d'Implémentation

### **Phase 1 : Fondations (Semaine 1)**
- [ ] Créer le service `LeaService` backend
- [ ] Créer les endpoints API de base
- [ ] Créer le composant `LeaWidget` frontend
- [ ] Intégration avec AIService existant
- [ ] Tests unitaires backend

### **Phase 2 : Chat et Base de Données (Semaine 2)**
- [ ] Implémenter les fonctions tools pour DB
- [ ] Créer le composant `LeaChat`
- [ ] Gestion du contexte conversationnel
- [ ] Tests d'intégration DB
- [ ] Documentation API

### **Phase 3 : Fonction Vocale (Semaine 3)**
- [ ] Intégration Web Speech API (STT)
- [ ] Intégration Web Speech Synthesis (TTS)
- [ ] Créer le composant `LeaVoice`
- [ ] Gestion des erreurs vocales
- [ ] Tests vocaux navigateur

### **Phase 4 : Intégration Globale (Semaine 4)**
- [ ] Ajouter Léa dans le layout principal
- [ ] Créer la page dédiée `/dashboard/lea`
- [ ] Optimisation des performances
- [ ] Tests end-to-end
- [ ] Documentation utilisateur

### **Phase 5 : Améliorations (Semaine 5+)**
- [ ] Support multilingue avancé
- [ ] Personnalisation de la voix
- [ ] Suggestions de questions
- [ ] Analytics et métriques
- [ ] Amélioration continue

---

## 📝 Exemples d'Utilisation

### **Exemple 1 : Recherche de Biens**

**Utilisateur** : "Montre-moi les appartements à Paris sous 500 000€"

**Léa** : 
1. Appelle `search_properties(city="Paris", price_max=500000, property_type="appartement")
2. Récupère les résultats de la DB
3. Formate la réponse : "J'ai trouvé 12 appartements à Paris sous 500 000€. Voici les 5 premiers..."

### **Exemple 2 : Information Agent**

**Utilisateur** : "Qui est l'agent Marie Dupont ?"

**Léa** :
1. Appelle `get_agent_info(name="Marie Dupont")
2. Récupère les infos de l'agent
3. Répond : "Marie Dupont est agent immobilier depuis 2020. Elle travaille pour l'agence..."

### **Exemple 3 : Création de Note**

**Utilisateur** : "Note pour le bien #123 : Visite prévue demain à 14h"

**Léa** :
1. Appelle `create_note(property_id=123, content="Visite prévue demain à 14h")
2. Crée la note en DB
3. Confirme : "Note créée avec succès pour le bien #123"

---

## 🧪 Tests

### **Tests Backend**
- Tests unitaires du `LeaService`
- Tests des fonctions tools
- Tests d'intégration avec DB
- Tests de sécurité

### **Tests Frontend**
- Tests des composants React
- Tests de la reconnaissance vocale
- Tests de la synthèse vocale
- Tests d'intégration E2E

---

## 📚 Documentation

### **Pour les Développeurs**
- Guide d'architecture
- Documentation API
- Guide d'ajout de nouvelles fonctions tools
- Guide de personnalisation

### **Pour les Utilisateurs**
- Guide d'utilisation de Léa
- FAQ
- Exemples de questions
- Guide de la fonction vocale

---

## 💰 Coûts et Optimisations

### **Coûts API**
- OpenAI GPT-4o : ~$0.01-0.03 par conversation
- Whisper API : ~$0.006 par minute audio
- TTS API : ~$0.015 par 1000 caractères

### **Optimisations**
- Cache des réponses fréquentes
- Limite de tokens par conversation
- Compression du contexte
- Batch processing pour les requêtes DB

---

## 🎯 Métriques de Succès

- **Taux de satisfaction** : > 80%
- **Temps de réponse** : < 2 secondes
- **Précision des réponses** : > 90%
- **Taux d'utilisation vocale** : > 30%
- **Taux d'erreur** : < 5%

---

## 🔄 Évolutions Futures

1. **Multimodal** : Support images et documents
2. **Apprentissage** : Amélioration continue via feedback
3. **Personnalisation** : Adaptation au style de l'utilisateur
4. **Intégrations** : CRM, calendrier, emails
5. **Mobile** : Application mobile native

---

## 📞 Support

Pour toute question sur l'implémentation de Léa :
- Documentation technique : `/docs/LEA_AI_AGENT_PLAN.md`
- Code source : `backend/app/services/lea_service.py`
- Composants : `apps/web/src/components/lea/`

---

**Version** : 1.0  
**Date** : 2026-01-31  
**Auteur** : Équipe ImmoAssist
