# Suivi de la Transformation UI - Batches

## Vue d'ensemble

Ce document suit la progression de la transformation UI par batches, avec un push Git à chaque batch complété.

**Date de début** : 2026-02-01  
**Objectif** : Transformer toute l'UI pour adopter le style Dashboard V2 & Transaction Detail

## Structure des Batches

### Batch 1 : Foundation & Design System ✅
**Statut** : Complété  
**Priorité** : CRITIQUE  
**Objectif** : Configurer Tailwind, Theme, et Design Tokens

**Tâches** :
- [x] Configurer Tailwind avec tous les tokens (typographie, border radius, couleurs)
- [x] Mettre à jour `default-theme-config.ts` avec typographie complète (ajout font-light)
- [x] Mettre à jour `tailwind.config.ts` avec font-light (300), rounded-3xl (24px)
- [x] Créer/mettre à jour design tokens (ajout font-light dans tokens.ts)
- [x] Mettre à jour backend `theme_defaults.py` avec font-light
- [x] Tests : Vérifier que les classes fonctionnent (pas d'erreurs linter)

**Fichiers modifiés** :
- ✅ `apps/web/tailwind.config.ts` - Ajout fontWeight.light (300) et borderRadius.3xl (24px)
- ✅ `apps/web/src/lib/theme/default-theme-config.ts` - Ajout font-light dans fontWeight et borderRadius.3xl
- ✅ `apps/web/src/components/ui/tokens.ts` - Ajout font-light dans fontWeight
- ✅ `backend/app/core/theme_defaults.py` - Ajout font-light dans fontWeight

**Commit** : `feat(ui): Batch 1 - Foundation & Design System`

**Résumé des changements** :
- Ajout de `font-light` (300) dans tous les fichiers de configuration
- Ajout de `rounded-3xl` (24px) pour les cards principales
- Configuration complète pour supporter le style Dashboard V2

---

### Batch 2 : Composants UI de Base - Button & Card
**Statut** : En attente  
**Priorité** : HAUTE  
**Objectif** : Transformer Button et Card avec tous les variants

**Tâches** :
- [ ] Transformer Button avec 7 variants documentés
- [ ] Transformer Card avec rounded-3xl, shadow-sm
- [ ] Tests : Vérifier tous les variants de boutons

**Fichiers à modifier** :
- `apps/web/src/components/ui/Button.tsx`
- `apps/web/src/components/ui/Card.tsx`

**Commit** : `feat(ui): Batch 2 - Button & Card components`

---

### Batch 3 : Composants UI de Base - Input, Badge, Tabs
**Statut** : En attente  
**Priorité** : HAUTE  
**Objectif** : Transformer Input, Badge, Tabs

**Tâches** :
- [ ] Transformer Input avec rounded-2xl, bg-gray-50
- [ ] Transformer Badge avec rounded-full et variants colorés
- [ ] Transformer Tabs avec style transaction-detail
- [ ] Tests : Vérifier tous les composants

**Fichiers à modifier** :
- `apps/web/src/components/ui/Input.tsx`
- `apps/web/src/components/ui/Badge.tsx`
- `apps/web/src/components/ui/Tabs.tsx`

**Commit** : `feat(ui): Batch 3 - Input, Badge, Tabs components`

---

### Batch 4 : Menu/Sidebar Navigation (CRITIQUE)
**Statut** : En attente  
**Priorité** : CRITIQUE  
**Objectif** : Transformer Sidebar avec style Menu Demo

**Tâches** :
- [ ] Transformer Sidebar avec items actifs/inactifs
- [ ] Appliquer font-light pour inactifs, font-medium pour actifs
- [ ] Ajouter shadows et transitions
- [ ] Tests : Vérifier menu actif/inactif

**Fichiers à modifier** :
- `apps/web/src/components/ui/Sidebar.tsx`
- `apps/web/src/components/layout/Sidebar.tsx`

**Commit** : `feat(ui): Batch 4 - Menu/Sidebar Navigation`

---

### Batch 5 : Header & PageHeader
**Statut** : En attente  
**Priorité** : HAUTE  
**Objectif** : Transformer Header et PageHeader

**Tâches** :
- [ ] Transformer Header avec logo noir, typographie dashboard-v2
- [ ] Transformer PageHeader avec typographie adaptée
- [ ] Tests : Vérifier header sur toutes les pages

**Fichiers à modifier** :
- `apps/web/src/components/layout/Header.tsx`
- `apps/web/src/components/layout/PageHeader.tsx`
- `apps/web/src/components/layout/DashboardHeader.tsx`

**Commit** : `feat(ui): Batch 5 - Header & PageHeader`

---

### Batch 6 : Progress Bar & Stepper (CRITIQUE pour Transaction Detail)
**Statut** : En attente  
**Priorité** : CRITIQUE  
**Objectif** : Créer Progress Bar horizontale style transaction-detail

**Tâches** :
- [ ] Créer Progress Bar horizontale avec gradient
- [ ] Transformer Stepper avec cercles colorés
- [ ] Ajouter ring sur step in_progress
- [ ] Tests : Vérifier progress bar et stepper

**Fichiers à modifier** :
- `apps/web/src/components/ui/Progress.tsx`
- `apps/web/src/components/ui/Stepper.tsx`
- `apps/web/src/components/transactions/StatusStepper.tsx`

**Commit** : `feat(ui): Batch 6 - Progress Bar & Stepper`

---

### Batch 7 : Table & StatsCard
**Statut** : En attente  
**Priorité** : MOYENNE  
**Objectif** : Transformer Table et StatsCard

**Tâches** :
- [ ] Transformer Table avec rounded-3xl container
- [ ] Transformer StatsCard style dashboard-v2
- [ ] Tests : Vérifier table et stats cards

**Fichiers à modifier** :
- `apps/web/src/components/ui/Table.tsx`
- `apps/web/src/components/ui/StatsCard.tsx`

**Commit** : `feat(ui): Batch 7 - Table & StatsCard`

---

### Batch 8 : Transaction Detail Page (CRITIQUE - Priorité #1)
**Statut** : En attente  
**Priorité** : CRITIQUE ABSOLUE  
**Objectif** : Rendre Transaction Detail identique à `/demo/transaction-detail`

**Tâches** :
- [ ] Header avec boutons Edit/Send Update
- [ ] Progress Bar horizontale avec steps
- [ ] Current Step Card avec bg-blue-50
- [ ] Tabs modernes avec indicateur
- [ ] Overview Tab avec cards Property/Client/Agent
- [ ] Documents Tab avec list items
- [ ] Activity Tab avec timeline
- [ ] Photos Tab avec grid
- [ ] Tests : Comparer visuellement avec `/demo/transaction-detail`

**Fichiers à modifier** :
- `apps/web/src/app/[locale]/dashboard/transactions/[id]/page.tsx`
- `apps/web/src/components/transactions/TransactionSummaryCard.tsx`
- `apps/web/src/components/transactions/TransactionTimeline.tsx`
- `apps/web/src/components/transactions/TransactionContactsCard.tsx`

**Commit** : `feat(ui): Batch 8 - Transaction Detail Page (CRITIQUE)`

---

### Batch 9 : Dashboard Page
**Statut** : En attente  
**Priorité** : HAUTE  
**Objectif** : Transformer Dashboard identique à `/demo/dashboard-v2`

**Tâches** :
- [ ] Layout avec grid 12 colonnes
- [ ] Cards avec rounded-3xl
- [ ] Stats cards style dashboard-v2
- [ ] Typographie adaptée
- [ ] Tests : Comparer avec `/demo/dashboard-v2`

**Fichiers à modifier** :
- `apps/web/src/app/[locale]/dashboard/page.tsx`

**Commit** : `feat(ui): Batch 9 - Dashboard Page`

---

### Batch 10 : Transactions List & Pipeline View
**Statut** : En attente  
**Priorité** : HAUTE  
**Objectif** : Transformer Transactions List et Pipeline View

**Tâches** :
- [ ] Header style dashboard-v2
- [ ] Pipeline View avec colonnes Kanban
- [ ] Cards de transaction style transactions board
- [ ] Tests : Vérifier liste et pipeline

**Fichiers à modifier** :
- `apps/web/src/app/[locale]/dashboard/transactions/page.tsx`
- `apps/web/src/components/transactions/TransactionsPipelineView.tsx`

**Commit** : `feat(ui): Batch 10 - Transactions List & Pipeline`

---

## Progression Globale

**Batches complétés** : 1/10 ✅  
**Batches en cours** : 0  
**Batches en attente** : 9

### Dernière mise à jour
- **Batch 1** complété le 2026-02-01
- Foundation & Design System configuré avec font-light et rounded-3xl

## Notes

- Chaque batch doit être testé avant le push
- Les commits suivent le format : `feat(ui): Batch X - Description`
- Priorité CRITIQUE = Doit être fait en premier
- Comparer visuellement avec les pages de démo après chaque batch

## Références

- [Dashboard V2 Live](https://immoassist26b-f-production.up.railway.app/demo/dashboard-v2)
- [Transaction Detail Live](https://immoassist26b-f-production.up.railway.app/demo/transaction-detail)
- [Plan Complet](./PLAN_TRANSFORMATION_UI_COMPLETE.md)
- [Guide de Migration](./GUIDE_MIGRATION_DASHBOARD_V2.md)
