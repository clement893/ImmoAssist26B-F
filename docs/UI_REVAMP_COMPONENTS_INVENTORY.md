# 📦 Inventaire Complet des Composants à Migrer

**Liste exhaustive de tous les composants (270+) à migrer vers le nouveau design**  
**Date:** 31 Janvier 2026

---

## 📊 Vue d'Ensemble

- **Total composants UI** : 114
- **Total composants métier** : 156+
- **Total composants** : **270+**
- **Catégories** : 50+

---

## 🎨 Composants UI de Base (114 composants)

### ✅ Catégorie 1 : Form Components (20 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 1 | Button | `Button.tsx` | 🔴 CRITIQUE | ⬜ | Utilisé partout |
| 2 | ButtonLink | `ButtonLink.tsx` | 🟡 HAUTE | ⬜ | Variant de Button |
| 3 | Input | `Input.tsx` | 🔴 CRITIQUE | ⬜ | Formulaires |
| 4 | Textarea | `Textarea.tsx` | 🟡 HAUTE | ⬜ | Formulaires |
| 5 | Select | `Select.tsx` | 🟡 HAUTE | ⬜ | Formulaires |
| 6 | Checkbox | `Checkbox.tsx` | 🟡 HAUTE | ⬜ | Formulaires |
| 7 | Radio | `Radio.tsx` | 🟡 HAUTE | ⬜ | Formulaires |
| 8 | Switch | `Switch.tsx` | 🟡 HAUTE | ⬜ | Formulaires |
| 9 | DatePicker | `DatePicker.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 10 | TimePicker | `TimePicker.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 11 | FileUpload | `FileUpload.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 12 | FileUploadWithPreview | `FileUploadWithPreview.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 13 | Slider | `Slider.tsx` | 🟢 BASSE | ⬜ | Formulaires |
| 14 | Range | `Range.tsx` | 🟢 BASSE | ⬜ | Formulaires |
| 15 | ColorPicker | `ColorPicker.tsx` | 🟢 BASSE | ⬜ | Formulaires |
| 16 | TagInput | `TagInput.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 17 | Autocomplete | `Autocomplete.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 18 | MultiSelect | `MultiSelect.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 19 | RichTextEditor | `RichTextEditor.tsx` | 🟡 MOYENNE | ⬜ | Formulaires |
| 20 | Form / FormField / FormBuilder | `Form.tsx` | 🟡 HAUTE | ⬜ | Formulaires |

### ✅ Catégorie 2 : Layout Components (15 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 21 | Card | `Card.tsx` | 🔴 CRITIQUE | ⬜ | **PRIORITÉ #1** |
| 22 | Container | `Container.tsx` | 🟡 HAUTE | ⬜ | Layout |
| 23 | Sidebar | `Sidebar.tsx` | 🔴 CRITIQUE | ⬜ | **PRIORITÉ #2** |
| 24 | Tabs | `Tabs.tsx` | 🟡 HAUTE | ⬜ | Navigation |
| 25 | Accordion | `Accordion.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 26 | Divider | `Divider.tsx` | 🟢 BASSE | ⬜ | Layout |
| 27 | Breadcrumb | `Breadcrumb.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 28 | Drawer | `Drawer.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 29 | Popover | `Popover.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 30 | Modal | `Modal.tsx` | 🟡 HAUTE | ⬜ | Layout |
| 31 | Grid | `Grid.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 32 | Stack | `Stack.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 33 | List | `List.tsx` | 🟢 BASSE | ⬜ | Layout |
| 34 | EmptyState | `EmptyState.tsx` | 🟡 MOYENNE | ⬜ | Layout |
| 35 | ErrorBoundary | `ErrorBoundary.tsx` | 🟡 MOYENNE | ⬜ | Layout |

### ✅ Catégorie 3 : Data Display (20 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 36 | DataTable | `DataTable.tsx` | 🟡 HAUTE | ⬜ | Tables |
| 37 | DataTableEnhanced | `DataTableEnhanced.tsx` | 🟡 MOYENNE | ⬜ | Tables |
| 38 | VirtualTable | `VirtualTable.tsx` | 🟡 MOYENNE | ⬜ | Tables |
| 39 | Table | `Table.tsx` | 🟡 HAUTE | ⬜ | Tables |
| 40 | TablePagination | `TablePagination.tsx` | 🟡 MOYENNE | ⬜ | Tables |
| 41 | TableSearchBar | `TableSearchBar.tsx` | 🟡 MOYENNE | ⬜ | Tables |
| 42 | TableFilters | `TableFilters.tsx` | 🟡 MOYENNE | ⬜ | Tables |
| 43 | Chart | `Chart.tsx` | 🟡 HAUTE | ⬜ | Visualisation |
| 44 | AdvancedCharts | `AdvancedCharts.tsx` | 🟡 MOYENNE | ⬜ | Visualisation |
| 45 | ActivityChart | `ActivityChart.tsx` | 🟡 MOYENNE | ⬜ | Visualisation |
| 46 | Calendar | `Calendar.tsx` | 🟡 MOYENNE | ⬜ | Visualisation |
| 47 | Timeline | `Timeline.tsx` | 🟡 MOYENNE | ⬜ | Visualisation |
| 48 | KanbanBoard | `KanbanBoard.tsx` | 🟡 MOYENNE | ⬜ | Visualisation |
| 49 | TreeView | `TreeView.tsx` | 🟢 BASSE | ⬜ | Visualisation |
| 50 | Avatar | `Avatar.tsx` | 🟡 MOYENNE | ⬜ | Display |
| 51 | Badge | `Badge.tsx` | 🟡 MOYENNE | ⬜ | Display |
| 52 | StatusCard | `StatusCard.tsx` | 🟡 MOYENNE | ⬜ | Display |
| 53 | StatsCard | `StatsCard.tsx` | 🟡 MOYENNE | ⬜ | Display |
| 54 | MetricCard | `MetricCard.tsx` | 🟡 MOYENNE | ⬜ | Display |
| 55 | WidgetGrid | `WidgetGrid.tsx` | 🟡 MOYENNE | ⬜ | Display |

### ✅ Catégorie 4 : Feedback Components (10 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 56 | Alert | `Alert.tsx` | 🟡 HAUTE | ⬜ | Feedback |
| 57 | Toast | `Toast.tsx` | 🟡 HAUTE | ⬜ | Feedback |
| 58 | ToastContainer | `ToastContainer.tsx` | 🟡 HAUTE | ⬜ | Feedback |
| 59 | Loading | `Loading.tsx` | 🟡 MOYENNE | ⬜ | Feedback |
| 60 | LoadingSkeleton | `LoadingSkeleton.tsx` | 🟡 MOYENNE | ⬜ | Feedback |
| 61 | Skeleton | `Skeleton.tsx` | 🟡 MOYENNE | ⬜ | Feedback |
| 62 | Spinner | `Spinner.tsx` | 🟡 MOYENNE | ⬜ | Feedback |
| 63 | Progress | `Progress.tsx` | 🟡 MOYENNE | ⬜ | Feedback |
| 64 | ProgressRing | `ProgressRing.tsx` | 🟢 BASSE | ⬜ | Feedback |
| 65 | Banner | `Banner.tsx` | 🟡 MOYENNE | ⬜ | Feedback |

### ✅ Catégorie 5 : Navigation Components (8 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 66 | CommandPalette | `CommandPalette.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 67 | SearchBar | `SearchBar.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 68 | Pagination | `Pagination.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 69 | Stepper | `Stepper.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 70 | Dropdown | `Dropdown.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 71 | Tooltip | `Tooltip.tsx` | 🟡 MOYENNE | ⬜ | Navigation |
| 72 | SkipLink | `SkipLink.tsx` | 🟢 BASSE | ⬜ | Navigation |
| 73 | DragDropList | `DragDropList.tsx` | 🟢 BASSE | ⬜ | Navigation |

### ✅ Catégorie 6 : Typography Components (2 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 74 | Heading | `Heading.tsx` | 🟡 MOYENNE | ⬜ | Typography |
| 75 | Text | `Text.tsx` | 🟡 MOYENNE | ⬜ | Typography |

### ✅ Catégorie 7 : Specialized Components (19 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 76 | CRUDModal | `CRUDModal.tsx` | 🟡 MOYENNE | ⬜ | Specialized |
| 77 | PricingCardSimple | `PricingCardSimple.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 78 | ServiceTestCard | `ServiceTestCard.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 79 | BillingPeriodToggle | `BillingPeriodToggle.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 80 | ExportButton | `ExportButton.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 81 | FAQItem | `FAQItem.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 82 | SafeHTML | `SafeHTML.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 83 | ClientOnly | `ClientOnly.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 84 | VideoPlayer | `VideoPlayer.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 85 | AudioPlayer | `AudioPlayer.tsx` | 🟢 BASSE | ⬜ | Specialized |
| 86 | ThemeToggle | `ThemeToggle.tsx` | 🟡 MOYENNE | ⬜ | Specialized |
| 87 | ... | ... | ... | ⬜ | ... |

**Total UI Components : 114**

---

## 🏢 Composants Métier (156+ composants)

### ✅ Layout Components (14 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 115 | DashboardLayout | `layout/DashboardLayout.tsx` | 🔴 CRITIQUE | ⬜ | **PRIORITÉ #5** |
| 116 | InternalLayout | `layout/InternalLayout.tsx` | 🟡 HAUTE | ⬜ | Layout |
| 117 | ... | ... | 🟡 MOYENNE | ⬜ | ... (12 autres) |

### ✅ Billing Components (24 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 129 | SubscriptionCard | `billing/SubscriptionCard.tsx` | 🟡 MOYENNE | ⬜ | Billing |
| 130 | InvoiceList | `billing/InvoiceList.tsx` | 🟡 MOYENNE | ⬜ | Billing |
| 131 | PaymentMethod | `billing/PaymentMethod.tsx` | 🟡 MOYENNE | ⬜ | Billing |
| 132 | ... | ... | 🟡 MOYENNE | ⬜ | ... (21 autres) |

### ✅ Auth Components (15 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 153 | LoginForm | `auth/LoginForm.tsx` | 🟡 MOYENNE | ⬜ | Auth |
| 154 | SignupForm | `auth/SignupForm.tsx` | 🟡 MOYENNE | ⬜ | Auth |
| 155 | ... | ... | 🟡 MOYENNE | ⬜ | ... (13 autres) |

### ✅ Analytics Components (13 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 168 | Dashboard | `analytics/Dashboard.tsx` | 🟡 MOYENNE | ⬜ | Analytics |
| 169 | Reports | `analytics/Reports.tsx` | 🟡 MOYENNE | ⬜ | Analytics |
| 170 | ... | ... | 🟡 MOYENNE | ⬜ | ... (11 autres) |

### ✅ Settings Components (12 composants)

| # | Composant | Fichier | Priorité | Statut | Notes |
|---|-----------|---------|----------|--------|-------|
| 181 | UserSettings | `settings/UserSettings.tsx` | 🟡 MOYENNE | ⬜ | Settings |
| 182 | OrganizationSettings | `settings/OrganizationSettings.tsx` | 🟡 MOYENNE | ⬜ | Settings |
| 183 | ... | ... | 🟡 MOYENNE | ⬜ | ... (10 autres) |

### ✅ Autres Catégories (78+ composants)

- **Activity** (6 composants)
- **Admin** (9 composants)
- **Advanced** (5 composants)
- **AI** (3 composants)
- **Content** (10 composants)
- **CMS** (5 composants)
- **Collaboration** (5 composants)
- **Data** (3 composants)
- **Documentation** (3 composants)
- **Email Templates** (2 composants)
- **ERP** (3 composants)
- **Errors** (5 composants)
- **Favorites** (3 composants)
- **Feature Flags** (2 composants)
- **Feedback** (3 composants)
- **Help** (8 composants)
- **i18n** (4 composants)
- **Integrations** (5 composants)
- **Marketing** (4 composants)
- **Monitoring** (9 composants)
- **Notifications** (5 composants)
- **Onboarding** (7 composants)
- **Page Builder** (4 composants)
- **Performance** (7 composants)
- **Preferences** (3 composants)
- **Profile** (3 composants)
- **Providers** (6 composants)
- **RBAC** (2 composants)
- **Réseau** (23 composants)
- **Scheduled Tasks** (2 composants)
- **Search** (3 composants)
- **Sections** (6 composants)
- **SEO** (2 composants)
- **Sharing** (3 composants)
- **Subscriptions** (5 composants)
- **Surveys** (4 composants)
- **Tags** (3 composants)
- **Templates** (3 composants)
- **Theme** (9 composants)
- **Transactions** (9 composants)
- **Versions** (3 composants)
- **Workflow** (4 composants)
- **Blog** (3 composants)
- **Client** (3 composants)
- **Motion** (1 composant)
- **Audit Trail** (2 composants)
- **Backups** (2 composants)
- **Announcements** (1 composant)

**Total Composants Métier : 156+**

---

## 📊 Statistiques Globales

### Par Priorité

- 🔴 **CRITIQUE** : 5 composants
  - Card.tsx
  - Sidebar.tsx
  - Button.tsx
  - Input.tsx
  - DashboardLayout.tsx

- 🟡 **HAUTE** : ~40 composants
  - Tous les Form components principaux
  - Layout components importants
  - Data display components principaux

- 🟡 **MOYENNE** : ~150 composants
  - Composants spécialisés
  - Composants métier

- 🟢 **BASSE** : ~75 composants
  - Composants peu utilisés
  - Composants spécialisés

### Par Statut

- ⬜ **À migrer** : 270+ composants (100%)
- ✅ **Migré** : 0 composants (0%)
- 🔄 **En cours** : 0 composants (0%)
- ⚠️ **Problème** : 0 composants (0%)

---

## 🎯 Ordre de Migration Recommandé

### Semaine 1 : Fondations
1. Système de thème
2. Tokens d'ombres
3. Utilitaires

### Semaine 2 : Composants Critiques
1. Card.tsx
2. Sidebar.tsx
3. Button.tsx
4. Input.tsx
5. DashboardLayout.tsx

### Semaines 3-4 : Form Components
1. Select, Checkbox, Radio, Switch
2. DatePicker, TimePicker, FileUpload
3. Autres form components

### Semaines 5-6 : Layout & Data Display
1. Layout components
2. Data display components

### Semaines 7-8 : Feedback & Navigation
1. Feedback components
2. Navigation components

### Semaines 9-10 : Composants Métier
1. Toutes les catégories métier

### Semaines 11-12 : Tests & Polish
1. Tests complets
2. Optimisations
3. Documentation

---

## 📝 Notes de Migration

### Pour chaque composant, documenter :

1. **Changements appliqués**
   - Ombres remplacées
   - Couleurs remplacées
   - Variants ajoutés
   - Props modifiées

2. **Breaking changes**
   - Props supprimées
   - Props renommées
   - Comportements modifiés

3. **Guide de migration**
   - Comment migrer les usages existants
   - Exemples avant/après

4. **Tests**
   - Tests unitaires
   - Tests visuels
   - Tests d'accessibilité

---

**Document créé le :** 31 Janvier 2026  
**Dernière mise à jour :** 31 Janvier 2026  
**Version :** 1.0
