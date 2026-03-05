# Formulaire PA – Promesse d'achat – Référence pour Léa

Ce document décrit le formulaire **PA (Promesse d'achat)** OACIQ pour que Léa puisse guider les courtiers et traiter les demandes liées à ce formulaire.

---

## Vue d'ensemble

- **Code** : PA
- **Nom** : Promesse d'achat – Immeuble principalement résidentiel de moins de 5 logements excluant la copropriété
- **Catégorie** : Obligatoire
- **Usage** : Formaliser l'offre d'achat d'un acheteur sur un immeuble résidentiel (maison, duplex, triplex, quadruplex)

---

## Mapping complet des champs (16 sections)

### Section 1 – Identification des parties
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `acheteurs` | textarea | Oui | `buyers` (liste de noms) |
| `vendeurs` | textarea | Oui | `sellers` (liste de noms) |

### Section 2 – Objet de la promesse d'achat
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `property_address` | text | Oui | `property_address` |
| `property_city` | text | Oui | `property_city` |
| `property_postal_code` | text | Oui | `property_postal_code` |
| `property_province` | text | Oui | `property_province` |
| `prix_offert` | number | Oui | `offered_price` |
| `courtier_nom` | text | Non | — |
| `courtier_permis` | text | Non | — |

### Section 3 – Description sommaire de l'immeuble
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `description_immeuble` | textarea | Non | — |

### Section 4 – Prix et acompte
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `prix_achat` | number | Oui | `offered_price` |
| `acompte` | number | Oui | — |
| `date_acompte` | date | Non | — |

### Section 5 – Mode de paiement
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `mode_paiement` | textarea | Non | — |

### Section 6 – Nouvel emprunt hypothécaire
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `montant_hypotheque` | number | Non | — |
| `delai_financement` | number | Non | — |

### Section 7 – Déclarations et obligations de l'acheteur
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `date_acte_vente` | date | Oui | `expected_closing_date` |
| `date_occupation` | date | Non | — |

### Section 8 – Inspection par une personne désignée par l'acheteur
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `condition_inspection` | number | Non | — |
| `date_limite_inspection` | date | Non | — |

### Section 9 – Examen de documents par l'acheteur
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `condition_documents` | number | Non | — |

### Section 10 – Déclarations et obligations du vendeur
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `declarations_vendeur` | textarea | Non | — |

### Section 11 – Déclarations et obligations communes
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `declarations_communes` | textarea | Non | — |

### Section 12 – Autres déclarations et conditions
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `inclusions` | textarea | Non | — |
| `exclusions` | textarea | Non | — |
| `autres_conditions` | textarea | Non | — |

### Section 13 – Annexes
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `annexes` | textarea | Non | — |

### Section 14 – Conditions d'acceptation
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `delai_acceptation` | text | Non | — |

### Section 15 – Interprétation
(Section pré-imprimée, pas de champs à remplir)

### Section 16 – Signatures
| Champ formulaire | Type | Requis | Correspondance transaction |
|-----------------|------|--------|----------------------------|
| `date_signature_acheteur` | date | Non | — |
| `date_signature_vendeur` | date | Non | — |

---

## Alias pour le préremplissage

Lorsque Léa préremplit le formulaire PA depuis une transaction, les champs suivants sont mappés (plusieurs clés possibles selon la structure du formulaire) :

| Donnée transaction | Clés formulaire acceptées |
|--------------------|---------------------------|
| Adresse | `property_address`, `adresse`, `adresse_immeuble`, `adresse_bien` |
| Ville | `property_city`, `ville`, `city` |
| Code postal | `property_postal_code`, `code_postal`, `postal_code` |
| Province | `property_province`, `province` |
| Adresse complète | `full_address`, `adresse_complete`, `adresse_complete_immeuble` |
| Vendeurs | `sellers`, `vendeurs`, `vendeur`, `noms_vendeurs` |
| Acheteurs | `buyers`, `acheteurs`, `acheteur`, `noms_acheteurs` |
| Prix offert | `offered_price`, `prix_offert`, `prix_achat`, `purchase_price`, `prix` |
| Date de clôture | `expected_closing_date`, `date_cloture`, `date_acte_vente`, `date_signature_acte` |

---

## Instructions pour Léa

1. **Création d'un PA** : Rappeler qu'il faut une transaction avec adresse complète, vendeurs et acheteurs identifiés. Ne jamais assumer une transaction par défaut : demander « Pour quelle propriété ? » si l'utilisateur ne précise pas.

2. **Préremplissage** : Les champs adresse, vendeurs, acheteurs, prix offert et date de clôture peuvent être préremplis depuis la transaction. Indiquer à l'utilisateur d'aller dans Transactions → ouvrir la transaction → onglet Formulaires OACIQ → compléter le PA.

3. **Conditions typiques** : Le PA inclut souvent des conditions suspensives (inspection, financement, vente de la propriété de l'acheteur). Léa peut rappeler ces éléments sans les inventer.

4. **Prochaine étape** : Après création du PA, guider vers la page de remplissage : `/dashboard/modules/formulaire/oaciq/PA/fill` ou via Transactions → [transaction] → Formulaires OACIQ → PA.
