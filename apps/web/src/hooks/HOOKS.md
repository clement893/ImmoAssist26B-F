# Hooks Réutilisables

Bibliothèque complète de hooks réutilisables pour applications ERP.

## 📦 Hooks Disponibles

### 1. useForm<T>()

Gestion complète de formulaires avec validation Zod.

```tsx
import { useForm } from '@/hooks';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be 18 or older').optional(),
});

function UserForm() {
  const form = useForm({
    initialValues: { name: '', email: '', age: undefined },
    validationSchema: schema,
    onSubmit: async (data) => {
      await createUser(data);
    },
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <input {...form.getFieldProps('name')} placeholder="Name" />
      {form.errors.name && <span>{form.errors.name}</span>}

      <input {...form.getFieldProps('email')} type="email" placeholder="Email" />
      {form.errors.email && <span>{form.errors.email}</span>}

      <button type="submit" disabled={form.isSubmitting}>
        {form.isSubmitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

**API:**

- `values` - Valeurs actuelles du formulaire
- `errors` - Erreurs de validation
- `touched` - Champs touchés
- `isSubmitting` - État de soumission
- `isValid` - Formulaire valide
- `handleSubmit` - Soumettre le formulaire
- `reset` - Réinitialiser le formulaire
- `getFieldProps` - Props pour un champ

---

### 2. usePagination()

Pagination automatique pour listes de données.

```tsx
import { usePagination } from '@/hooks';

function ProductList({ products }) {
  const pagination = usePagination({
    totalItems: products.length,
    pageSize: 10,
    initialPage: 1,
  });

  const paginatedProducts = pagination.getPageData(products);

  return (
    <div>
      {paginatedProducts.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}

      <div className="pagination">
        <button onClick={pagination.previousPage} disabled={!pagination.hasPreviousPage}>
          Previous
        </button>

        {pagination.visiblePages.map((page) => (
          <button
            key={page}
            onClick={() => pagination.goToPage(page)}
            className={page === pagination.currentPage ? 'active' : ''}
          >
            {page}
          </button>
        ))}

        <button onClick={pagination.nextPage} disabled={!pagination.hasNextPage}>
          Next
        </button>
      </div>

      <div>
        Showing {pagination.startIndex + 1} to {pagination.endIndex} of {pagination.totalItems}
      </div>
    </div>
  );
}
```

**API:**

- `currentPage` - Page actuelle
- `totalPages` - Nombre total de pages
- `hasNextPage` / `hasPreviousPage` - Navigation
- `visiblePages` - Pages visibles
- `goToPage(page)` - Aller à une page
- `getPageData(data)` - Obtenir les données de la page actuelle

---

### 3. useFilters()

Système de filtres réutilisable.

```tsx
import { useFilters } from '@/hooks';

function ProductList({ products }) {
  const { filteredData, setFilterValue, hasActiveFilters, clearFilters } = useFilters({
    data: products,
    onFilterChange: (filtered) => {
      console.log('Filtered products:', filtered.length);
    },
  });

  return (
    <div>
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name"
          onChange={(e) => setFilterValue('name', e.target.value, 'contains')}
        />

        <input
          type="number"
          placeholder="Min price"
          onChange={(e) =>
            setFilterValue('price', e.target.value ? Number(e.target.value) : null, 'greaterThan')
          }
        />

        {hasActiveFilters && <button onClick={clearFilters}>Clear Filters</button>}
      </div>

      {filteredData.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

**Opérateurs disponibles:**

- `equals` - Égalité exacte
- `contains` - Contient (texte)
- `startsWith` - Commence par
- `endsWith` - Se termine par
- `greaterThan` - Supérieur à
- `lessThan` - Inférieur à
- `in` - Dans une liste
- `between` - Entre deux valeurs

**API:**

- `filteredData` - Données filtrées
- `setFilterValue(field, value, operator)` - Définir un filtre
- `addFilter(filter)` - Ajouter un filtre
- `removeFilter(field)` - Supprimer un filtre
- `clearFilters()` - Effacer tous les filtres
- `hasActiveFilters` - A des filtres actifs

---

### 4. usePermissions()

Gestion des permissions et rôles utilisateur.

```tsx
import { usePermissions } from '@/hooks';

function AdminPanel() {
  const { canAccess, hasPermission, isAdmin } = usePermissions();

  // Vérifier une permission spécifique
  if (!hasPermission('users:delete')) {
    return <div>Access denied</div>;
  }

  // Vérifier plusieurs permissions/roles
  if (
    !canAccess({
      permissions: ['users:read', 'users:write'],
      roles: ['admin', 'manager'],
      requireAll: false, // true = toutes les permissions requises
    })
  ) {
    return <div>Access denied</div>;
  }

  return (
    <div>
      {isAdmin && <AdminControls />}
      <UserList />
    </div>
  );
}
```

**API:**

- `hasPermission(permission)` - Vérifier une permission
- `hasAnyPermission(permissions[])` - Vérifier au moins une permission
- `hasAllPermissions(permissions[])` - Vérifier toutes les permissions
- `hasRole(role)` - Vérifier un rôle
- `hasAnyRole(roles[])` - Vérifier au moins un rôle
- `canAccess(config)` - Vérifier accès avec config complète
- `isAdmin` - Est administrateur
- `isAuthenticated` - Est authentifié

---

## 🔄 Combinaison de Hooks

### useForm + usePagination + useFilters

```tsx
function ProductManagement() {
  const [products, setProducts] = useState([]);

  const form = useForm({
    validationSchema: productSchema,
    onSubmit: async (data) => {
      await createProduct(data);
      await fetchProducts();
    },
  });

  const { filteredData, setFilterValue } = useFilters({
    data: products,
  });

  const pagination = usePagination({
    totalItems: filteredData.length,
    pageSize: 10,
  });

  const displayData = pagination.getPageData(filteredData);

  return (
    <div>
      {/* Form */}
      <form onSubmit={form.handleSubmit}>...</form>

      {/* Filters */}
      <input onChange={(e) => setFilterValue('name', e.target.value)} />

      {/* Table */}
      <DataTable data={displayData} />

      {/* Pagination */}
      <Pagination {...pagination} />
    </div>
  );
}
```

---

## 📚 Exemples d'Utilisation

### Formulaire avec Validation

```tsx
const userSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const form = useForm({
  validationSchema: userSchema,
  onSubmit: async (data) => {
    await registerUser(data);
  },
});
```

### Filtres Avancés

```tsx
const { filteredData, addFilter } = useFilters({ data: products });

// Filtre par plage de prix
addFilter({
  field: 'price',
  operator: 'between',
  value: [10, 100],
});

// Filtre par catégorie
addFilter({
  field: 'category',
  operator: 'in',
  value: ['electronics', 'books'],
});
```

### Protection de Route

```tsx
function ProtectedPage() {
  const { canAccess, isAuthenticated } = usePermissions();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  if (!canAccess({ permissions: ['page:view'] })) {
    return <div>Access denied</div>;
  }

  return <div>Protected content</div>;
}
```

---

## 🎯 Bonnes Pratiques

1. **useForm**: Utilisez Zod pour la validation côté client et serveur
2. **usePagination**: Combinez avec `useFilters` pour paginer les données filtrées
3. **useFilters**: Utilisez des opérateurs appropriés selon le type de données
4. **usePermissions**: Vérifiez toujours les permissions côté serveur aussi

---

## 🔧 Types TypeScript

Tous les hooks sont entièrement typés :

```typescript
import type {
  UseFormReturn,
  UsePaginationReturn,
  UseFiltersReturn,
  UsePermissionsReturn,
} from '@/hooks';
```
