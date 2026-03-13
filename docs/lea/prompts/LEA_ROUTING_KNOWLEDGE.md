# Connaissance du routage Léa – Domain-Intent-Entities

Ce document est la **source de vérité** pour le routeur LLM. Le LLM analyse le message utilisateur, le dernier message de l'assistant et le contexte, puis retourne un objet JSON structuré avec **domain**, **intent**, **entities**, **signals** et **confidence**. **Toutes les décisions de routage sont prises par le LLM** ; aucune heuristique en dur ne doit remplacer cette logique.

---

## 1. Champs de sortie (RoutingDecision)

Le LLM doit retourner **uniquement** un objet JSON valide, sans texte avant ou après. Format :

```json
{
  "domain": "transaction" | "purchase_offer" | "general_assistance" | "other",
  "intent": "create" | "fill" | "update" | "confirm" | "cancel" | "resume" | "ask_help" | "answer",
  "entities": [
    {"name": "transaction_type", "value": "vente", "confidence": 0.9},
    {"name": "property_reference", "value": "229 rue Dufferin", "confidence": 0.85}
  ],
  "signals": {
    "asked_property_for_form": false,
    "user_confirmed": false,
    "user_gave_address": false,
    "user_correcting_postal_or_city": false,
    "user_wants_geocode": false,
    "user_confirmed_geocode": false,
    "looks_like_city_only": false,
    "user_wants_update_address": false,
    "user_wants_update_price": false,
    "user_wants_lea_to_complete_form": false,
    "user_wants_help_filling_oaciq": false,
    "last_message_asked_for_address": false,
    "last_message_asked_for_sellers": false,
    "last_message_asked_for_buyers": false,
    "last_message_asked_to_confirm_pa": false,
    "user_wants_create_oaciq_form": false,
    "user_wants_set_promise": false,
    "flow_interruption": false
  },
  "confidence": 0.85
}
```

---

## 2. Domain

### transaction
L'utilisateur parle de **création ou gestion d'une transaction** (dossier, vente, achat).

**Contexte typique :** Création de dossier, collecte type/adresse/parties/prix, correction d'une transaction.

### purchase_offer
L'utilisateur parle de **promesse d'achat (PA)** : création ou remplissage du formulaire PA.

**Contexte typique :** « Créer une PA », « On fait le PA », remplissage des champs du formulaire.

### general_assistance
Questions générales, explications, aide sans action spécifique sur transaction ou PA.

### other
Hors périmètre, intention incertaine.

---

## 3. Intent

| Intent | Signification |
|--------|---------------|
| **create** | Créer un nouveau dossier (transaction) ou une nouvelle PA |
| **fill** | Continuer le remplissage d'une PA en cours (fournir des champs) |
| **update** | Corriger ou modifier une info déjà fournie (transaction ou PA) |
| **confirm** | Confirmer une action proposée par l'assistant (ex. « oui », « c'est ça ») |
| **cancel** | Annuler le flow en cours |
| **resume** | Reprendre un flow suspendu |
| **ask_help** | Demander une explication (champ, section, règle) |
| **answer** | Réponse à une question de suivi (type, adresse, parties, prix, etc.) |

---

## 4. Mapping Domain + Intent par cas

| Cas | domain | intent |
|-----|--------|--------|
| Créer une transaction | transaction | create |
| Préciser type (vente/achat) | transaction | answer |
| Fournir adresse/propriété | transaction | answer |
| Fournir vendeurs/acheteurs | transaction | answer |
| Fournir prix | transaction | answer |
| Corriger une transaction | transaction | update |
| Créer une PA | purchase_offer | create |
| Réponse par adresse après « pour quelle propriété ? » | purchase_offer | create |
| Confirmer création PA | purchase_offer | confirm |
| Remplir les champs PA | purchase_offer | fill |
| Corriger un champ PA | purchase_offer | update |
| Demander explication sur un champ | purchase_offer | ask_help |
| Reprendre le PA | purchase_offer | resume |

---

## 5. Entities

Les entities sont les **données extraites** du message. Noms reconnus :

**Transaction :** `transaction_type` (vente/achat), `property_reference`, `seller_names`, `buyer_names`, `listing_price`, `offer_price`, `address`.

**Promesse d'achat :** `occupation_date`, `deposit_amount`, `inclusions`, `exclusions`, `financing_delay`, `inspection_delay`, `notary_name`, `acheteur_adresse`, `acheteur_telephone`, `acheteur_courriel`, `vendeur_adresse`, `vendeur_telephone`, `vendeur_courriel`, et tout autre champ du formulaire PA.

**Transversal :** `transaction_id`, `form_submission_id`, `confirmation_value`.

**Règle :** Inclure une entity uniquement si elle est **clairement présente** dans le message. `confidence` par entity : 0.0 à 1.0.

---

## 6. tx_type (legacy / entities)

Pour compatibilité, si `domain=transaction` et que le message indique vente ou achat, inclure dans entities : `{"name": "transaction_type", "value": "vente"}` ou `"achat"`.

---

## 7. Signals – Détail

Tous les signals sont des booléens. Mettre `true` uniquement si applicable.

### asked_property_for_form
Dernier message assistant demandait **pour quelle propriété ou transaction** préparer le formulaire.

### user_confirmed
Message = confirmation courte (oui, ok, exact, c'est ça, oui pour celle-là, etc.).

### user_gave_address
Message contient une adresse ou référence géographique.

### user_correcting_postal_or_city
Utilisateur corrige code postal ou ville.

### user_wants_geocode
Utilisateur demande de chercher l'adresse/code postal en ligne.

### user_confirmed_geocode
Confirmation courte **et** dernier message proposait le géocodage.

### looks_like_city_only
Message = nom de ville seul (1–3 mots, pas de chiffres).

### user_wants_update_address
Utilisateur veut modifier l'adresse d'une transaction.

### user_wants_update_price
Utilisateur veut modifier le prix.

### user_wants_lea_to_complete_form
Utilisateur demande à Léa de compléter/remplir un formulaire.

### user_wants_help_filling_oaciq
Utilisateur demande de l'aide pour remplir un formulaire OACIQ.

### last_message_asked_for_address
Dernier message demandait l'adresse du bien.

### last_message_asked_for_sellers
Dernier message demandait les vendeurs.

### last_message_asked_for_buyers
Dernier message demandait les acheteurs.

### last_message_asked_to_confirm_pa
Dernier message demandait de confirmer la création d'une PA.

### user_wants_create_oaciq_form
Utilisateur veut créer un formulaire OACIQ (PA, CP, etc.).

### user_wants_set_promise
Utilisateur parle de date de promesse.

### flow_interruption
Utilisateur change de sujet en plein flow.

---

## 8. Confidence

- **0.9 à 1.0** : Intention très claire
- **0.6 à 0.9** : Intention probable
- **0.3 à 0.6** : Ambigu
- **0.0 à 0.3** : Incertain → `domain=other`, `intent=answer`

---

## 9. Règles de priorité

1. **fill_pa prioritaire** : Si contexte indique PA en cours de remplissage et message fournit des données → `domain=purchase_offer`, `intent=fill`.
2. **create_pa vs create_transaction** : Mention de formulaire, PA, promesse → `purchase_offer` + `create` (sauf si clairement « créer une transaction »).
3. **asked_property_for_form** : `true` uniquement si le dernier message **demande explicitement** pour quelle propriété/transaction.
4. **user_confirmed** : `true` uniquement pour réponses courtes ; message long avec infos → pas confirmation.
5. **Entities** : Ne pas inventer. Inclure uniquement ce qui est lisiblement présent dans le message.
