# Plan UX – Conversation Léa : fluide, facile, agréable

Objectif : rapprocher l’expérience au maximum d’une **vraie conversation** (fluide, claire, rassurante), tout en restant simple et accessible.

---

## 0. Cible : page Léa2

**L’UX fluide doit être livrée en priorité sur la page Léa2** :

| Élément | Détail |
|--------|--------|
| **Route** | `/dashboard/lea2` |
| **Composant** | `Lea2View` (`apps/web/src/components/lea/Lea2View.tsx`) |
| **Rôle** | Interface voice-first (grand micro central, thème sombre). Utilise déjà `useLea`, enregistrement et reconnaissance vocale. |

Toutes les actions du plan UX (scroll, indicateurs “Léa rédige” / “Léa parle”, erreurs inline, streaming visuel) doivent être **appliquées ou vérifiées sur Léa2**. Les composants partagés (`LeaMessageBubble`, `useLea`) profitent aussi à la page Léa classique (`LeaChat` / `LeaConversationView`).

---

## 1. Principes directeurs

| Principe | Application |
|----------|-------------|
| **Fluidité** | Pas de blocages visuels, feedback immédiat, scroll et transitions douces. |
| **Clarté** | Toujours savoir qui parle, qui écoute, qui traite (Léa / vous / en cours). |
| **Simplicité** | Un champ + un micro + envoi ; pas de modes cachés ni d’options dispersées. |
| **Agrément** | Animations légères, voix de qualité, ton cohérent et messages rassurants. |

---

## 2. État actuel (synthèse)

- **Points forts** : streaming texte, curseur pendant la génération, boutons vocaux, header avec Léa, welcome screen.
- **À améliorer** : scroll pendant le stream, entrée/sortie des bulles, indicateurs vocaux, zone de saisie, gestion erreurs, cohérence welcome ↔ conversation.

---

## 3. Plan par thèmes

### 3.1 Fluidité de la conversation (priorité haute)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 1 | **Scroll pendant le stream** | Pendant que le texte de Léa s’écrit, garder la fin du message visible (scroll doux et continu si besoin, pas seulement à la fin). | `LeaMessagesList.tsx`, `useLea` (fréquence des mises à jour) |
| 2 | **Animation d’apparition des bulles** | Nouvelle bulle : léger fade + slide court (ex. 200–300 ms) pour éviter l’effet “pop”. | `LeaMessageBubble.tsx`, CSS / Tailwind `animate-in` |
| 3 | **Pas de saut de layout** | Réserver une hauteur min pour la bulle assistant en cours (streaming) pour éviter que la zone saute à chaque token. | `LeaMessageBubble.tsx`, `LeaMessagesList.tsx` |
| 4 | **Curseur de stream plus lisible** | Rendre le curseur clignotant plus visible et cohérent avec le thème (couleur, épaisseur). | `LeaMessageBubble.tsx` |

### 3.2 Zone de saisie et envoi (priorité haute)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 5 | **Une seule barre de saisie** | Conserver un seul bloc : champ de texte + micro + envoi. Réduire la duplication (ex. gros bouton “Parlez à Léa” au-dessus) ou le rendre secondaire / contextuel. | `LeaChatInput.tsx` |
| 6 | **Focus et Entrée** | Garder le focus dans le champ après envoi ; Enter envoie, pas de ligne vide non voulue. Comportement identique sur welcome et dans la conversation. | `LeaChatInput.tsx`, `LeaWelcomeScreen.tsx` |
| 7 | **Champ multi-lignes optionnel** | Permettre un `<textarea>` avec hauteur auto (1–3 lignes) pour les messages longs, tout en gardant un look “barre de conversation”. | `LeaChatInput.tsx` |
| 8 | **État désactivé clair** | Pendant chargement / enregistrement : champ et boutons désactivés avec état visuel explicite (opacité, curseur, aria-disabled). | `LeaChatInput.tsx` |

### 3.3 Indicateurs et feedback (priorité haute)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 9 | **“Léa réfléchit”** | Quand on attend la première réponse (pas encore de bulle assistant), afficher une bulle type “typing” (3 points animés ou avatar + “Léa rédige...”) au lieu d’un simple spinner. | `LeaMessagesList.tsx` |
| 10 | **“Léa parle”** | Quand la TTS lit la réponse : indicateur compact (icône + “Léa parle”) proche de la dernière bulle ou dans le header, avec bouton “Arrêter” toujours visible. | `LeaChatInput.tsx`, `LeaConversationHeader.tsx` |
| 11 | **Vocal : écoute / enregistrement** | États très clairs : “Léa vous écoute” vs “Enregistrement en cours – arrêter pour envoyer”. Une seule bannière à la fois, message court. | `LeaChatInput.tsx` |
| 12 | **Erreurs inline** | En cas d’erreur, message sous la barre de saisie ou sous la dernière bulle, avec possibilité de “Réessayer” sans effacer le message. | `LeaConversationView.tsx`, `useLea.ts` |

### 3.4 Bulles et lisibilité (priorité moyenne)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 13 | **Style des bulles** | Différenciation nette user (ex. gradient) / Léa (fond neutre, bordure). Coins arrondis homogènes, ombre légère. | `LeaMessageBubble.tsx` |
| 14 | **Horodatage optionnel** | Afficher l’heure sur hover ou en petit sous la bulle, pour ne pas encombrer. | `LeaMessageBubble.tsx` |
| 15 | **Avatar Léa** | Petite image ou icône à gauche des bulles assistant pour renforcer l’identité “Léa”. | `LeaMessageBubble.tsx`, `LeaConversationHeader.tsx` |
| 16 | **Longs messages** | Si la réponse est très longue, envisager “Lire la suite” ou hauteur max avec scroll interne pour garder la page prévisible. | `LeaMessageBubble.tsx` (optionnel) |

### 3.5 Welcome → Conversation (priorité moyenne)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 17 | **Transition welcome → chat** | Au premier envoi, transition douce (fade ou slide) du welcome vers la vue conversation, sans rechargement brutal. | `LeaChat.tsx`, `LeaWelcomeScreen.tsx`, `LeaConversationView.tsx` |
| 18 | **Suggestions cliquables** | Sur le welcome, garder des suggestions courtes (“Questions fréquentes”, “Expliquer un document”) qui pré-remplissent ou envoient directement le message. | `LeaWelcomeScreen.tsx` |
| 19 | **Message vide** | Si l’utilisateur envoie un message vide (ou seulement des espaces), ne pas envoyer et donner un feedback court (ex. placeholder ou petit toast). | `LeaChatInput.tsx`, `useLea.ts` |

### 3.6 Vocale de bout en bout (priorité moyenne)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 20 | **Un flux vocal cohérent** | Après un message vocal : afficher la transcription → bulle user → “Léa rédige...” → bulle assistant → lecture TTS. Enchaînement clair sans trous. | `useLea.ts`, `LeaMessagesList.tsx` |
| 21 | **Son désactivé** | Si TTS désactivé, ne pas lancer la lecture ; optionnel : petit rappel “Réponse prête – activer le son pour écouter”. | `LeaChat.tsx`, `useVoiceSynthesis.ts` |
| 22 | **Feedback enregistrement** | Pendant l’enregistrement, niveau ou indicateur visuel (barre, vague) pour confirmer que le micro capte. | `LeaChatInput.tsx`, `useVoiceRecording.ts` (si données dispo) |

### 3.7 Accessibilité et robustesse (priorité moyenne)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 23 | **Labels et roles** | Zone de saisie avec `aria-label`, boutons avec `aria-label` / titre, liste de messages en `role="log"` ou `region` avec `aria-label`. | Tous les composants Lea |
| 24 | **Focus après envoi** | Après envoi d’un message, focus reste dans le champ (ou sur “Réessayer” en cas d’erreur). | `LeaChatInput.tsx` |
| 25 | **Contraste et taille** | Vérifier contraste des bulles et des boutons (texte / fond) et taille minimale des zones cliquables (44px cible). | CSS / thème |

### 3.8 Polish et agrément (priorité basse)

| # | Action | Description | Fichiers / zone |
|---|--------|-------------|------------------|
| 26 | **Micro-interactions** | Clic sur Envoyer : léger feedback (scale ou icône courte) avant le chargement. | `LeaChatInput.tsx` |
| 27 | **Cohérence des durées** | Centraliser les durées d’animation (ex. 200 ms pour les transitions de bulles, 150 ms pour les hovers). | Variables CSS ou thème Tailwind |
| 28 | **Réduction des mouvements** | Respecter `prefers-reduced-motion` : désactiver ou simplifier les animations si l’utilisateur l’a demandé. | Composants Lea, CSS |

---

## 4. Phasage proposé

### Phase 1 – Fluidité de base (1–2 jours)
- 1 – Scroll pendant le stream  
- 2 – Animation d’apparition des bulles  
- 9 – Indicateur “Léa rédige...”  
- 12 – Erreurs inline + Réessayer  

### Phase 2 – Saisie et feedback (1 jour)
- 5 – Simplifier la barre (une seule zone claire)  
- 6 – Focus et Enter  
- 8 – États désactivés clairs  
- 10 – “Léa parle” visible et cohérent  

### Phase 3 – Vocale et clarté (1 jour)
- 11 – Bannières écoute / enregistrement  
- 20 – Enchaînement vocal clair  
- 13 – Style bulles + 15 – Avatar Léa (optionnel)  

### Phase 4 – Welcome et polish (0,5–1 jour)
- 17 – Transition welcome → conversation  
- 18 – Suggestions cliquables  
- 26 – Micro-interactions  
- 27 – Durées d’animation cohérentes  

### Phase 5 – Accessibilité et optionnel
- 23 – 25 – A11y et contraste  
- 28 – prefers-reduced-motion  
- 7 – Textarea multi-lignes  
- 16 – Longs messages (si besoin)  

---

## 5. Métriques de succès (qualitatives)

- La conversation donne l’impression d’un **échange continu** (pas de “clics inutiles” ni d’attente sans feedback).  
- L’utilisateur comprend **à tout moment** qui parle, qui écoute et si quelque chose est en cours.  
- Le **passage texte ↔ vocal** est évident (même barre, même flux).  
- Les **erreurs** sont rares, compréhensibles et réparables en un clic (Réessayer).  

---

## 6. Fichiers principaux à modifier

| Fichier | Rôles |
|---------|--------|
| **Page cible** | **Léa2** : `apps/web/src/app/[locale]/dashboard/lea2/page.tsx`, `Lea2View.tsx` — s’assurer que tout le flux (stream, vocal, DB) est testé et fonctionnel ici. |
| `LeaMessagesList.tsx` | Scroll, “Léa rédige”, liste et clés |
| `LeaMessageBubble.tsx` | Apparition, style, curseur, avatar |
| `LeaChatInput.tsx` | Barre unique, focus, Enter, états, indicateurs vocaux |
| `LeaConversationView.tsx` | Erreurs inline, structure |
| `LeaConversationHeader.tsx` | “Léa parle”, arrêt TTS |
| `LeaWelcomeScreen.tsx` | Suggestions, transition |
| `LeaChat.tsx` | Transition welcome ↔ conversation, logique vocale |
| `useLea.ts` | Gestion erreurs, retry, pas d’envoi si vide |

**Léa2** : `Lea2View.tsx` utilise déjà `useLea` et les mêmes API ; les améliorations UX (streaming visuel, indicateurs, erreurs) doivent être reflétées dans Léa2 (ex. passer le vrai `isStreaming` aux bulles au lieu de `isStreaming={false}`, scroll pendant le stream, message d’erreur cohérent).

---

*Document préparé pour aligner l’UX de la conversation Léa sur une expérience de type “conversation” : fluide, facile et agréable.*
