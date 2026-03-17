# Pipeline : récupération des infos de transaction depuis le chat Léa → BD → affichage

## 1. Entrée (conversation chat)

- **Frontend** envoie à chaque message :
  - `message` : texte utilisateur
  - `session_id` : session de conversation
  - `last_assistant_message` : **dernier message de Léa** (lu avant d'ajouter le message user) pour le contexte (ex. « Qui sont les vendeurs ? »)
  - `transaction_id` : optionnel, présent quand on ouvre Léa depuis la fiche transaction

- **Backend** (`/api/v1/lea/chat/stream`) :
  - Si `transaction_id` + `session_id` : lie la session à cette transaction **avant** `run_lea_actions` pour que toutes les mises à jour ciblent la bonne transaction.
  - Appelle `run_lea_actions(db, user_id, message, last_assistant_message, session_id=sid)`.

## 2. Récupération des infos (run_lea_actions)

- **Transaction cible** : `transaction_preferred = get_transaction_for_session(session_id)` si `session_id`, sinon les fonctions utilisent ref / adresse / dernière transaction.
- **Ordre des mises à jour** (chacune utilise `transaction_preferred` en priorité) :
  1. **Création** : `maybe_create_transaction_from_lea` (message complet) ou création depuis le **brouillon** `pending_transaction_creation` (type + adresse + prix + vendeurs + acheteurs). Obligatoires : adresse, prix, vendeurs, acheteurs ; **date de clôture facultative**.
  2. **Adresse** : `maybe_update_transaction_address_from_lea` puis si besoin `_update_transaction_address_from_context` (réponse à « Quelle est l'adresse ? »).
  3. **Prix** : `maybe_update_transaction_price_from_lea`.
  4. **Vendeurs / acheteurs** : `maybe_add_seller_buyer_contact_from_lea` (extraction depuis le message + `last_assistant_message`, ex. « sarah lopez » après « Qui sont les vendeurs ? »).
  5. **Date de clôture** : `maybe_set_expected_closing_date_from_lea`.
- **Extraction des noms** : `_extract_seller_buyer_names_list(message, last_assistant_message)` avec repli pour réponses courtes type « Prénom Nom ». Nécessite que le front envoie bien `last_assistant_message`.
- **Persistance** : pour les champs JSON `sellers` / `buyers`, après mise à jour on appelle `flag_modified(transaction, "sellers")` / `flag_modified(transaction, "buyers")` puis `db.commit()`.

## 3. Enregistrement en base

- **Modèle** : `RealEstateTransaction` (colonnes utilisées pour l'affichage) :
  - `property_address`, `property_city`, `property_postal_code`
  - `listing_price`, `offered_price`
  - `sellers`, `buyers` (JSON : listes de `{ "name", "phone", "email" }`)
  - `expected_closing_date`
- **Contacts** : pour chaque vendeur/acheteur on crée aussi `RealEstateContact` + `TransactionContact` (rôle Vendeur/Acheteur) pour l'onglet Contacts.

## 4. Sortie API et affichage

- **GET /api/v1/transactions/:id** : renvoie la transaction avec `sellers` et `buyers`.
- **Frontend** : page détail avec « Vendeurs : » / « Acheteurs : » depuis `transaction.sellers` / `transaction.buyers`.

## 5. Points critiques

- **last_assistant_message** : doit être envoyé par le front (lu **avant** d'ajouter le message user) pour que les réponses courtes (« sarah lopez », « Eric smith ») soient reconnues.
- **Lien session ↔ transaction** : si l'utilisateur ouvre Léa depuis la fiche transaction, `transaction_id` est envoyé et la session est liée tout de suite pour que `transaction_preferred` soit défini.
- **Brouillon (pending)** : si pas de transaction existante, les infos sont stockées dans `LeaConversation.context["pending_transaction_creation"]` ; la transaction n'est créée qu'une fois type + adresse + prix + vendeurs + acheteurs réunis. **La date de clôture est facultative** (obligatoires : adresse, prix, vendeurs, acheteurs).
