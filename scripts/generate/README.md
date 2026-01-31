# CLI Générateur de Code

Générateur automatique de code pour créer rapidement des modèles, schemas, endpoints et pages.

## 🚀 Utilisation

### Génération Complète (Recommandé)

Génère tout en une commande : modèle SQLAlchemy, schemas Pydantic, endpoints FastAPI et page Next.js.

```bash
pnpm generate all Product --fields "name:string:true,price:float:true,description:text:false"
```

### Génération Individuelle

#### Modèle SQLAlchemy

```bash
pnpm generate model User --fields "name:string:true,email:string:true,age:integer:false"
```

#### Schemas Pydantic

```bash
pnpm generate schema User --fields "name:string:true,email:string:true"
```

#### Endpoints FastAPI

```bash
pnpm generate endpoint User --api-path "/api/v1/users"
```

#### Page Next.js

```bash
pnpm generate page User --page-path "/users"
```

#### Synchronisation Types TypeScript

```bash
pnpm generate:types
```

## 📋 Format des Champs

Format: `name:type:required`

**Types supportés:**

- `string` - String
- `integer` - Integer
- `float` - Float
- `boolean` - Boolean
- `date` - DateTime
- `datetime` - DateTime
- `text` - Text
- `uuid` - UUID
- `json` - JSON
- `email` - EmailStr (pour schemas)

**Exemple:**

```bash
--fields "name:string:true,email:string:true,age:integer:false,is_active:boolean:true"
```

## 🔗 Relations

Format: `name:type:model`

**Types de relations:**

- `many-to-one` - ForeignKey
- `one-to-many` - Relationship
- `many-to-many` - Table de jointure

**Exemple:**

```bash
--relations "user:many-to-one:User,posts:one-to-many:Post"
```

## 📝 Exemples Complets

### Exemple 1: Produit Simple

```bash
pnpm generate all Product \
  --fields "name:string:true,price:float:true,description:text:false,stock:integer:true"
```

Génère:

- `backend/app/models/product.py`
- `backend/app/schemas/product.py`
- `backend/app/api/v1/endpoints/product.py`
- `apps/web/src/app/product/page.tsx`

### Exemple 2: Utilisateur avec Relations

```bash
pnpm generate all User \
  --fields "name:string:true,email:string:true,age:integer:false" \
  --relations "company:many-to-one:Company"
```

### Exemple 3: Commande avec Relations Multiples

```bash
pnpm generate all Order \
  --fields "total:float:true,status:string:true" \
  --relations "user:many-to-one:User,items:one-to-many:OrderItem"
```

## 🎯 Options

- `--fields <fields>` - Champs du modèle
- `--relations <relations>` - Relations entre modèles
- `--api-path <path>` - Chemin API (défaut: `/api/v1/<name>`)
- `--page-path <path>` - Chemin de la page (défaut: `/<name>`)
- `--force` - Écrase les fichiers existants

## 📦 Structure Générée

### Backend

```
backend/
├── app/
│   ├── models/
│   │   └── product.py          # Modèle SQLAlchemy
│   ├── schemas/
│   │   └── product.py          # Schemas Pydantic (Create/Update/Response)
│   └── api/
│       └── v1/
│           └── endpoints/
│               └── product.py  # Endpoints CRUD FastAPI
```

### Frontend

```
apps/web/src/app/
└── product/
    └── page.tsx                # Page Next.js avec DataTable
```

## ⚙️ Configuration

Les fichiers générés suivent les conventions du projet :

- Modèles SQLAlchemy avec UUID, timestamps
- Schemas Pydantic avec validation
- Endpoints FastAPI avec gestion d'erreurs
- Pages Next.js avec DataTableEnhanced

## 🔄 Synchronisation Types

Après avoir généré des schemas backend, synchronisez les types TypeScript :

```bash
pnpm generate:types
```

Cela génère `packages/types/src/generated.ts` avec tous les types depuis les schemas Pydantic.

## 🐛 Dépannage

### Fichier existe déjà

Utilisez `--force` pour écraser :

```bash
pnpm generate all Product --force
```

### Erreur de syntaxe dans les champs

Vérifiez le format : `name:type:required`

- Pas d'espaces autour des `:`
- Types valides uniquement
- `required` doit être `true` ou `false`

### Types non synchronisés

Exécutez `pnpm generate:types` après chaque modification des schemas backend.

## 📚 Prochaines Étapes

Après génération :

1. **Créer une migration:**

   ```bash
   pnpm migrate create add_product
   ```

2. **Tester les endpoints:**
   - Visitez `/docs` pour voir l'API Swagger
   - Testez les endpoints CRUD

3. **Vérifier la page:**
   - Visitez `/<name>` pour voir la page générée

4. **Personnaliser:**
   - Ajoutez des validations dans les schemas
   - Personnalisez les colonnes de la DataTable
   - Ajoutez des actions personnalisées
