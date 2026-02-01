# ImmoAssist Importer – Extension Chrome

Extension Chrome pour importer des propriétés depuis Centris vers ImmoAssist en un clic.

## Installation (mode développeur)

1. Télécharger ou cloner le dépôt et aller dans le dossier `chrome-extension`.
2. **Icônes** : ajouter dans `icons/` les fichiers :
   - `icon16.png` (16×16)
   - `icon48.png` (48×48)
   - `icon128.png` (128×128)  
   Sans ces fichiers, Chrome utilisera une icône par défaut.
3. Ouvrir Chrome → `chrome://extensions` → activer **Mode développeur**.
4. Cliquer sur **Charger l’extension non empaquetée** et sélectionner le dossier `chrome-extension`.

## Configuration

1. Dans ImmoAssist : **Dashboard → Admin → Extension Chrome** (ou `/dashboard/admin/chrome-extension`).
2. Générer une **clé API** et la copier.
3. Sur une page Centris (fiche propriété), cliquer sur l’icône de l’extension.
4. Dans la popup : coller la clé API → **Enregistrer**.
5. Les données de la page sont extraites ; vous pouvez lier à une transaction (ID) puis cliquer sur **Importer dans ImmoAssist**.

## Utilisation

- Ouvrir une fiche propriété sur [Centris](https://www.centris.ca).
- Cliquer sur l’icône ImmoAssist dans la barre d’outils.
- Vérifier les données extraites, optionnellement saisir l’ID de transaction.
- Cliquer sur **Importer dans ImmoAssist**.

L’API backend doit exposer `POST /api/v1/property-listings/import` avec en-tête `X-API-Key`. L’URL de l’API est définie dans `popup/popup.js` (par défaut : production ImmoAssist).
