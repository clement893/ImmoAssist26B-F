# Instructions Léa – Promesse d'achat (PA)

Document d'instruction pour le remplissage d'une Promesse d'achat par l'assistant IA (Léa).  
**Référence officielle OACIQ :** [Promesse d'achat – Immeuble principalement résidentiel](https://www.oaciq.com/media/m5seimcc/promesse-achat-immeuble-pag.pdf)

---

## Contexte

Une **transaction existe déjà** et contient : noms des vendeurs, noms des acheteurs, adresse de la propriété, prix offert.  
L'assistant doit **utiliser ces données automatiquement** et **ne pas les redemander** à l'utilisateur.

---

## 1. Informations à récupérer automatiquement de la transaction

L'assistant doit **lire ces champs depuis la transaction** et **ne jamais poser de question** à l'utilisateur pour les obtenir.

| Donnée | Champ transaction | Action |
|--------|-------------------|--------|
| **Parties** | Noms des acheteurs | Utiliser directement pour remplir le formulaire PA |
| | Noms des vendeurs | Utiliser directement |
| **Propriété** | Adresse complète de la propriété | Utiliser directement |
| **Offre** | Prix offert | Utiliser directement |

Si ces informations sont présentes dans la transaction, l'assistant doit les **préremplir** (ou les utiliser en mode guidé) **sans redemander**.

---

## 2. Informations que l'assistant doit demander à l'utilisateur

Ces champs font partie de la promesse d'achat et **ne sont généralement pas dans la transaction**. Léa doit les **demander** (en mode guidé ou en rappel).

### Coordonnées des parties
- Adresse de l'acheteur  
- Téléphone de l'acheteur  
- Courriel de l'acheteur  
- Adresse du vendeur  
- Téléphone du vendeur  
- Courriel du vendeur  

### Mode de paiement
- Paiement comptant / Financement hypothécaire  

### Dépôt en fidéicommis
- Montant du dépôt  
- Délai pour remettre le dépôt  

### Conditions de la promesse d'achat
- Condition d'inspection  
- Condition de financement  
- Condition de vente d'une autre propriété  
- Vérification des documents  
- Autres clauses particulières  

### Inclusions et exclusions
- Biens inclus dans la vente (ex. électroménagers, luminaires, rideaux, spa)  
- Biens exclus de la vente  

### Signature chez le notaire
- Date de signature de l'acte de vente  
- Nom du notaire (optionnel)  

### Occupation
- Date de prise de possession de l'immeuble  

### Acceptation
- Délai d'acceptation de la promesse d'achat (ex. 72 heures)  

---

## 3. Informations que l'assistant ne doit JAMAIS demander

Ces informations sont **légales** et doivent être faites **par les humains** dans l'interface (formulaire ou signature électronique).

L'assistant **ne doit jamais** demander ni remplir à la place de l'utilisateur :

- **Signatures**
  - Signature de l'acheteur  
  - Signature du vendeur  
  - Signature des courtiers  
- **Acceptation légale**
  - Signature d'acceptation du vendeur  

Ces actions doivent être faites **directement dans le formulaire** ou via **signature électronique**. Léa se limite à **expliquer où et comment faire**, pas à effectuer l'acte.

---

## 4. Règle de fonctionnement

| Source | Rôle |
|--------|------|
| **Transaction** | Données existantes → **récupérer automatiquement** (noms, adresse bien, prix offert). Ne pas redemander. |
| **Promesse d'achat** | Conditions et détails de l'offre → **demander** à l'utilisateur (coordonnées, dépôt, conditions, inclusions, dates, délai d'acceptation). |
| **Signature** | **Jamais gérée par le chat.** L'utilisateur signe dans le formulaire ou via l'outil de signature. |

---

## 5. Sections et champs d'une Promesse d'achat (PA) – référence

1. **Identification des parties** – Nom acheteur/vendeur, adresse, courriel/téléphone, représenté par courtier, nom du courtier, agence  
2. **Identification de l'immeuble** – Adresse complète, ville, province, code postal, numéro de lot, type de propriété (maison, duplex, triplex, etc.)  
3. **Prix offert** – Prix offert, devise, mode de paiement (comptant / financement hypothécaire)  
4. **Dépôt en fidéicommis** – Montant du dépôt, mode de paiement du dépôt, courtier fiduciaire, délai de remise  
5. **Conditions de la promesse d'achat** – Condition d'inspection, de financement, de vente d'une autre propriété, vérification des documents, délai pour réaliser les conditions  
6. **Inclusions et exclusions** – Biens inclus, biens exclus (électroménagers, luminaires, rideaux, spa, etc.)  
7. **Date de signature de l'acte de vente** – Date de signature chez le notaire, nom du notaire (optionnel)  
8. **Occupation de l'immeuble** – Date de prise de possession, occupation par l'acheteur  
9. **Déclarations et engagements** – Déclaration de l'acheteur, engagement du vendeur, conditions juridiques  
10. **Acceptation de la promesse d'achat** – Délai d'acceptation, date limite *(la signature du vendeur = jamais par le chat)*  
11. **Signatures** – Signature acheteur, vendeur, date, courtiers → **uniquement par l'utilisateur dans le formulaire**  

---

## 6. Bloc « Promesse d'achat (PA) » sur la fiche transaction

Sur la fiche transaction, le bloc PA affiche : Prix offert, Date promesse, Date acceptation, Date clôture prévue, Limite inspection, Condition inspection, Limite financement, Condition financement. Les valeurs remplies dans le formulaire PA sont synchronisées vers la transaction.

---

## 7. Référence technique

- Mapping détaillé transaction → formulaire : **LEA_KNOWLEDGE_PA.md** (si existant).  
- Préremplissage et mode guidé (champ par champ) : les données saisies en conversation sont enregistrées dans le brouillon du formulaire et visibles dans **Transactions → [transaction] → onglet Formulaires OACIQ**.
