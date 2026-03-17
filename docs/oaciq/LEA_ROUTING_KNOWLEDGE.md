# Connaissance du routage Léa – Décisions LLM

Ce document est la **source de vérité** pour le classifieur LLM. Le LLM doit analyser le message utilisateur et le dernier message de l'assistant, puis retourner un objet JSON structuré. **Toutes les décisions de routage sont prises par le LLM** à partir de ces instructions ; aucune heuristique en dur ne doit remplacer cette logique.

---

## 1. Champs de sortie (LeaRouterOutput)

Le LLM doit retourner **uniquement** un objet JSON valide, sans texte avant ou après. Format :

```json
{
  "intent": "create_transaction" | "create_pa" | "fill_pa" | "other",
  "tx_type": "vente" | "achat" | "",
  "signals": {
    "asked_property_for_form": boolean,
    "user_confirmed": boolean,
    "user_gave_address": boolean,
    "user_correcting_postal_or_city": boolean,
    "user_wants_geocode": boolean,
    "user_confirmed_geocode": boolean,
    "looks_like_city_only": boolean,
    "user_wants_update_address": boolean,
    "user_wants_update_price": boolean,
    "user_wants_lea_to_complete_form": boolean,
    "user_wants_help_filling_oaciq": boolean,
    "last_message_asked_for_address": boolean,
    "last_message_asked_for_sellers": boolean,
    "last_message_asked_for_buyers": boolean,
    "last_message_asked_to_confirm_pa": boolean,
    "user_wants_create_oaciq_form": boolean,
    "user_wants_set_promise": boolean
  },
  "confidence": 0.0 à 1.0
}
```

---

## 2. Intent

### create_transaction
L'utilisateur veut **créer un nouveau dossier/transaction**.

**Exemples :**
- « Je veux créer une transaction »
- « Nouveau dossier »
- « Créer une transaction »
- « Une vente » / « Un achat » (en début de flow)
- « Encore une transaction », « Une autre transaction »
- « Nouvelle transaction »

**Exclure :** Si l'utilisateur parle de formulaire, promesse d'achat, PA → `create_pa` ou `fill_pa`.

### create_pa
L'utilisateur veut **créer une promesse d'achat** (formulaire PA) pour une transaction existante.

**Exemples :**
- « Créer une promesse d'achat »
- « Je veux un PA »
- « Préparer la promesse pour cette transaction »
- « On fait le PA pour 229 dufferin »
- « Je veux la promesse pour celle-là »
- « Créer le PA pour la transaction #78 »
- « Promesse d'achat pour transaction 85 »
- Réponse par une adresse (ex. « 229 rue dufferin ») ou un numéro (ex. « #78 ») **si** le dernier message de l'assistant demandait « Pour quelle propriété (adresse ou transaction) souhaitez-vous préparer ce formulaire ? »

**Contexte :** Si le dernier message de l'assistant demandait explicitement « pour quelle propriété » ou « quelle transaction » dans le cadre d'un formulaire/PA, et que l'utilisateur répond par une adresse ou un numéro de transaction → `create_pa`.

### fill_pa
L'utilisateur **fournit des données pour remplir** le formulaire PA en cours, ou pose une question sur ce qui manque.

**Exemples :**
- Message long avec coordonnées acheteur, vendeur, acompte, conditions, inclusions, etc.
- « Voici les coordonnées : … »
- « L'acompte c'est 15 000 $ »
- « Qu'est-ce qu'il me manque pour le PA ? »
- « Quels champs restent à remplir ? »

**Contexte :** Si `oaciq_fill` (remplissage PA en cours) est actif dans le contexte, les messages fournissant des infos ou posant des questions sur le formulaire → `fill_pa`.

### other
Toute autre intention : modifier une transaction, poser une question générale, corriger une info, etc.

---

## 3. tx_type

- **vente** : L'utilisateur indique une vente (« vente », « vent », « vnt », « ven », « une vente »)
- **achat** : L'utilisateur indique un achat (« achat », « ach », « acha », « un achat »)
- **""** : Aucun type donné ou hors sujet

---

## 4. Signals – Détail

### asked_property_for_form
**true** si le dernier message de l'assistant demandait **pour quelle propriété ou quelle transaction** l'utilisateur souhaite préparer un formulaire (PA ou autre).

**Exemples de formulations assistant :**
- « Pour quelle propriété (adresse ou numéro de transaction) souhaitez-vous préparer ce formulaire ? »
- « Quelle transaction pour la promesse d'achat ? »
- « Pour quelle propriété ? »
- « Indiquez l'adresse ou le numéro de transaction pour le formulaire »

### user_confirmed
**true** si le message utilisateur est une **confirmation courte** (oui, ok, exact, c'est ça, d'accord, etc.).

**Exemples :**
- « oui », « ok », « exact », « c'est ça », « oui merci », « d'accord », « ok », « ouais », « oui stp »
- « oui pour celle-là », « c'est bien ça »

**Contexte :** Surtout pertinent si le dernier message de l'assistant proposait une action à confirmer (ex. « Souhaitez-vous créer la PA pour la transaction au 229 Dufferin ? »).

### user_gave_address
**true** si le message contient une **adresse** (rue, numéro civique, ville, ou indication géographique).

**Exemples :**
- « 229 rue Dufferin »
- « 4500 rue Berri, Montréal »
- « 8569 delorimier »
- « la propriété au 5540 Saint-Denis »

### user_correcting_postal_or_city
**true** si l'utilisateur **corrige** le code postal ou la ville d'une adresse déjà indiquée.

**Exemples :**
- « non le code postal c'est H2K 1E1 »
- « corrige la ville en Laval »
- « le code postal est H3X 2H9 »
- « pas ça, c'est Montréal »
- « erreur sur le code postal »
- « modifier le code postal »

**Contexte :** Le dernier message de l'assistant doit avoir mentionné une adresse ou un code postal.

### user_wants_geocode
**true** si l'utilisateur demande de **chercher l'adresse/code postal en ligne** (géocodage).

**Exemples :**
- « trouve le code postal en ligne »
- « chercher l'adresse sur internet »
- « ajouter le code postal trouvé en ligne »
- « recherche en ligne pour le code postal »

### user_confirmed_geocode
**true** si le message est une **confirmation courte** (ok, oui) **et** que le dernier message de l'assistant proposait de chercher le code postal en ligne.

**Exemples assistant :** « Voulez-vous que je cherche le code postal en ligne ? », « Je peux faire une recherche en ligne pour compléter l'adresse »

**Exemples utilisateur :** « ok », « oui », « vas-y », « oui merci »

### looks_like_city_only
**true** si le message ressemble à **un nom de ville seul** (1 à 3 mots, pas de chiffres, pas de verbe).

**Exemples :** « Montréal », « Québec », « Laval », « Saint-Laurent »

### user_wants_update_address
**true** si l'utilisateur veut **modifier ou ajouter une adresse** sur une transaction existante.

**Exemples :**
- « l'adresse c'est 456 rue X »
- « corrige l'adresse »
- « en fait l'adresse c'est … »

### user_wants_update_price
**true** si l'utilisateur veut **modifier le prix**.

**Exemples :**
- « le prix c'est 500 000 »
- « en fait 550 000 $ »
- « change le prix »

### user_wants_lea_to_complete_form
**true** si l'utilisateur demande à **Léa de compléter/remplir** un formulaire.

**Exemples :**
- « toi complète le »
- « remplis le formulaire »
- « complète le » (après avoir parlé d'un formulaire)

### user_wants_help_filling_oaciq
**true** si l'utilisateur demande de l'**aide pour remplir** un formulaire OACIQ.

**Exemples :**
- « aide-moi à remplir la promesse »
- « je veux de l'aide pour le PA »
- « comment remplir le formulaire ? »

### last_message_asked_for_address
**true** si le dernier message de l'assistant demandait l'**adresse du bien**.

**Exemples :** « Quelle est l'adresse du bien ? », « Indiquez l'adresse »

### last_message_asked_for_sellers
**true** si le dernier message demandait les **vendeurs**.

**Exemples :** « Qui sont les vendeurs ? », « Noms des vendeurs »

### last_message_asked_for_buyers
**true** si le dernier message demandait les **acheteurs**.

**Exemples :** « Qui sont les acheteurs ? », « Noms des acheteurs »

### last_message_asked_to_confirm_pa
**true** si le dernier message demandait de **confirmer la création** d'une promesse d'achat.

**Exemples :**
- « Souhaitez-vous créer la promesse d'achat pour la transaction au 229 Dufferin ? »
- « Confirmez-vous que vous voulez préparer le PA pour cette propriété ? »

### user_wants_create_oaciq_form
**true** si l'utilisateur veut **créer un formulaire OACIQ** (PA, CP, CCVE, etc.) pour une transaction.

**Exemples :**
- « créer une promesse d'achat »
- « je veux un PA »
- « préparer le formulaire »
- « crée une contre-proposition »
- « formulaire CCVE pour la transaction X »

### user_wants_set_promise
**true** si l'utilisateur parle de **fixer une date de promesse** ou de promesse d'achat (sans forcément créer le formulaire).

**Exemples :** « date de la promesse », « fixer la promesse »

---

## 5. Confidence

- **0.9 à 1.0** : Intention très claire, formulations explicites
- **0.6 à 0.9** : Intention probable, quelques indices
- **0.3 à 0.6** : Ambigu, interprétation possible
- **0.0 à 0.3** : Incertain, mieux vaut `other` avec confidence basse

---

## 6. Règles de priorité

1. **create_pa vs create_transaction** : Si le message mentionne formulaire, PA, promesse → `create_pa` (sauf si clairement « créer une transaction » en premier).
2. **fill_pa** : Prioritaire si le contexte indique qu'un PA est en cours de remplissage et que le message fournit des données ou pose une question sur le formulaire.
3. **asked_property_for_form** : Ne mettre `true` que si le dernier message de l'assistant **demande explicitement** pour quelle propriété/transaction préparer le formulaire.
4. **user_confirmed** : Ne mettre `true` que pour des réponses courtes de confirmation ; un message long avec des infos n'est pas une confirmation.
5. **Signals vides** : Mettre `false` pour tout signal non applicable. Ne pas inventer de valeurs.
