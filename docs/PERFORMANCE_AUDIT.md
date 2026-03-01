# Audit de performance – ImmoAssist (Next.js 16)

**Date :** 2026-03-01  
**Contexte :** Site perçu comme lent ; audit du frontend (apps/web) et des pratiques côté client/serveur.

---

## 1. Résumé exécutif

| Zone | État | Impact estimé |
|------|------|----------------|
| Premier chargement (LCP/FCP) | À améliorer | Élevé |
| Navigation / transitions | Moyen | Moyen |
| Données (React Query / API) | Correct | Moyen |
| Bundle JS (taille / découpage) | Bon (optimizations en place) | Faible à moyen |
| Serveur / middleware | À surveiller | Moyen |

**Causes probables de lenteur perçue :**
- Layout racine lourd : messages i18n chargés à chaque requête sans cache explicite.
- Beaucoup de routes en `force-dynamic` (dashboard, admin, settings) → pas de mise en cache HTML.
- Header/Footer et providers chargés en bloc sur toutes les pages publiques.
- `refetchOnMount: true` partout → refetch systématique à chaque entrée de page (si données > 2 min).
- Middleware sur presque toutes les requêtes (i18n + vérification JWT sur `/api/*`).

---

## 2. Ce qui est déjà bien en place

- **next/font** : Inter avec `display: 'swap'`, preload, `adjustFontFallback`.
- **Images** : next.config avec AVIF/Webp, `optimizePackageImports` (lucide-react, react-query, zod, recharts, etc.).
- **Code splitting** : `splitChunks` (framework, libs, ui-libs), `BelowFoldSections` et `LeaWidget` en `next/dynamic` avec `ssr: false` où pertinent.
- **Build** : `productionBrowserSourceMaps: false`, `removeConsole` en prod, cache webpack filesystem.
- **Landing** : Hero au-dessus de la ligne de flottaison, sections marketing en lazy load.
- **React Query** : `staleTime: 2 min`, `gcTime: 10 min`, pas de refetch au focus en dev.

---

## 3. Audit détaillé

### 3.1 Chargement initial (FCP / LCP)

- **Layout `[locale]`**  
  - `getMessages()` appelé à chaque rendu (pas de cache explicite dans `getRequestConfig`).  
  - Gros JSON de traduction par locale chargé côté serveur à chaque requête.  
  - **Recommandation :** Mettre en cache le résultat de `getRequestConfig` (ex. `unstable_cache` avec clé par locale) pour éviter de relire/réévaluer les messages à chaque hit.

- **Head**  
  - Script thème inline (nécessaire pour éviter le flash).  
  - Préconnexions API + fonts.googleapis/gstatic (utile).  
  - Beaucoup de variables CSS en inline : acceptable pour éviter le flash, à garder.

- **Composants globaux**  
  - `App` → `Header` + `Footer` importés statiquement sur toutes les pages publiques.  
  - `LeaWidgetDynamic` déjà en dynamic.  
  - **Recommandation :** Envisager un chargement différé de Header/Footer (ex. `next/dynamic` avec `loading` pour éviter CLS) pour réduire le JS critique au premier paint, ou au minimum alléger les imports du Header (ex. NotificationBell en lazy).

- **Fonts**  
  - Inter via next/font (optimal).  
  - Thème peut injecter d’autres Google Fonts dynamiquement → risque de requêtes supplémentaires et de décalage. Vérifier que seules les polices nécessaires sont chargées et, si possible, les regrouper ou utiliser next/font pour les polices secondaires.

### 3.2 Navigation et données

- **React Query**  
  - `refetchOnMount: true` par défaut → à chaque visite de page, les queries “stale” (après 2 min) refont un fetch.  
  - **Recommandation :** Pour les listes/dashboard peu critiques, augmenter `staleTime` (ex. 5 min) ou utiliser `refetchOnMount: false` sur des queries précises pour limiter les refetch en navigation.

- **Segments dynamiques**  
  - Dashboard, admin, settings, profile, etc. en `force-dynamic` → pas de cache HTML. Cohérent pour une app authentifiée, mais tout le coût est reporté sur le serveur et le client.  
  - **Recommandation :** Garder `force-dynamic` où la fraîcheur est requise ; pour les pages “semi-statiques” (ex. contenu docs), envisager `revalidate` (ISR) si applicable.

### 3.3 Bundle et dépendances

- **Optimisations**  
  - `optimizePackageImports` pour lucide-react, @tanstack/react-query, zod, clsx, next-intl, recharts.  
  - Pas de `framer-motion` dans cette liste : utilisé dans plusieurs sections marketing (Hero, Features, etc.).  
  - **Recommandation :** Lancer un build avec `ANALYZE=true` et `BUNDLE_ANALYZE=browser` pour identifier les gros chunks et décider d’un lazy load ciblé (ex. framer-motion uniquement dans les sections déjà dynamiques).

- **Composants lourds**  
  - Sections marketing (Hero, Features, Testimonials, etc.) utilisent framer-motion ; en dessous de la fold c’est déjà dans `BelowFoldSections` (dynamic).  
  - **HeroSection** reste above-the-fold avec framer-motion : si le bundle Hero est gros, envisager une version “light” sans animations pour le premier frame, ou lazy load des animations après LCP.

### 3.4 Middleware et API

- **Middleware**  
  - S’exécute sur presque toutes les routes (sauf api, _next/static, _next/image, certains fichiers statiques).  
  - Pour les pages : next-intl uniquement.  
  - Pour `/api/*` : vérification JWT sur chaque requête API (hors `/api/auth`).  
  - **Recommandation :** S’assurer que `verifyToken` est rapide (cache de clés, pas d’I/O superflu). Si les appels API sont très fréquents, un cache court (ex. 1 min) du résultat de vérification par token pourrait réduire la charge.

- **Headers**  
  - CSP, HSTS, etc. en place. Pas de cache long sur les réponses HTML (volontaire pour les pages dynamiques).

### 3.5 Images

- **next/image** utilisé à plusieurs endroits ; certains composants (Avatar, MediaLibrary, Card, etc.) utilisent encore `<img>`.  
- **Recommandation :** Remplacer les `<img>` par `next/image` où c’est pertinent (surtout listes/grilles) pour profiter du lazy loading et des formats modernes.

---

## 4. Recommandations prioritaires

### Priorité 1 (impact élevé, effort modéré)

1. **Cache des messages i18n**  
   Dans `src/i18n/request.ts`, envelopper le chargement des messages (et le retour de `getRequestConfig`) dans `unstable_cache` (Next.js) avec une clé par `locale` et un TTL raisonnable (ex. 3600). Réduit le travail serveur et la latence sur chaque requête.

2. **Réduire les refetch systématiques**  
   Soit augmenter le `staleTime` global (ex. 5 min) dans `queryClient.ts`, soit garder 2 min et définir un `staleTime` plus long (ou `refetchOnMount: false`) pour les queries de listes/dashboard peu critiques.

3. **Lazy load des parties lourdes du Header**  
   Charger `NotificationBellConnected` (et éventuellement d’autres blocs non critiques) en `next/dynamic` avec `ssr: false` pour ne pas bloquer le premier rendu.

### Priorité 2 (impact moyen)

4. **Analyse de bundle**  
   Lancer `ANALYZE=true pnpm build` (avec `BUNDLE_ANALYZE=browser`) et traquer les chunks > 200–300 KB. Ensuite : lazy load ou optimisation des imports (framer-motion, recharts, etc.).

5. **Optimiser les fonts du thème**  
   Si le thème charge des polices Google en plus d’Inter, les limiter ou les charger via next/font pour éviter requêtes bloquantes et FOUT.

6. **Remplacer `<img>` par `next/image`**  
   Cibler en priorité les composants utilisés dans des listes (Avatar, Card, MediaLibrary).

### Priorité 3 (surveillance)

7. **Métriques réelles**  
   Utiliser Web Vitals (déjà en place) et Sentry pour suivre LCP, FID, CLS et temps de réponse API en production. Définir des objectifs (ex. LCP < 2.5 s, FID < 100 ms).

8. **Cache / performance API**  
   Si le backend le permet, ajouter des en-têtes `Cache-Control` (ou ETag) sur les endpoints de lecture peu volatils pour permettre le cache navigateur ou un cache intermédiaire.

---

## 5. Quick wins à mettre en œuvre en premier

- [x] **Cache i18n** : `unstable_cache` dans `getRequestConfig` pour les messages (revalidate 1h).
- [x] **Header** : Lazy load de `NotificationBellConnected` via `next/dynamic` (ssr: false).
- [x] **React Query** : `staleTime` passé à 5 min pour limiter les refetch en navigation.
- [ ] **Bundle** : Lancer l’analyse de bundle et documenter les 5 plus gros chunks côté client.

---

## 6. Commandes utiles

```bash
# Analyse du bundle client
cd apps/web && ANALYZE=true BUNDLE_ANALYZE=browser pnpm build

# Build production (avec NODE_OPTIONS si besoin)
USE_WEBPACK=true pnpm build
```

---

*Document généré dans le cadre de l’audit de performance. À mettre à jour après mise en œuvre des recommandations.*
