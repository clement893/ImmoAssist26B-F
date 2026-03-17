# Plan d'Implantation : Système de Gestion de Contacts pour Transactions Immobilières

## 📋 Vue d'ensemble

Ce document détaille le plan d'implantation d'un système de gestion de contacts centralisé pour les transactions immobilières. Le système permettra de gérer tous les intervenants (clients, professionnels) et de les associer à des transactions avec des rôles définis.

**Date de création** : 2026-01-31  
**Statut** : Planification

---

## 🎯 Objectifs

1. **Centraliser la gestion des contacts** : Un carnet d'adresses unique pour tous les intervenants
2. **Éviter la duplication** : Réutiliser les contacts existants dans plusieurs transactions
3. **Flexibilité des rôles** : Permettre à un contact d'avoir plusieurs rôles dans une même transaction
4. **Intégration utilisateurs** : Lier les utilisateurs de l'application aux contacts

---

## 📊 Architecture Actuelle vs Cible

### État Actuel
- Les contacts sont stockés en JSON dans `RealEstateTransaction` (sellers, buyers)
- Les professionnels sont stockés dans des champs séparés (notary_name, inspector_name, etc.)
- Il existe déjà un modèle `Contact` pour le module commercial/réseau
- Pas de réutilisation des contacts entre transactions

### État Cible
- Modèle `Contact` centralisé pour les transactions immobilières
- Table de liaison `TransactionContact` pour associer contacts et transactions avec rôles
- Réutilisation des contacts dans plusieurs transactions
- Lien optionnel avec le modèle `User` existant

---

## 🗂️ Phase 1 : Modèle de Données (Backend)

### 1.1 Création/Extension du Modèle Contact

**Fichier** : `backend/app/models/real_estate_contact.py`

**Décisions d'architecture** :
- Créer un nouveau modèle `RealEstateContact` pour éviter les conflits avec le `Contact` commercial existant
- Ou étendre le modèle `Contact` existant avec un champ `type` pour différencier les types de contacts

**Recommandation** : Créer `RealEstateContact` pour séparer les préoccupations

```python
class RealEstateContact(Base):
    """Contact model for real estate transactions"""
    __tablename__ = "real_estate_contacts"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True, unique=True, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(200), nullable=True)
    type = Column(Enum(ContactType), nullable=False, index=True)
    
    # Lien optionnel avec User
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True)
    
    # Relations
    user = relationship("User", backref="real_estate_contact")
    transaction_roles = relationship("TransactionContact", back_populates="contact", cascade="all, delete-orphan")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

**Enum ContactType** :
```python
class ContactType(str, enum.Enum):
    CLIENT = "client"
    REAL_ESTATE_BROKER = "real_estate_broker"
    MORTGAGE_BROKER = "mortgage_broker"
    NOTARY = "notary"
    INSPECTOR = "inspector"
    CONTRACTOR = "contractor"
    INSURANCE_BROKER = "insurance_broker"
    OTHER = "other"
```

### 1.2 Création de la Table de Liaison

**Fichier** : `backend/app/models/transaction_contact.py`

```python
class TransactionContact(Base):
    """Association table between transactions and contacts with roles"""
    __tablename__ = "transaction_contacts"
    
    transaction_id = Column(Integer, ForeignKey("real_estate_transactions.id", ondelete="CASCADE"), primary_key=True)
    contact_id = Column(Integer, ForeignKey("real_estate_contacts.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String(100), primary_key=True)  # "Vendeur", "Acheteur", "Notaire instrumentant", etc.
    
    # Relations
    transaction = relationship("RealEstateTransaction", back_populates="transaction_contacts")
    contact = relationship("RealEstateContact", back_populates="transaction_roles")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (
        Index("idx_transaction_contacts_transaction", "transaction_id"),
        Index("idx_transaction_contacts_contact", "contact_id"),
        Index("idx_transaction_contacts_role", "role"),
    )
```

### 1.3 Mise à Jour du Modèle Transaction

**Fichier** : `backend/app/models/real_estate_transaction.py`

**Modifications** :
- Ajouter la relation `transaction_contacts`
- Conserver les champs JSON existants pour compatibilité (migration progressive)
- Ajouter une méthode helper pour récupérer les contacts par rôle

```python
# Ajouter dans RealEstateTransaction
transaction_contacts = relationship("TransactionContact", back_populates="transaction", cascade="all, delete-orphan")

def get_contacts_by_role(self, role: str) -> List[RealEstateContact]:
    """Helper method to get contacts by role"""
    return [tc.contact for tc in self.transaction_contacts if tc.role == role]
```

### 1.4 Migration Alembic

**Fichier** : `backend/alembic/versions/XXX_create_real_estate_contacts.py`

**Étapes** :
1. Créer la table `real_estate_contacts`
2. Créer la table `transaction_contacts`
3. Ajouter la colonne `user_id` à `real_estate_contacts` (nullable)
4. Créer les index nécessaires
5. Script de migration des données existantes (optionnel)

**Script de migration des données** :
- Extraire les contacts des champs JSON (sellers, buyers)
- Créer les contacts dans `real_estate_contacts`
- Créer les associations dans `transaction_contacts`

---

## 🔌 Phase 2 : API Backend

### 2.1 Schémas Pydantic

**Fichier** : `backend/app/schemas/real_estate_contact.py`

**Schémas à créer** :
- `RealEstateContactBase`
- `RealEstateContactCreate`
- `RealEstateContactUpdate`
- `RealEstateContactResponse`
- `TransactionContactCreate` (pour associer un contact à une transaction)
- `TransactionContactResponse`

### 2.2 Endpoints API

**Fichier** : `backend/app/api/v1/endpoints/real_estate_contacts.py`

#### Endpoints de gestion des contacts

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/v1/real-estate-contacts` | Créer un nouveau contact | ✅ |
| GET | `/api/v1/real-estate-contacts` | Lister tous les contacts (avec recherche/filtre) | ✅ |
| GET | `/api/v1/real-estate-contacts/{id}` | Obtenir les détails d'un contact | ✅ |
| PUT | `/api/v1/real-estate-contacts/{id}` | Mettre à jour un contact | ✅ |
| DELETE | `/api/v1/real-estate-contacts/{id}` | Supprimer un contact (soft delete) | ✅ |

#### Endpoints de liaison transaction-contact

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/api/v1/transactions/{id}/contacts` | Associer un contact à une transaction | ✅ |
| GET | `/api/v1/transactions/{id}/contacts` | Lister les contacts d'une transaction | ✅ |
| DELETE | `/api/v1/transactions/{id}/contacts/{contact_id}/{role}` | Dissocier un contact d'une transaction | ✅ |

**Payload POST `/api/v1/transactions/{id}/contacts`** :
```json
{
  "contact_id": 123,
  "role": "Notaire instrumentant"
}
```

### 2.3 Logique Métier

**À implémenter** :

1. **Création automatique de contact lors de l'inscription utilisateur**
   - Hook dans le processus d'inscription
   - Créer un `RealEstateContact` et lier via `user_id`

2. **Validation de l'unicité de l'email**
   - Vérifier que l'email n'existe pas déjà lors de la création
   - Permettre la mise à jour si c'est le même contact

3. **Gestion des rôles multiples**
   - Un même contact peut avoir plusieurs rôles dans une transaction
   - Validation des rôles autorisés (enum ou liste)

4. **Recherche et filtrage**
   - Recherche par nom, email, type
   - Filtrage par type de contact
   - Tri par nom, date de création

---

## 🎨 Phase 3 : Frontend

### 3.1 Types TypeScript

**Fichier** : `apps/web/src/types/real-estate-contact.ts`

```typescript
export enum ContactType {
  CLIENT = "client",
  REAL_ESTATE_BROKER = "real_estate_broker",
  MORTGAGE_BROKER = "mortgage_broker",
  NOTARY = "notary",
  INSPECTOR = "inspector",
  CONTRACTOR = "contractor",
  INSURANCE_BROKER = "insurance_broker",
  OTHER = "other",
}

export interface RealEstateContact {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  type: ContactType;
  user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionContact {
  transaction_id: number;
  contact_id: number;
  role: string;
  contact: RealEstateContact;
  created_at: string;
}
```

### 3.2 API Client

**Fichier** : `apps/web/src/lib/api/real-estate-contacts.ts`

**Fonctions à créer** :
- `createContact(data: ContactCreate): Promise<Contact>`
- `listContacts(params?: ListParams): Promise<ContactListResponse>`
- `getContact(id: number): Promise<Contact>`
- `updateContact(id: number, data: ContactUpdate): Promise<Contact>`
- `deleteContact(id: number): Promise<void>`
- `addContactToTransaction(transactionId: number, contactId: number, role: string): Promise<void>`
- `getTransactionContacts(transactionId: number): Promise<TransactionContact[]>`
- `removeContactFromTransaction(transactionId: number, contactId: number, role: string): Promise<void>`

### 3.3 Composants

#### 3.3.1 ContactManagerView

**Fichier** : `apps/web/src/app/[locale]/dashboard/contacts/page.tsx`

**Fonctionnalités** :
- Table de tous les contacts avec pagination
- Recherche par nom, email
- Filtrage par type de contact
- Tri par colonnes
- Bouton "Ajouter un contact" → ouvre modal
- Actions : Voir détails, Modifier, Supprimer

**Composants enfants** :
- `ContactTable` : Table avec colonnes (Nom, Email, Téléphone, Type, Entreprise, Actions)
- `ContactFormModal` : Formulaire de création/édition
- `ContactFilters` : Barre de filtres et recherche

#### 3.3.2 TransactionContactsCard

**Fichier** : `apps/web/src/components/transactions/TransactionContactsCard.tsx`

**Fonctionnalités** :
- Afficher les contacts groupés par rôle
- Sections : Vendeurs, Acheteurs, Professionnels
- Carte par contact avec nom, email, téléphone
- Bouton "Ajouter un intervenant" → ouvre `AddContactToTransactionModal`
- Actions : Voir détails, Retirer de la transaction

**Props** :
```typescript
interface TransactionContactsCardProps {
  transactionId: number;
  contacts: TransactionContact[];
  onContactAdded?: () => void;
  onContactRemoved?: () => void;
}
```

#### 3.3.3 AddContactToTransactionModal

**Fichier** : `apps/web/src/components/transactions/AddContactToTransactionModal.tsx`

**Fonctionnalités** :
- Champ de recherche pour trouver un contact existant
- Liste déroulante des contacts correspondants
- Bouton "Créer un nouveau contact" si non trouvé
- Champ `role` (dropdown avec rôles prédéfinis ou texte libre)
- Validation : contact et rôle requis

**Rôles prédéfinis** :
- Vendeur
- Acheteur
- Courtier immobilier (vendeur)
- Courtier immobilier (acheteur)
- Notaire instrumentant
- Inspecteur en bâtiments
- Arpenteur-géomètre
- Conseiller hypothécaire
- Autre

**Props** :
```typescript
interface AddContactToTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: number;
  onContactAdded: () => void;
}
```

### 3.4 Intégration dans TransactionDashboard

**Fichier** : `apps/web/src/app/[locale]/dashboard/transactions/[id]/page.tsx`

**Modifications** :
- Ajouter `TransactionContactsCard` dans le dashboard
- Charger les contacts de la transaction
- Gérer les callbacks de mise à jour

---

## 🔄 Phase 4 : Migration des Données

### 4.1 Script de Migration

**Fichier** : `backend/scripts/migrate_transaction_contacts.py`

**Logique** :
1. Parcourir toutes les transactions existantes
2. Extraire les contacts des champs JSON (sellers, buyers)
3. Pour chaque contact :
   - Vérifier s'il existe déjà (par email ou nom)
   - Créer le contact s'il n'existe pas
   - Créer l'association dans `transaction_contacts`
4. Extraire les professionnels des champs séparés
5. Créer les contacts et associations correspondants

**Exemple** :
```python
def migrate_transaction_contacts():
    transactions = db.query(RealEstateTransaction).all()
    
    for transaction in transactions:
        # Migrer sellers
        for seller in transaction.sellers:
            contact = find_or_create_contact(seller)
            create_transaction_contact(transaction.id, contact.id, "Vendeur")
        
        # Migrer buyers
        for buyer in transaction.buyers:
            contact = find_or_create_contact(buyer)
            create_transaction_contact(transaction.id, contact.id, "Acheteur")
        
        # Migrer professionnels
        if transaction.notary_name:
            contact = find_or_create_professional(
                name=transaction.notary_name,
                company=transaction.notary_firm,
                type=ContactType.NOTARY
            )
            create_transaction_contact(transaction.id, contact.id, "Notaire instrumentant")
```

### 4.2 Stratégie de Migration Progressive

**Option 1 : Migration complète**
- Migrer toutes les données en une fois
- Désactiver temporairement l'écriture dans les anciens champs

**Option 2 : Migration progressive (recommandée)**
- Garder les anciens champs JSON pour compatibilité
- Écrire simultanément dans les deux systèmes
- Migrer progressivement lors des mises à jour

---

## ✅ Phase 5 : Tests

### 5.1 Tests Backend

**Fichiers** :
- `backend/tests/test_real_estate_contacts.py`
- `backend/tests/test_transaction_contacts.py`

**Tests à créer** :
- Création de contact
- Recherche et filtrage
- Association contact-transaction
- Rôles multiples
- Validation d'unicité email
- Suppression en cascade

### 5.2 Tests Frontend

**Fichiers** :
- `apps/web/src/components/transactions/__tests__/TransactionContactsCard.test.tsx`
- `apps/web/src/components/transactions/__tests__/AddContactToTransactionModal.test.tsx`

**Tests à créer** :
- Affichage des contacts
- Recherche de contacts
- Ajout de contact à transaction
- Suppression de contact

---

## 📅 Plan d'Exécution

### Semaine 1 : Backend - Modèles et Migrations
- [ ] Jour 1-2 : Créer les modèles `RealEstateContact` et `TransactionContact`
- [ ] Jour 3 : Créer la migration Alembic
- [ ] Jour 4-5 : Créer les schémas Pydantic

### Semaine 2 : Backend - API
- [ ] Jour 1-2 : Implémenter les endpoints de gestion des contacts
- [ ] Jour 3-4 : Implémenter les endpoints de liaison transaction-contact
- [ ] Jour 5 : Tests backend et corrections

### Semaine 3 : Frontend - Composants
- [ ] Jour 1-2 : Créer `ContactManagerView` et `ContactTable`
- [ ] Jour 3 : Créer `TransactionContactsCard`
- [ ] Jour 4 : Créer `AddContactToTransactionModal`
- [ ] Jour 5 : Intégration dans TransactionDashboard

### Semaine 4 : Migration et Finalisation
- [ ] Jour 1-2 : Script de migration des données
- [ ] Jour 3 : Tests end-to-end
- [ ] Jour 4 : Documentation utilisateur
- [ ] Jour 5 : Déploiement et monitoring

---

## 🔍 Points d'Attention

### 1. Conflit avec Contact existant
- **Problème** : Il existe déjà un modèle `Contact` pour le module commercial
- **Solution** : Créer `RealEstateContact` séparé pour éviter les conflits

### 2. Migration des données existantes
- **Problème** : Les contacts sont actuellement en JSON
- **Solution** : Script de migration avec gestion des doublons

### 3. Compatibilité ascendante
- **Problème** : Ne pas casser les fonctionnalités existantes
- **Solution** : Garder les champs JSON pendant la transition, migration progressive

### 4. Performance
- **Problème** : Requêtes avec plusieurs jointures
- **Solution** : Index appropriés, eager loading pour les relations fréquentes

### 5. Validation des rôles
- **Problème** : Rôles libres ou prédéfinis ?
- **Solution** : Liste prédéfinie avec option "Autre" pour flexibilité

---

## 📚 Documentation à Créer

1. **Guide utilisateur** : Comment utiliser le système de contacts
2. **Documentation API** : Swagger/OpenAPI mis à jour
3. **Guide de migration** : Instructions pour migrer les données existantes
4. **Architecture décisionnelle** : Pourquoi ces choix techniques

---

## 🎯 Critères de Succès

- [ ] Tous les contacts peuvent être créés et gérés via l'interface
- [ ] Les contacts peuvent être associés à plusieurs transactions
- [ ] Un contact peut avoir plusieurs rôles dans une transaction
- [ ] La recherche et le filtrage fonctionnent correctement
- [ ] Les données existantes sont migrées sans perte
- [ ] Les performances sont acceptables (< 200ms pour les requêtes)
- [ ] Les tests couvrent > 80% du code

---

## 📝 Notes d'Implémentation

### Ordre de priorité recommandé

1. **Critique** : Modèles et migrations (base de tout)
2. **Important** : Endpoints API de base (CRUD contacts)
3. **Important** : Endpoints de liaison transaction-contact
4. **Utile** : Interface de gestion des contacts
5. **Utile** : Composants d'intégration dans transactions
6. **Optionnel** : Script de migration (peut être fait après)

### Dépendances

- Phase 1 → Phase 2 (API nécessite les modèles)
- Phase 2 → Phase 3 (Frontend nécessite l'API)
- Phase 4 peut être faite en parallèle ou après Phase 3

---

**Prochaines étapes** : Valider ce plan avec l'équipe, puis commencer par la Phase 1.
