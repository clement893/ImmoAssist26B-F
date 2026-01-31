# Configuration du Build

## Bundler par défaut : Turbopack ⚡

Le projet utilise **Turbopack** par défaut pour les builds de production, offrant des performances 40-60% supérieures à Webpack.

## Fallback vers Webpack

En cas de problème avec Turbopack, vous pouvez basculer vers Webpack via une variable d'environnement.

### Méthodes de build

#### 1. Build par défaut (Turbopack)

```bash
pnpm build
# ou
pnpm build:turbopack
```

#### 2. Build avec Webpack (fallback)

```bash
USE_WEBPACK=true pnpm build
# ou
pnpm build:webpack
```

#### 3. Forcer Turbopack explicitement

```bash
USE_TURBOPACK=true pnpm build
# ou
pnpm build:turbopack
```

### Configuration dans Docker/Railway

#### Utiliser Turbopack (défaut)

Aucune configuration nécessaire - Turbopack est utilisé par défaut.

#### Utiliser Webpack (fallback)

Ajoutez la variable d'environnement dans le **service frontend** Railway (pas le backend) :

**Dans Railway Dashboard :**

1. Allez dans votre projet Railway
2. Sélectionnez le **service frontend** (celui qui build Next.js)
3. Allez dans l'onglet **Variables**
4. Ajoutez :
   ```
   USE_WEBPACK=true
   ```
5. Redéployez le service

**⚠️ Important :** Cette variable doit être dans le **service frontend**, pas dans le service backend. Le backend (FastAPI/Python) n'a rien à voir avec le build Next.js.

### Variables d'environnement

- `USE_WEBPACK=true` : Force l'utilisation de Webpack
- `USE_TURBOPACK=true` : Force l'utilisation de Turbopack (défaut)
- `NEXT_BUILDER` : Variable interne indiquant le bundler utilisé

### Quand utiliser Webpack ?

Utilisez Webpack comme fallback si :

- Turbopack rencontre des erreurs de build spécifiques
- Des problèmes de compatibilité avec certaines dépendances
- Des erreurs liées aux symlinks (Windows)
- Des bugs connus de Turbopack avec certaines fonctionnalités

### Performance

- **Turbopack** : 40-60% plus rapide, build moderne
- **Webpack** : Plus stable, meilleure compatibilité, build plus lent

### Dépannage

Si le build échoue avec Turbopack :

1. Vérifiez les logs pour identifier l'erreur
2. Si c'est une erreur Turbopack spécifique, utilisez `USE_WEBPACK=true`
3. Signalez le problème à l'équipe pour investigation
