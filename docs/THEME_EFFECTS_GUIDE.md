# Guide des Effets CSS Personnalisés pour les Thèmes

Ce guide explique comment ajouter et gérer des effets CSS personnalisés dans les thèmes.

## 📋 Vue d'ensemble

Le système d'effets permet d'ajouter des propriétés CSS complexes directement dans la configuration du thème, au-delà des simples couleurs hexadécimales. Les effets sont appliqués globalement via des variables CSS.

## 🎨 Format JSON

Les effets sont stockés dans la section `effects` de la configuration du thème :

```json
{
  "effects": {
    "nom-effet": {
      "description": "Description optionnelle",
      "proprieteCSS": "valeur",
      "autrePropriete": "valeur"
    }
  }
}
```

## 📥 Importer des Effets depuis un Fichier JSON

1. Préparez un fichier JSON avec vos effets (voir `THEME_EFFECTS_EXAMPLES.json` pour des exemples)
2. Dans l'éditeur de thème, allez dans l'onglet **"Effets"**
3. Cliquez sur **"Importer depuis JSON"**
4. Sélectionnez votre fichier JSON
5. Les effets seront fusionnés avec les effets existants

### Format du Fichier JSON

```json
{
  "mon-effet": {
    "description": "Description de l'effet",
    "backdropFilter": "blur(10px)",
    "background": "rgba(255, 255, 255, 0.1)",
    "border": "1px solid rgba(255, 255, 255, 0.2)"
  },
  "autre-effet": {
    "boxShadow": "0 0 20px rgba(59, 130, 246, 0.5)",
    "borderRadius": "12px"
  }
}
```

## ➕ Ajouter un Effet Manuellement

1. Dans l'onglet **"Effets"**, cliquez sur **"Ajouter un effet"**
2. Remplissez le formulaire :
   - **Nom de l'effet** : Identifiant unique (ex: `mon-effet`)
   - **Description** : Description optionnelle
   - **Propriétés CSS** : Format JSON ou CSS

### Format des Propriétés CSS

**Format JSON (recommandé) :**

```json
{
  "backdropFilter": "blur(10px)",
  "background": "rgba(255, 255, 255, 0.1)",
  "border": "1px solid rgba(255, 255, 255, 0.2)"
}
```

**Format CSS :**

```
backdrop-filter: blur(10px);
background: rgba(255, 255, 255, 0.1);
border: 1px solid rgba(255, 255, 255, 0.2);
```

## ✏️ Éditer le JSON Directement

1. Cliquez sur **"Éditer le JSON"**
2. Modifiez le JSON complet des effets
3. Cliquez sur **"Enregistrer"**

## 📤 Exporter les Effets

1. Cliquez sur **"Exporter en JSON"**
2. Un fichier `theme-effects.json` sera téléchargé avec tous les effets du thème

## 🎯 Exemples d'Effets

### Glassmorphism

```json
{
  "glassmorphism": {
    "backdropFilter": "blur(10px) saturate(180%)",
    "background": "rgba(255, 255, 255, 0.1)",
    "border": "1px solid rgba(255, 255, 255, 0.2)"
  }
}
```

### Neon Glow

```json
{
  "neon-glow": {
    "boxShadow": "0 0 10px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)",
    "textShadow": "0 0 10px rgba(59, 130, 246, 0.8)"
  }
}
```

### Gradient Border

```json
{
  "gradient-border": {
    "border": "2px solid transparent",
    "backgroundImage": "linear-gradient(white, white), linear-gradient(to right, #3b82f6, #8b5cf6)",
    "backgroundOrigin": "border-box",
    "backgroundClip": "padding-box, border-box"
  }
}
```

### Text Gradient

```json
{
  "text-gradient": {
    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "WebkitBackgroundClip": "text",
    "WebkitTextFillColor": "transparent",
    "backgroundClip": "text"
  }
}
```

## 🔧 Application des Effets

Les effets sont appliqués globalement via des variables CSS :

- Format : `--effect-{nom-effet}-{propriete}`
- Exemple : `--effect-glassmorphism-backdrop-filter`

### Utilisation dans les Composants

```tsx
<div
  style={{
    backdropFilter: "var(--effect-glassmorphism-backdrop-filter)",
    background: "var(--effect-glassmorphism-background)",
  }}
>
  Contenu avec effet glassmorphism
</div>
```

## 📝 Propriétés CSS Supportées

Toutes les propriétés CSS peuvent être utilisées dans les effets :

- **Filtres** : `backdropFilter`, `filter`
- **Ombres** : `boxShadow`, `textShadow`
- **Arrière-plans** : `background`, `backgroundImage`, `backgroundGradient`
- **Bordures** : `border`, `borderRadius`, `borderColor`
- **Transitions** : `transition`, `animation`
- **Transformations** : `transform`, `transformOrigin`
- Et toutes les autres propriétés CSS valides

## ⚠️ Notes Importantes

1. **Noms d'effets** : Utilisez des noms en kebab-case (ex: `mon-effet`) pour éviter les conflits
2. **Propriétés CSS** : Utilisez camelCase pour les propriétés (ex: `backdropFilter` au lieu de `backdrop-filter`)
3. **Valeurs** : Les valeurs doivent être des chaînes CSS valides
4. **Fusion** : L'importation fusionne avec les effets existants (les nouveaux écrasent les anciens avec le même nom)

## 🎨 Effets Prédéfinis

Certains effets sont gérés séparément et ne doivent pas être écrasés :

- `glassmorphism` : Géré par l'interface visuelle
- `shadows` : Ombres personnalisées
- `gradients` : Dégradés

Ces effets peuvent être modifiés via l'interface ou le JSON, mais il est recommandé d'utiliser l'interface pour une meilleure expérience.

## 📚 Ressources

- Voir `THEME_EFFECTS_EXAMPLES.json` pour plus d'exemples
- Documentation CSS : [MDN Web Docs](https://developer.mozilla.org/fr/docs/Web/CSS)
- Effets CSS modernes : [CSS-Tricks](https://css-tricks.com/)
