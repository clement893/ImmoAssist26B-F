# Génération de Types TypeScript depuis Pydantic

Script automatique pour synchroniser les types TypeScript depuis les schemas Pydantic du backend.

## 🚀 Utilisation

```bash
# Générer les types depuis les schemas Pydantic
npm run generate:types
```

## 📋 Prérequis

- Python 3.11+ installé
- Schemas Pydantic dans `backend/app/schemas/`

## 🔄 Fonctionnement

1. **Parse les fichiers Pydantic** dans `backend/app/schemas/`
2. **Extrait les classes** qui héritent de `BaseModel`
3. **Convertit les types Python** en types TypeScript
4. **Génère** `packages/types/src/generated.ts`
5. **Met à jour** `packages/types/src/index.ts`

## 📝 Mapping des Types

| Python             | TypeScript     |
| ------------------ | -------------- |
| `str`              | `string`       |
| `int`, `float`     | `number`       |
| `bool`             | `boolean`      |
| `datetime`, `date` | `string`       |
| `UUID`             | `string`       |
| `Optional[T]`      | `T \| null`    |
| `List[T]`          | `T[]`          |
| `Dict[K, V]`       | `Record<K, V>` |
| `EmailStr`         | `string`       |

## 📦 Exemple

### Schema Pydantic (Python)

```python
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: str
    name: str
    age: int | None = None

class UserUpdate(BaseModel):
    name: str | None = None
    age: int | None = None

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    age: int | None
    created_at: datetime
```

### Types générés (TypeScript)

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  age: number | null;
  created_at: string;
}

export interface UserCreate {
  email: string;
  name: string;
  age: number | null;
}

export interface UserUpdate {
  name: string | null;
  age: number | null;
}
```

## 🔧 Configuration

Le script détecte automatiquement :

- Les classes qui héritent de `BaseModel`
- Les annotations de type
- Les valeurs par défaut (`None` = optionnel)
- Les types Pydantic spéciaux (`EmailStr`, `HttpUrl`, etc.)

## ⚠️ Limitations

- Les types personnalisés complexes peuvent nécessiter une conversion manuelle
- Les validations Pydantic ne sont pas traduites
- Les relations SQLAlchemy ne sont pas incluses (utiliser les schemas Response)

## 🐛 Dépannage

### Python non trouvé

```bash
# Vérifier l'installation
python3 --version

# Ou installer Python 3.11+
```

### Erreurs de parsing

Le script ignore les fichiers avec des erreurs de syntaxe et continue avec les autres.

### Types manquants

Vérifiez que vos schemas héritent bien de `BaseModel` et utilisent des annotations de type.

## 📚 Intégration CI/CD

Ajoutez dans votre workflow CI :

```yaml
- name: Generate Types
  run: npm run generate:types
```
