# Plan de Refonte Complète de l'UI de Léa

## Problème Actuel

L'interface initiale (salutation, champ de recherche, cartes d'exemples) reste visible même quand une conversation est en cours, ce qui crée une confusion et une mauvaise expérience utilisateur.

## Objectifs

1. **Séparation claire des états** : Interface d'accueil vs Interface de conversation
2. **Transition fluide** entre les deux états
3. **UX optimale** : Chaque état a sa propre interface dédiée
4. **Cohérence visuelle** : Design moderne et professionnel

---

## Architecture Proposée

### États de l'Interface

#### État 1 : Mode Accueil (Aucun message)
- **Affichage** : Interface d'accueil complète
- **Composants** :
  - Icône Sparkles animée
  - Salutation personnalisée
  - Champ de recherche large centré
  - Cartes d'exemples
  - Actions (Joindre, Styles d'écriture, Citation)

#### État 2 : Mode Conversation (Messages présents)
- **Affichage** : Interface de chat classique
- **Composants** :
  - Header avec avatar Léa et actions (Son, Effacer, Fermer)
  - Zone de messages scrollable
  - Champ de saisie fixe en bas
  - Indicateur de frappe/chargement

---

## Structure des Composants

### 1. `LeaChat.tsx` (Composant Principal)
**Responsabilités** :
- Gérer l'état de la conversation (messages présents ou non)
- Afficher conditionnellement `LeaWelcomeScreen` ou `LeaConversationView`
- Gérer les transitions entre les deux modes

**Structure** :
```tsx
<LeaChat>
  {messages.length === 0 ? (
    <LeaWelcomeScreen />
  ) : (
    <LeaConversationView />
  )}
</LeaChat>
```

### 2. `LeaWelcomeScreen.tsx` (Nouveau)
**Responsabilités** :
- Afficher l'interface d'accueil complète
- Gérer la sélection d'exemples et la saisie initiale
- Intégrer la reconnaissance vocale

**Composants inclus** :
- `LeaWelcomeHeader` : Icône + Salutation
- `LeaWelcomeInput` : Champ de recherche avec actions
- `LeaExampleCards` : Cartes d'exemples

### 3. `LeaConversationView.tsx` (Nouveau)
**Responsabilités** :
- Afficher l'interface de conversation
- Gérer l'affichage des messages
- Intégrer le champ de saisie en bas

**Composants inclus** :
- `LeaConversationHeader` : Header avec avatar et actions
- `LeaMessagesList` : Liste des messages scrollable
- `LeaChatInput` : Champ de saisie fixe en bas

### 4. `LeaConversationHeader.tsx` (Nouveau)
**Responsabilités** :
- Afficher l'avatar de Léa
- Afficher les actions (Son, Effacer, Fermer)
- Indiquer l'état de la conversation

### 5. `LeaMessagesList.tsx` (Nouveau)
**Responsabilités** :
- Afficher la liste des messages
- Gérer le scroll automatique
- Afficher les indicateurs de chargement

### 6. `LeaChatInput.tsx` (Nouveau)
**Responsabilités** :
- Champ de saisie avec boutons d'action
- Intégration reconnaissance vocale
- Gestion de l'envoi de messages

### 7. `LeaMessageBubble.tsx` (Nouveau)
**Responsabilités** :
- Afficher un message individuel
- Gérer le style selon le rôle (user/assistant)
- Afficher les timestamps

---

## Détails d'Implémentation

### Phase 1 : Refactorisation de LeaChat.tsx

**Changements** :
1. Ajouter une condition pour afficher `LeaWelcomeScreen` ou `LeaConversationView`
2. Gérer la transition avec animation
3. Déplacer la logique de messages vers `LeaConversationView`

**Code** :
```tsx
export default function LeaChat({ onClose, className = '', initialMessage }: LeaChatProps) {
  const { messages, isLoading, error, sendMessage, clearChat } = useLea();
  // ... autres hooks

  const hasMessages = messages.length > 0;

  return (
    <div className={clsx('flex flex-col h-full min-h-screen bg-background', className)}>
      {!hasMessages ? (
        <LeaWelcomeScreen
          onMessageSend={sendMessage}
          initialMessage={initialMessage}
          // ... autres props
        />
      ) : (
        <LeaConversationView
          messages={messages}
          isLoading={isLoading}
          onMessageSend={sendMessage}
          onClear={clearChat}
          // ... autres props
        />
      )}
    </div>
  );
}
```

### Phase 2 : Création de LeaWelcomeScreen.tsx

**Fonctionnalités** :
- Interface d'accueil complète
- Champ de recherche centré
- Cartes d'exemples
- Actions (Joindre, Styles, Citation)
- Reconnaissance vocale intégrée

**Design** :
- Centré verticalement et horizontalement
- Espacement généreux
- Animations subtiles

### Phase 3 : Création de LeaConversationView.tsx

**Fonctionnalités** :
- Header fixe en haut
- Zone de messages scrollable au centre
- Champ de saisie fixe en bas
- Gestion du scroll automatique

**Design** :
- Layout en colonne (header, messages, input)
- Messages avec bulles de chat
- Indicateurs de chargement

### Phase 4 : Création des Composants de Conversation

**LeaConversationHeader** :
- Avatar de Léa (icône Sparkles ou avatar personnalisé)
- Nom "Léa" + sous-titre "Assistante AI Immobilière"
- Boutons d'action (Son, Effacer, Fermer)

**LeaMessagesList** :
- Container scrollable
- Rendu des messages avec `LeaMessageBubble`
- Indicateur de chargement
- Scroll automatique vers le bas

**LeaChatInput** :
- Champ de texte avec placeholder
- Bouton microphone (si supporté)
- Bouton d'envoi
- Indicateur d'écoute vocale

**LeaMessageBubble** :
- Style différent selon le rôle
- User : Aligné à droite, gradient purple-blue
- Assistant : Aligné à gauche, background muted
- Timestamp optionnel

### Phase 5 : Animations et Transitions

**Transitions** :
- Fade out de l'écran d'accueil
- Fade in de la vue conversation
- Animation des messages qui apparaissent

**Animations** :
- Pulse de l'avatar Léa
- Animation de frappe lors du chargement
- Transition smooth du scroll

---

## Spécifications Techniques

### États et Props

**LeaChat Props** :
```typescript
interface LeaChatProps {
  onClose?: () => void;
  className?: string;
  initialMessage?: string;
}
```

**LeaWelcomeScreen Props** :
```typescript
interface LeaWelcomeScreenProps {
  onMessageSend: (message: string) => Promise<void>;
  initialMessage?: string;
  // Voice recognition props
  // Input handling props
}
```

**LeaConversationView Props** :
```typescript
interface LeaConversationViewProps {
  messages: LeaMessage[];
  isLoading: boolean;
  onMessageSend: (message: string) => Promise<void>;
  onClear: () => void;
  // Voice props
  // Error handling
}
```

### Styles et Classes

**Layout Principal** :
- `h-full min-h-screen` : Hauteur complète
- `flex flex-col` : Layout en colonne
- `bg-background` : Fond selon le thème

**Messages** :
- Container : `flex-1 overflow-y-auto`
- Max-width : `max-w-4xl mx-auto`
- Spacing : `space-y-4`

**Input** :
- Position : `fixed bottom-0` ou `sticky bottom-0`
- Background : `bg-background border-t`
- Padding : `p-4`

---

## Plan d'Implémentation

### Étape 1 : Préparation
- [ ] Créer les fichiers de composants vides
- [ ] Définir les interfaces TypeScript
- [ ] Préparer les imports nécessaires

### Étape 2 : Refactorisation LeaChat
- [ ] Modifier `LeaChat.tsx` pour gérer les deux états
- [ ] Ajouter la logique conditionnelle
- [ ] Tester la transition

### Étape 3 : Création LeaWelcomeScreen
- [ ] Créer `LeaWelcomeScreen.tsx`
- [ ] Intégrer `LeaInitialUI` (refactorisé)
- [ ] Gérer les interactions

### Étape 4 : Création LeaConversationView
- [ ] Créer `LeaConversationView.tsx`
- [ ] Intégrer header, messages, input
- [ ] Gérer le scroll

### Étape 5 : Composants de Conversation
- [ ] Créer `LeaConversationHeader.tsx`
- [ ] Créer `LeaMessagesList.tsx`
- [ ] Créer `LeaChatInput.tsx`
- [ ] Créer `LeaMessageBubble.tsx`

### Étape 6 : Animations et Polish
- [ ] Ajouter les transitions
- [ ] Optimiser les animations
- [ ] Tester sur différents écrans

### Étape 7 : Tests et Ajustements
- [ ] Tester tous les scénarios
- [ ] Corriger les bugs
- [ ] Optimiser les performances

---

## Points d'Attention

1. **Performance** : La liste de messages peut devenir longue, utiliser la virtualisation si nécessaire
2. **Accessibilité** : S'assurer que tous les éléments sont accessibles au clavier et aux lecteurs d'écran
3. **Responsive** : Adapter l'interface pour mobile, tablette et desktop
4. **États de chargement** : Gérer proprement les états de chargement et d'erreur
5. **Reconnaissance vocale** : Intégrer correctement dans les deux modes

---

## Résultat Attendu

### Mode Accueil
- Interface centrée et accueillante
- Champ de recherche proéminent
- Cartes d'exemples visibles
- Aucune distraction

### Mode Conversation
- Interface de chat professionnelle
- Messages clairs et lisibles
- Champ de saisie accessible
- Header avec actions visibles

### Transition
- Fluide et naturelle
- Pas de saut visuel
- Animation subtile

---

## Fichiers à Créer/Modifier

### Nouveaux Fichiers
1. `apps/web/src/components/lea/LeaWelcomeScreen.tsx`
2. `apps/web/src/components/lea/LeaConversationView.tsx`
3. `apps/web/src/components/lea/LeaConversationHeader.tsx`
4. `apps/web/src/components/lea/LeaMessagesList.tsx`
5. `apps/web/src/components/lea/LeaChatInput.tsx`
6. `apps/web/src/components/lea/LeaMessageBubble.tsx`

### Fichiers à Modifier
1. `apps/web/src/components/lea/LeaChat.tsx` - Refactorisation majeure
2. `apps/web/src/components/lea/LeaInitialUI.tsx` - Peut être supprimé ou intégré dans LeaWelcomeScreen

---

## Notes Finales

Cette refonte permettra d'avoir une interface claire et professionnelle, avec une séparation nette entre l'état d'accueil et l'état de conversation. L'utilisateur comprendra immédiatement dans quel mode il se trouve et pourra interagir naturellement avec Léa.
