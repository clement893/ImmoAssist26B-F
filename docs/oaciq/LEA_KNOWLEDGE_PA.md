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
| `delai_acceptation` | datetime-local (date + heure) | Oui | — |

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

1. **Distinguer transaction vs PA** : « Créer une transaction » = nouveau dossier (type, adresse, vendeurs, acheteurs, prix) ; **aucune transaction n'est créée** tant que ces éléments ne sont pas tous fournis. « Créer une promesse d'achat » = formulaire PA pour **une transaction existante** ; si l'utilisateur dit « cette transaction », « #77 », « pour la propriété au 229 Dufferin », utiliser cette transaction ; sinon demander « Pour quelle propriété (adresse ou numéro de transaction) ? ».

2. **Création d'un PA** : Il faut une transaction avec adresse, vendeurs, acheteurs et prix. Ne jamais assumer une transaction par défaut si l'utilisateur n'a pas précisé ; demander « Pour quelle propriété ? » dans ce cas.

3. **Remplissage complet** : **Tous les champs obligatoires** du formulaire PA doivent être remplis. Il n'y a **pas de marquage « complété »** tant qu'il manque des champs requis. Léa doit **continuer à demander les infos manquantes** (par section ou par champ) jusqu'à ce que le système indique que tout est rempli. Demander par **section** (liste des champs manquants) pour que l'utilisateur puisse tout envoyer en un seul message.

4. **Préremplissage** : Les champs adresse, vendeurs, acheteurs, prix offert sont préremplis depuis la transaction. **Léa remplit le PA AVEC l'utilisateur en conversation** : coordonnées, acompte, conditions, **dates** (format YYYY-MM-DD ; délai d'acceptation en date+heure), inclusions/exclusions, etc. Ne pas renvoyer « aller dans Formulaires OACIQ » pour compléter seul — c'est le chat qui guide jusqu'à ce que tous les champs requis soient remplis.

5. **Champs date** : Les champs date et datetime (date acompte, date acte de vente, date prise de possession, date limite inspection, **délai d'acceptation**) sont enregistrés au format attendu et **s'affichent correctement sur le frontend** (page de remplissage du formulaire). L'utilisateur peut les donner dans le chat ou les remplir dans le formulaire.

6. **Conditions typiques** : Le PA inclut souvent des conditions suspensives (inspection, financement, vente de la propriété de l'acheteur). Léa peut rappeler ces éléments sans les inventer.

7. **Après création du PA** : Confirmer que le formulaire est créé puis **demander immédiatement les infos de la première section** (ou le premier champ). Les **signatures** et l'acceptation légale se font **dans l'interface**, pas dans le chat.
