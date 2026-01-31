# Système de Progression des Transactions

Ce module implémente la logique de progression des transactions immobilières selon le workflow québécois.

## Composants

### StatusStepper

Composant React réutilisable pour afficher visuellement la progression d'une transaction.

**Props:**
- `steps: TransactionStep[]` - Liste des étapes à afficher
- `orientation?: 'vertical' | 'horizontal'` - Orientation de l'affichage (défaut: 'vertical')
- `showProgress?: boolean` - Afficher la barre de progression globale (défaut: true)
- `className?: string` - Classes CSS supplémentaires

**Exemple d'utilisation:**

```tsx
import StatusStepper from '@/components/transactions/StatusStepper';
import { calculateTransactionSteps } from '@/lib/transactions/progression';

const steps = calculateTransactionSteps(transaction);
<StatusStepper steps={steps} showProgress={true} />
```

## Fonctions utilitaires

### `calculateTransactionSteps(transaction: TransactionData): TransactionStep[]`

Calcule les étapes détaillées de progression d'une transaction basées sur les données de la transaction.

**Étapes calculées:**
1. **Création du dossier** - Toujours complétée
2. **Promesse d'achat** - Basée sur `promise_to_purchase_date` et `promise_acceptance_date`
3. **Inspection du bâtiment** - Basée sur les dates d'inspection et la levée de condition
4. **Financement hypothécaire** - Basée sur l'approbation et la levée de condition
5. **Vente ferme** - Toutes les conditions levées
6. **Documents notariés** - Certificat de localisation, déclaration du vendeur, assurance
7. **Signature des actes** - Acte d'hypothèque et acte de vente
8. **Prise de possession** - Date de prise de possession
9. **Finalisation** - Quittance confirmée

### `getTransactionProgressionStatus(transaction: TransactionData)`

Détermine le statut de progression global d'une transaction.

**Retourne:**
```typescript
{
  currentStep: string;        // ID de l'étape actuelle
  overallProgress: number;    // Pourcentage de progression (0-100)
  status: 'draft' | 'active' | 'pending_conditions' | 'firm' | 'closing' | 'closed' | 'cancelled';
}
```

## Statuts des étapes

- `completed` - Étape complétée
- `current` - Étape en cours
- `pending` - Étape en attente
- `blocked` - Étape bloquée (ex: inspection non satisfaisante)
- `warning` - Étape nécessitant une attention (ex: date limite dépassée)

## Workflow québécois

Le système suit le workflow standard des transactions immobilières au Québec:

1. **DRAFT** (5%) - Transaction créée
2. **ACTIVE** (15%) - Promesse d'achat soumise
3. **PENDING_CONDITIONS** (30%) - Promesse acceptée, conditions en attente
4. **FIRM** (60%) - Toutes conditions levées, vente ferme
5. **CLOSING** (85%) - Actes signés, en attente de clôture
6. **CLOSED** (100%) - Transaction conclue et finalisée

## API Backend

### GET `/api/v1/transactions/{transaction_id}/progression`

Endpoint pour obtenir le statut de progression d'une transaction depuis le backend.

**Réponse:**
```json
{
  "transaction_id": 1,
  "current_step": "conditions",
  "overall_progress": 30,
  "status": "pending_conditions",
  "steps": {
    "creation": { "completed": true, "date": "2026-01-01T00:00:00" },
    "promise": { "completed": true, "date": "2026-01-05T00:00:00" },
    "inspection": { "completed": false, "deadline": "2026-02-01" },
    "financing": { "completed": false, "deadline": "2026-02-05" },
    ...
  }
}
```
