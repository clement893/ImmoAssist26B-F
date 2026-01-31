# Guide de Validation des Thèmes

Ce guide explique le système complet de validation des thèmes, incluant la validation des formats de couleur, la conformité WCAG pour les contrastes, et les tests d'accessibilité automatisés.

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Validation des Formats de Couleur](#validation-des-formats-de-couleur)
3. [Validation des Contrastes WCAG](#validation-des-contrastes-wcag)
4. [Validation Backend](#validation-backend)
5. [Tests d'Accessibilité](#tests-daccessibilité)
6. [Utilisation](#utilisation)
7. [Exemples](#exemples)
8. [Résolution de Problèmes](#résolution-de-problèmes)

## 🎯 Vue d'ensemble

Le système de validation des thèmes garantit que toutes les configurations de thème respectent :

- ✅ Formats de couleur valides (hex, RGB, HSL)
- ✅ Conformité WCAG AA pour les contrastes
- ✅ Accessibilité pour les utilisateurs malvoyants
- ✅ Cohérence entre frontend et backend

### Architecture

```
Frontend (TypeScript)
├── color-validation.ts      → Validation des formats de couleur
├── contrast-utils.ts        → Calcul des contrastes WCAG
└── theme-validator.ts        → Validateur principal

Backend (Python)
├── theme_validation.py       → Validation backend (miroir du frontend)
└── schemas/theme.py          → Schémas Pydantic avec validation
```

## 🎨 Validation des Formats de Couleur

### Formats Supportés

Le système accepte trois formats de couleur :

#### 1. Hex (`#RRGGBB` ou `#RGB`)

```typescript
"#ffffff"; // Blanc
"#000000"; // Noir
"#2563eb"; // Bleu
"#fff"; // Blanc (format court)
```

#### 2. RGB (`rgb()` ou `rgba()`)

```typescript
"rgb(255, 255, 255)"; // Blanc
"rgba(37, 99, 235, 0.5)"; // Bleu avec transparence
"255, 255, 255"; // Format alternatif
```

#### 3. HSL (`hsl()` ou `hsla()`)

```typescript
"hsl(217, 91%, 60%)"; // Bleu
"hsla(217, 91%, 60%, 0.5)"; // Bleu avec transparence
```

### Validation Frontend

```typescript
import {
  validateThemeColors,
  isValidColor,
} from "@/lib/theme/color-validation";

// Valider une couleur unique
const isValid = isValidColor("#2563eb"); // true

// Valider toutes les couleurs d'un thème
const config = {
  primary_color: "#2563eb",
  colors: {
    background: "#ffffff",
  },
};

const result = validateThemeColors(config);
if (!result.valid) {
  result.errors.forEach((error) => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

### Validation Backend

```python
from app.core.theme_validation import validate_theme_colors, is_valid_color

# Valider une couleur unique
is_valid = is_valid_color("#2563eb")  # True

# Valider toutes les couleurs d'un thème
config = {
    "primary_color": "#2563eb",
    "colors": {
        "background": "#ffffff"
    }
}

is_valid, errors = validate_theme_colors(config)
if not is_valid:
    for error in errors:
        print(f"{error['field']}: {error['message']}")
```

## ♿ Validation des Contrastes WCAG

### Standards WCAG 2.1

Le système valide la conformité WCAG 2.1 avec les seuils suivants :

| Type de Contenu                   | WCAG AA | WCAG AAA |
| --------------------------------- | ------- | -------- |
| Texte normal                      | 4.5:1   | 7:1      |
| Texte large (≥18pt ou ≥14pt bold) | 3:1     | 4.5:1    |
| Composants UI (boutons, liens)    | 3:1     | -        |

### Calcul du Contraste

Le ratio de contraste est calculé selon la formule WCAG :

```
Ratio = (L1 + 0.05) / (L2 + 0.05)
```

Où :

- `L1` = Luminance relative de la couleur la plus claire
- `L2` = Luminance relative de la couleur la plus sombre

### Validation Frontend

```typescript
import {
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
} from "@/lib/theme/contrast-utils";

// Calculer le ratio de contraste
const ratio = calculateContrastRatio("#000000", "#ffffff"); // 21:1

// Vérifier la conformité WCAG AA
const meetsAA = meetsWCAGAA("#2563eb", "#ffffff"); // true

// Vérifier la conformité WCAG AAA
const meetsAAA = meetsWCAGAAA("#000000", "#ffffff"); // true

// Pour le texte large
const meetsAALarge = meetsWCAGAA("#767676", "#ffffff", true); // true

// Pour les composants UI
const meetsAAUI = meetsWCAGAA("#2563eb", "#ffffff", false, true); // true
```

### Validation Backend

```python
from app.core.theme_validation import (
    calculate_contrast_ratio,
    meets_wcag_aa,
    validate_theme_contrast
)

# Calculer le ratio de contraste
ratio = calculate_contrast_ratio("#000000", "#ffffff")  # 21.0

# Vérifier la conformité WCAG AA
meets_aa = meets_wcag_aa("#2563eb", "#ffffff")  # True

# Valider tous les contrastes d'un thème
config = {
    "colors": {
        "background": "#ffffff",
        "primary": "#2563eb"
    },
    "typography": {
        "textBody": "#1e293b"
    }
}

is_valid, issues = validate_theme_contrast(config, strict=False)
```

## 🔧 Validation Backend

### Schémas Pydantic

Les schémas Pydantic valident automatiquement les configurations de thème lors de la création ou mise à jour :

```python
from app.schemas.theme import ThemeCreate, ThemeUpdate

# Création d'un thème (validation automatique)
theme_data = ThemeCreate(
    name="my-theme",
    display_name="My Theme",
    config={
        "primary_color": "#2563eb",
        "colors": {
            "background": "#ffffff"
        }
    }
)
# Si la validation échoue, une ValueError est levée
```

### Endpoints API

Les endpoints API rejettent automatiquement les configurations invalides :

```bash
# Exemple : Création avec couleur invalide
POST /api/v1/themes
{
  "name": "invalid-theme",
  "display_name": "Invalid Theme",
  "config": {
    "primary_color": "not-a-color"
  }
}

# Réponse : 422 Unprocessable Entity
{
  "detail": [
    {
      "loc": ["body", "config"],
      "msg": "Color format errors:\n  - primary_color: Invalid color format...",
      "type": "value_error"
    }
  ]
}
```

## 🧪 Tests d'Accessibilité

### Tests Frontend

Les tests automatisés vérifient :

- ✅ Validation des formats de couleur
- ✅ Conformité WCAG AA/AAA
- ✅ Accessibilité en mode clair et sombre
- ✅ Validation des composants UI

```typescript
// Exécuter les tests
pnpm test theme-accessibility

// Tests inclus :
// - Validation WCAG AA pour texte normal
// - Validation WCAG AA pour texte large
// - Validation WCAG AA pour composants UI
// - Validation WCAG AAA
// - Validation mode sombre
```

### Tests Backend

Les tests backend vérifient :

- ✅ Validation des formats de couleur
- ✅ Calcul des contrastes
- ✅ Validation dans les schémas Pydantic

```bash
# Exécuter les tests
pytest tests/unit/test_theme_validation.py

# Tests inclus :
# - Validation formats hex/RGB/HSL
# - Calcul des contrastes
# - Validation complète des thèmes
```

## 📖 Utilisation

### Validation Complète d'un Thème

#### Frontend

```typescript
import { validateThemeConfig } from "@/lib/theme/theme-validator";

const config = {
  primary_color: "#2563eb",
  secondary_color: "#6366f1",
  colors: {
    background: "#ffffff",
    foreground: "#000000",
    primary: "#2563eb",
  },
  typography: {
    textHeading: "#0f172a",
    textBody: "#1e293b",
    textLink: "#2563eb",
  },
};

const result = validateThemeConfig(config, {
  strictContrast: false, // Mode strict : échoue sur tout problème
  logWarnings: true, // Afficher les avertissements
});

if (result.valid) {
  console.log("✅ Thème valide et accessible");
} else {
  console.error("❌ Thème invalide :");
  result.colorFormatErrors.forEach((error) => {
    console.error(`  - ${error.field}: ${error.message}`);
  });
  result.contrastIssues.forEach((issue) => {
    console.error(`  - ${issue.element}: ${issue.message}`);
  });
}
```

#### Backend

```python
from app.core.theme_validation import validate_theme_config

config = {
    "primary_color": "#2563eb",
    "colors": {
        "background": "#ffffff",
        "primary": "#2563eb"
    },
    "typography": {
        "textBody": "#1e293b"
    }
}

is_valid, color_errors, contrast_issues = validate_theme_config(
    config,
    strict_contrast=False
)

if is_valid:
    print("✅ Thème valide et accessible")
else:
    print("❌ Thème invalide :")
    for error in color_errors:
        print(f"  - {error['field']}: {error['message']}")
    for issue in contrast_issues:
        print(f"  - {issue['element']}: {issue['message']}")
```

### Mode Strict vs Non-Strict

#### Mode Non-Strict (par défaut)

- ✅ Bloque uniquement les erreurs critiques (format invalide, contraste < 3:1)
- ⚠️ Autorise les avertissements (AA Large uniquement)
- 📝 Génère des warnings pour information

#### Mode Strict

- ❌ Bloque toute configuration avec problème de contraste
- ✅ Exige WCAG AA complet (pas seulement AA Large)
- 🎯 Idéal pour les environnements de production stricts

```typescript
// Mode strict
const result = validateThemeConfig(config, {
  strictContrast: true, // Échoue sur tout problème de contraste
});
```

## 💡 Exemples

### Exemple 1 : Thème Accessible Complet

```json
{
  "mode": "system",
  "primary_color": "#2563eb",
  "secondary_color": "#6366f1",
  "danger_color": "#dc2626",
  "warning_color": "#d97706",
  "info_color": "#0891b2",
  "success_color": "#059669",
  "colors": {
    "background": "#ffffff",
    "foreground": "#000000",
    "primary": "#2563eb",
    "danger": "#dc2626",
    "warning": "#d97706",
    "success": "#059669"
  },
  "typography": {
    "textHeading": "#0f172a",
    "textSubheading": "#334155",
    "textBody": "#1e293b",
    "textSecondary": "#64748b",
    "textLink": "#2563eb"
  }
}
```

**Résultat de validation :**

- ✅ Format de couleur : Valide
- ✅ Contraste texte : WCAG AA conforme
- ✅ Contraste UI : WCAG AA conforme
- ✅ Accessibilité : Complète

### Exemple 2 : Thème avec Problèmes

```json
{
  "primary_color": "invalid-color",
  "colors": {
    "background": "#ffffff",
    "primary": "#f0f0f0"
  },
  "typography": {
    "textBody": "#cccccc"
  }
}
```

**Résultat de validation :**

- ❌ Format de couleur : `primary_color` invalide
- ⚠️ Contraste : `textBody` ne respecte pas WCAG AA (ratio: 1.6:1)
- ⚠️ Contraste : `primary` ne respecte pas WCAG AA pour UI (ratio: 1.1:1)

### Exemple 3 : Mode Sombre Accessible

```json
{
  "mode": "dark",
  "colors": {
    "background": "#0f172a",
    "foreground": "#f8fafc"
  },
  "typography": {
    "textHeading": "#f8fafc",
    "textBody": "#e2e8f0"
  }
}
```

**Résultat de validation :**

- ✅ Format de couleur : Valide
- ✅ Contraste texte : WCAG AA conforme (ratio: ~15:1)
- ✅ Accessibilité : Complète en mode sombre

## 🔍 Résolution de Problèmes

### Problème : Format de Couleur Invalide

**Erreur :**

```
Invalid color format: not-a-color. Expected hex (#RRGGBB), rgb(), or hsl()
```

**Solution :**

1. Vérifier le format de la couleur
2. Utiliser un format valide (hex, RGB, ou HSL)
3. Vérifier qu'il n'y a pas d'espaces ou de caractères invalides

```typescript
// ❌ Incorrect
primary_color: "blue";
primary_color: "#gggggg";
primary_color: "rgb(300, 255, 255)";

// ✅ Correct
primary_color: "#2563eb";
primary_color: "rgb(37, 99, 235)";
primary_color: "hsl(217, 91%, 60%)";
```

### Problème : Contraste Insuffisant

**Erreur :**

```
textBody contrast ratio 1.6:1 does not meet WCAG AA (requires 4.5:1)
```

**Solution :**

1. Augmenter la différence entre la couleur de texte et le fond
2. Utiliser des couleurs plus contrastées
3. Vérifier avec un outil de contraste en ligne

```typescript
// ❌ Contraste insuffisant
colors: {
  background: "#ffffff",
  foreground: "#cccccc"  // Ratio: 1.6:1
}

// ✅ Contraste suffisant
colors: {
  background: "#ffffff",
  foreground: "#1e293b"  // Ratio: ~12:1
}
```

### Problème : Validation Backend Échoue

**Erreur :**

```
422 Unprocessable Entity - Color format errors
```

**Solution :**

1. Vérifier que toutes les couleurs sont dans un format valide
2. Vérifier les contrastes critiques (< 3:1)
3. Utiliser le mode non-strict pour les avertissements uniquement

```python
# Vérifier la configuration avant l'envoi
from app.core.theme_validation import validate_theme_config

is_valid, errors, issues = validate_theme_config(config)
if not is_valid:
    # Corriger les erreurs avant d'envoyer à l'API
    pass
```

## 📚 Références

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Contrast Ratio Calculator](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

## 🎯 Bonnes Pratiques

1. **Toujours valider avant la soumission**
   - Valider côté frontend avant l'envoi à l'API
   - Utiliser la validation backend comme sécurité supplémentaire

2. **Tester en mode clair et sombre**
   - Vérifier les contrastes pour les deux modes
   - S'assurer que les deux modes sont accessibles

3. **Utiliser des outils de contraste**
   - Vérifier visuellement les contrastes
   - Utiliser des outils automatisés pour la validation

4. **Documenter les choix de couleurs**
   - Expliquer pourquoi certaines couleurs sont choisies
   - Maintenir une cohérence dans les palettes

5. **Tests automatisés**
   - Inclure les tests d'accessibilité dans la CI/CD
   - Valider automatiquement les nouveaux thèmes

## ✅ Checklist de Validation

Avant de déployer un thème, vérifier :

- [ ] Tous les formats de couleur sont valides
- [ ] Le contraste texte respecte WCAG AA (4.5:1 minimum)
- [ ] Le contraste UI respecte WCAG AA (3:1 minimum)
- [ ] Le mode clair est accessible
- [ ] Le mode sombre est accessible
- [ ] Les tests d'accessibilité passent
- [ ] La validation backend passe
- [ ] La documentation est à jour

---

**Note :** Ce système de validation garantit que tous les thèmes respectent les standards d'accessibilité WCAG 2.1, offrant une expérience utilisateur optimale pour tous, y compris les utilisateurs malvoyants.
