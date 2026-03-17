# Audit de performance – ImmoAssist (web + backend)

**Date :** 1er mars 2025  
**Périmètre :** `apps/web` (Next.js 16), `backend` (FastAPI)

---

## Résumé exécutif

Le site peut paraître lent à cause de plusieurs facteurs cumulés : **chargement initial lourd** (layout, i18n, widgets globaux), **requêtes en cascade** au chargement (auth, notifications, dashboard), **double rendu du widget Léa** sur le dashboard, et **pas de mise en cache** côté backend pour des données répétées. Les correctifs ci‑dessous sont classés par impact estimé.

---

## 1. Frontend (Next.js)

### 1.1 Layout racine et blocage du premier rendu

**Fichier :** `apps/web/src/app/[locale]/layout.tsx`

- **`getMessages()`** est appelé à chaque requête et charge tout le fichier de traduction (`messages/{locale}.json`, ~16 Ko pour `fr.json`). Cela bloque le rendu jusqu’à résolution.
- **Tout le contenu des messages** est passé au client via `NextIntlClientProvider`, ce qui augmente la taille du HTML et du payload initial.

**Recommandations :**

- Utiliser des **namespaces** (next-intl) pour ne charger que les clés nécessaires à la page courante.
- Ou au minimum **ne pas passer tous les messages** au client : garder les messages critiques côté serveur et n’envoyer que le namespace requis pour la route.

---

### 1.2 Widget Léa rendu en double sur le dashboard

**Fichiers :**  
`apps/web/src/app/[locale]/layout.tsx` (ligne 275)  
`apps/web/src/components/layout/DashboardLayout.tsx` (ligne 152)

Sur les pages sous `/dashboard`, **deux instances de `LeaWidget`** sont montées : une dans le layout global `[locale]`, une dans `DashboardLayout`. Cela double le coût (DOM, listeners, risque de double connexion si un jour il y a un socket).

**Recommandation :**  
Ne garder `LeaWidget` que dans **un seul** endroit. Par exemple :

- soit uniquement dans `[locale]/layout.tsx` (présent sur tout le site),
- soit uniquement dans `DashboardLayout` pour les pages dashboard, et ne pas le mettre dans le layout global.

À trancher selon le besoin produit (Léa sur toutes les pages ou seulement dashboard).

---

### 1.3 Widget Léa et bundle initial

**Fichiers :**  
`apps/web/src/components/lea/LeaWidget.tsx`, `LeaChat.tsx`

- `LeaWidget` est importé de façon statique dans le layout, donc **toujours dans le bundle de la page** (même quand l’utilisateur n’ouvre pas Léa).
- `LeaChat` (et ses hooks : `useLea`, `useVoiceRecognition`, `useVoiceSynthesis`, `useVoiceRecording`) ne sont chargés qu’à l’ouverture du widget, mais le **bouton du widget** et sa logique sont déjà dans le chunk principal.

**Recommandation :**  
Charger le widget en **dynamic import** avec `next/dynamic` et `ssr: false`, pour que tout le code Léa (y compris le bouton flottant) soit dans un chunk séparé et ne bloque pas le First Load JS.

Exemple :

```tsx
const LeaWidget = dynamic(() => import('@/components/lea/LeaWidget'), { ssr: false });
```

---

### 1.4 Page d’accueil : trop de sections et Framer Motion

**Fichier :**  
`apps/web/src/app/[locale]/page.tsx`  
Composants : `HeroSection`, `LogosSection`, `ProblemSection`, `FeaturesSection`, `BenefitsSection`, `TestimonialsSection`, `PricingSection`, `CtaSection`.

- **Huit sections** rendues d’un coup, chacune utilisant **framer-motion** (`motion`). Cela augmente fortement le JavaScript initial et le travail au premier paint.
- Pas de lazy loading des sections sous le fold.

**Recommandations :**

- **Lazy loader** les sections sous le fold (ex. à partir de `ProblemSection` ou `FeaturesSection`) avec `next/dynamic` ou un wrapper avec Intersection Observer.
- Réduire l’usage de `motion` sur la landing (animations plus légères ou CSS uniquement pour le premier écran).

---

### 1.5 Dashboard : pas de React Query, requêtes en cascade

**Fichier :**  
`apps/web/src/app/[locale]/dashboard/page.tsx`

- Les stats sont chargées dans un `useEffect` avec `getBrokerDashboardStats()`, **sans React Query**.
- Pas de cache partagé, pas de `staleTime` : chaque visite refait un fetch complet.
- Le **AuthInitializer** peut avoir déjà déclenché `getMe()` (ou refresh) au chargement ; ensuite le dashboard lance son propre fetch → **waterfall** et sentiment de lenteur.

**Recommandations :**

- Utiliser **React Query** (déjà en place) pour `getBrokerDashboardStats` : `useQuery` avec une clé dédiée, `staleTime` raisonnable (ex. 60–120 s).
- Optionnel : précharger les stats dashboard depuis le layout (prefetch) pour les afficher plus tôt.

---

### 1.6 Header et cloche de notifications

**Fichiers :**  
`apps/web/src/components/layout/Header.tsx`  
`apps/web/src/components/notifications/NotificationBellConnected.tsx`  
`apps/web/src/hooks/useNotifications.ts`

- Sur **toutes les pages publiques** avec header, `NotificationBellConnected` est monté avec :
  - **autoFetch: true** → un fetch des notifications au mount ;
  - **enableWebSocket: true** → connexion WebSocket ;
  - **pollInterval: 60000** → polling toutes les 60 s.
- Donc : **requête + WebSocket** dès la première page, même si l’utilisateur ne regarde pas les notifications.

**Recommandations :**

- Réduire la priorité : par exemple **ne pas** ouvrir le WebSocket tant que l’utilisateur n’a pas interagi avec la cloche (hover/click) ou après un court délai.
- Garder le premier fetch pour le badge (unread count) mais éventuellement le faire en **low priority** ou après le premier paint (requestIdleCallback ou setTimeout court).
- Augmenter `pollInterval` si 60 s n’est pas indispensable (ex. 2–5 min).

---

### 1.7 AuthInitializer : plusieurs appels API au chargement

**Fichier :**  
`apps/web/src/components/auth/AuthInitializer.tsx`

- Au chargement, si un token existe, l’initializer peut enchaîner : **refresh**, **getMe()**, et éventuellement **getMe() encore** pour “vérifier” le token. Cela crée une **séquence d’appels** avant que l’UI soit considérée comme prête.
- Les composants qui dépendent de `user` (Header, Dashboard, etc.) attendent cette initialisation.

**Recommandations :**

- Éviter un second **getMe()** si on vient de faire un refresh qui a déjà renvoyé l’utilisateur.
- Si la “vérification” du token est optionnelle, la faire en **déferred** (après premier rendu) ou avec un **staleTime** côté client pour ne pas refaire getMe() à chaque rechargement dans la même session.

---

### 1.8 Preconnect / preload dupliqués

**Fichiers :**  
`apps/web/src/app/[locale]/layout.tsx` (preconnect API + fonts dans `<head>`)  
`apps/web/src/components/performance/PerformanceScripts.tsx`  
`apps/web/src/lib/performance/resourceHints.tsx`  
`apps/web/src/lib/performance/preloading.ts` → `initializePreloading()`

- Le **layout** ajoute déjà `dns-prefetch` + `preconnect` pour l’API et les fonts.
- **PerformanceScripts** et **ResourceHints** appellent tous deux **initializePreloading()**, qui réinjecte des preconnect (API, fonts). On se retrouve avec des **doublons** dans le `<head>`.

**Recommandation :**  
Centraliser les preconnect/preload en un seul endroit (idéalement dans le layout serveur) et retirer les appels redondants dans PerformanceScripts et ResourceHints, ou faire en sorte qu’ils n’ajoutent que des hints non déjà présents.

---

### 1.9 React Query : refetch agressif

**Fichier :**  
`apps/web/src/lib/query/queryClient.ts`

- `refetchOnMount: true` et `refetchOnWindowFocus: true` (en prod) : chaque changement d’onglet ou de page peut déclencher des refetches. Combiné à beaucoup de composants utilisant des queries, cela peut générer **beaucoup de requêtes** et donner une impression de lenteur.

**Recommandation :**  
Pour les données “globales” ou peu volatiles (profil, stats dashboard), utiliser un **staleTime** plus long (2–5 min) et éventuellement désactiver `refetchOnWindowFocus` pour ces queries spécifiques.

---

### 1.10 Dashboard entièrement en client

**Fichiers :**  
`apps/web/src/app/[locale]/dashboard/layout.tsx`  
`apps/web/src/components/layout/DashboardLayout.tsx`

- Le layout du dashboard est **'use client'** et le **DashboardLayout** est un gros composant client (sidebar, header, Léa). Tout le dashboard est donc **client-rendered** : plus de JS à télécharger et exécuter avant d’afficher la page.

**Recommandation (long terme) :**  
Envisager de garder le layout en Server Component et de n’utiliser `'use client'` que pour les parties interactives (sidebar, header, widgets). Cela réduirait le bundle initial des pages dashboard.

---

## 2. Backend (FastAPI)

### 2.1 Léa – Contexte utilisateur et streaming

**Fichier :**  
`backend/app/api/v1/endpoints/lea.py`

- **get_lea_user_context()** exécute **2 requêtes SQL** (transactions immo + portail) à **chaque** message Léa (chat et stream). Pas de cache.
- **lea_chat_stream** appelle en plus **maybe_create_transaction_from_lea()** puis **get_lea_user_context()** avant de lancer le stream → latence perçue avant le premier token.

**Recommandations :**

- **Mettre en cache** le contexte utilisateur (ex. Redis ou cache en mémoire) avec une TTL courte (30–60 s) et une clé `user_id` (et invalidation à la création/modification de transaction).
- Pour le stream, si possible préparer le contexte en parallèle du premier chunk LLM, ou au minimum éviter de refaire les mêmes requêtes à chaque message dans une même session (session_id).

---

### 2.2 Léa – Agent externe et timeouts

**Fichier :**  
`backend/app/api/v1/endpoints/lea.py`

- **Chat externe :** `httpx.AsyncClient(timeout=60.0)`.
- **Voice externe :** `timeout=90.0`.

Si l’agent externe est lent ou surchargé, l’utilisateur attend longtemps sans feedback (surtout en non-streaming).

**Recommandations :**

- S’assurer que le **streaming** est utilisé côté front dès que le backend expose `/chat/stream`, pour afficher les tokens au fur et à mesure.
- Envisager un timeout plus court (ex. 30 s) avec une réponse d’erreur claire, et un retry ou message “Léa est très sollicitée, réessayez dans un instant”.

---

### 2.3 Endpoint dashboard stats

**Côté front :**  
`getBrokerDashboardStats()` est appelé depuis le dashboard sans cache (voir 1.5).

**Côté backend :**  
Si l’endpoint sous-jacent fait des agrégations lourdes (COUNT, SUM sur de grosses tables), chaque visite génère ce coût.

**Recommandations :**

- Vérifier que l’endpoint dashboard est **indexé** (filtres sur `user_id`, dates si pertinent).
- Ajouter un **cache court** (30–60 s) côté backend pour les stats dashboard par utilisateur, si les données peuvent être légèrement stale.

---

## 3. Synthèse des priorités

| Priorité | Action | Impact estimé |
|----------|--------|----------------|
| **P0** | Supprimer le double `LeaWidget` (layout vs DashboardLayout) | Moins de DOM et de code exécuté sur le dashboard |
| **P0** | Charger le widget Léa en `dynamic(..., { ssr: false })` | Réduction du First Load JS |
| **P1** | Dashboard : utiliser React Query pour les stats + staleTime | Moins de waterfall, réutilisation du cache |
| **P1** | Réduire/retarder fetch + WebSocket des notifications (Header) | Moins de requêtes au premier chargement |
| **P1** | Éviter double getMe() dans AuthInitializer | Chargement perçu plus rapide |
| **P2** | i18n : namespaces ou messages partiels au lieu de tout charger | Réduction du blocage et de la taille du payload |
| **P2** | Lazy load des sections sous le fold sur la landing + alléger Framer Motion | Meilleur LCP et FID sur la home |
| **P2** | Backend Léa : cache du contexte utilisateur (Redis/mémoire) | Réponse Léa plus rapide |
| **P3** | Centraliser preconnect/preload, supprimer doublons | Code plus propre, moins de travail inutile |
| **P3** | React Query : staleTime plus long pour profil/stats | Moins de refetches inutiles |

---

## 4. Métriques à suivre

- **LCP** (Largest Contentful Paint) : cible &lt; 2,5 s.
- **FID** (First Input Delay) / **INP** : cible &lt; 100 ms.
- **CLS** (Cumulative Layout Shift) : cible &lt; 0,1.
- **First Load JS** (Next.js build) : viser &lt; 200 Ko par route si possible.
- **Time to First Byte (TTFB)** et **durée des requêtes API** critiques (auth, dashboard, Léa).

L’app a déjà un **WebVitalsReporter** et un script **check-bundle-size** ; les intégrer dans la CI et un dashboard (ex. Sentry ou RUM) aidera à ne pas régresser après les optimisations.

---

*Document généré dans le cadre d’un audit de performance du projet ImmoAssist.*
