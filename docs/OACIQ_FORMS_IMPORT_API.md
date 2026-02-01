# Instructions d'import des formulaires OACIQ par API

## Vue d'ensemble

Ce document décrit comment importer des formulaires OACIQ depuis Manus vers ImmoAssist via l'API REST.

## Endpoint d'import

**URL:** `POST /api/v1/oaciq/forms/import`

**Authentification:** Requise (JWT Token ou API Key)

**Content-Type:** `application/json`

## Structure de la requête

### Headers requis

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### Body de la requête

```json
{
  "forms": [
    {
      "code": "PA",
      "name": "Promesse d'achat",
      "category": "obligatoire",
      "pdf_url": "https://example.com/forms/PA.pdf",
      "fields": {
        "sections": [
          {
            "id": "section_1",
            "title": "Informations générales",
            "order": 1,
            "fields": [
              {
                "id": "acheteur_nom",
                "label": "Nom de l'acheteur",
                "type": "text",
                "required": true,
                "placeholder": "Entrez le nom complet"
              }
            ]
          }
        ]
      }
    }
  ],
  "overwrite_existing": false
}
```

### Paramètres

| Paramètre | Type | Requis | Description |
|-----------|------|--------|-------------|
| `forms` | Array | Oui | Liste des formulaires à importer (max 100) |
| `overwrite_existing` | Boolean | Non | Si `true`, met à jour les formulaires existants. Si `false`, ignore les doublons (défaut: `false`) |

### Structure d'un formulaire (`OACIQFormImportItem`)

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| `code` | String | Oui | Code unique du formulaire OACIQ (ex: "PA", "CCVE") - max 20 caractères |
| `name` | String | Oui | Nom du formulaire - max 200 caractères |
| `category` | Enum | Oui | Catégorie: `"obligatoire"`, `"recommandé"`, ou `"curateur_public"` |
| `pdf_url` | String | Non | URL du PDF officiel OACIQ |
| `fields` | Object | Non | Structure des champs du formulaire (voir ci-dessous) |

### Structure des champs (`fields`)

```json
{
  "sections": [
    {
      "id": "section_1",
      "title": "Titre de la section",
      "order": 1,
      "fields": [
        {
          "id": "field_id",
          "label": "Label du champ",
          "type": "text|textarea|email|number|date|select|radio|checkbox|file",
          "required": true,
          "placeholder": "...",
          "help_text": "...",
          "validation": {},
          "options": [] // Pour select/radio
        }
      ]
    }
  ]
}
```

## Réponse

### Succès (200 OK)

```json
{
  "success": true,
  "total": 49,
  "created": 45,
  "updated": 2,
  "skipped": 2,
  "failed": 0,
  "results": [
    {
      "code": "PA",
      "success": true,
      "action": "created",
      "form_id": 123
    },
    {
      "code": "CCVE",
      "success": true,
      "action": "updated",
      "form_id": 124
    },
    {
      "code": "EXISTING",
      "success": true,
      "action": "skipped",
      "form_id": 125
    },
    {
      "code": "INVALID",
      "success": false,
      "action": "failed",
      "error": "Code already exists"
    }
  ]
}
```

### Erreurs possibles

#### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

#### 400 Bad Request
```json
{
  "detail": "Validation error: forms must contain at least 1 item"
}
```

#### 422 Unprocessable Entity
```json
{
  "detail": [
    {
      "loc": ["body", "forms", 0, "code"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## Exemples d'utilisation

### Exemple 1: Import simple avec cURL

```bash
curl -X POST "https://miraculous-caring-production-6f8e.up.railway.app/api/v1/oaciq/forms/import" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "forms": [
      {
        "code": "PA",
        "name": "Promesse d'achat",
        "category": "obligatoire",
        "pdf_url": "https://oaciq.com/forms/PA.pdf"
      }
    ],
    "overwrite_existing": false
  }'
```

### Exemple 2: Import en masse avec Python

```python
import requests
import json

API_BASE_URL = "https://miraculous-caring-production-6f8e.up.railway.app/api/v1"
JWT_TOKEN = "your_jwt_token_here"

# Préparer les données d'import
forms_data = {
    "forms": [
        {
            "code": "PA",
            "name": "Promesse d'achat",
            "category": "obligatoire",
            "pdf_url": "https://oaciq.com/forms/PA.pdf",
            "fields": {
                "sections": [
                    {
                        "id": "section_1",
                        "title": "Informations générales",
                        "order": 1,
                        "fields": [
                            {
                                "id": "acheteur_nom",
                                "label": "Nom de l'acheteur",
                                "type": "text",
                                "required": True
                            }
                        ]
                    }
                ]
            }
        },
        {
            "code": "CCVE",
            "name": "Contrat de courtage - Vente exclusive",
            "category": "obligatoire",
            "pdf_url": "https://oaciq.com/forms/CCVE.pdf"
        }
    ],
    "overwrite_existing": True
}

# Effectuer la requête
response = requests.post(
    f"{API_BASE_URL}/oaciq/forms/import",
    headers={
        "Authorization": f"Bearer {JWT_TOKEN}",
        "Content-Type": "application/json"
    },
    json=forms_data
)

# Vérifier la réponse
if response.status_code == 200:
    result = response.json()
    print(f"Import réussi:")
    print(f"  - Total: {result['total']}")
    print(f"  - Créés: {result['created']}")
    print(f"  - Mis à jour: {result['updated']}")
    print(f"  - Ignorés: {result['skipped']}")
    print(f"  - Échoués: {result['failed']}")
    
    # Afficher les détails
    for item in result['results']:
        print(f"  - {item['code']}: {item['action']}")
else:
    print(f"Erreur: {response.status_code}")
    print(response.json())
```

### Exemple 3: Import depuis un fichier JSON (Node.js)

```javascript
const axios = require('axios');
const fs = require('fs');

const API_BASE_URL = 'https://miraculous-caring-production-6f8e.up.railway.app/api/v1';
const JWT_TOKEN = 'your_jwt_token_here';

// Lire le fichier JSON contenant les formulaires
const formsData = JSON.parse(fs.readFileSync('oaciq_forms.json', 'utf8'));

// Effectuer l'import
axios.post(`${API_BASE_URL}/oaciq/forms/import`, formsData, {
  headers: {
    'Authorization': `Bearer ${JWT_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  const result = response.data;
  console.log('Import réussi:');
  console.log(`  - Total: ${result.total}`);
  console.log(`  - Créés: ${result.created}`);
  console.log(`  - Mis à jour: ${result.updated}`);
  console.log(`  - Ignorés: ${result.skipped}`);
  console.log(`  - Échoués: ${result.failed}`);
  
  // Afficher les détails
  result.results.forEach(item => {
    console.log(`  - ${item.code}: ${item.action}`);
  });
})
.catch(error => {
  console.error('Erreur:', error.response?.data || error.message);
});
```

### Exemple 4: Import avec gestion des erreurs (Python)

```python
import requests
from typing import List, Dict

def import_oaciq_forms(
    api_url: str,
    jwt_token: str,
    forms: List[Dict],
    overwrite_existing: bool = False
) -> Dict:
    """
    Importe des formulaires OACIQ via l'API
    
    Args:
        api_url: URL de base de l'API
        jwt_token: Token JWT pour l'authentification
        forms: Liste des formulaires à importer
        overwrite_existing: Si True, met à jour les formulaires existants
    
    Returns:
        Résultat de l'import
    """
    url = f"{api_url}/oaciq/forms/import"
    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Content-Type": "application/json"
    }
    data = {
        "forms": forms,
        "overwrite_existing": overwrite_existing
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"Erreur HTTP: {e}")
        if e.response is not None:
            print(f"Détails: {e.response.json()}")
        raise
    except requests.exceptions.RequestException as e:
        print(f"Erreur de requête: {e}")
        raise

# Utilisation
forms_to_import = [
    {
        "code": "PA",
        "name": "Promesse d'achat",
        "category": "obligatoire",
        "pdf_url": "https://oaciq.com/forms/PA.pdf"
    },
    # ... autres formulaires
]

result = import_oaciq_forms(
    api_url="https://miraculous-caring-production-6f8e.up.railway.app/api/v1",
    jwt_token="your_jwt_token",
    forms=forms_to_import,
    overwrite_existing=True
)

print(f"Import terminé: {result['created']} créés, {result['updated']} mis à jour")
```

## Catégories de formulaires

Les catégories suivantes sont supportées:

- `"obligatoire"` - Formulaires obligatoires (28 formulaires)
- `"recommandé"` - Formulaires recommandés (15 formulaires)
- `"curateur_public"` - Formulaires pour curateur public (6 formulaires)

## Comportement de l'import

### Avec `overwrite_existing: false` (défaut)

- Les formulaires existants sont **ignorés** (action: `skipped`)
- Seuls les nouveaux formulaires sont créés
- Utile pour les imports initiaux sans écraser les données existantes

### Avec `overwrite_existing: true`

- Les formulaires existants sont **mis à jour** avec les nouvelles données (action: `updated`)
- Les nouveaux formulaires sont créés (action: `created`)
- Utile pour synchroniser les données depuis Manus

## Limites

- Maximum **100 formulaires** par requête
- Les formulaires doivent avoir un `code` unique
- Les `code` doivent respecter la contrainte de longueur (max 20 caractères)

## Notes importantes

1. **Authentification**: Toutes les requêtes nécessitent une authentification valide (JWT Token ou API Key)

2. **Formulaires globaux**: Les formulaires OACIQ sont globaux et ne sont pas filtrés par tenant/équipe

3. **Champs optionnels**: Le champ `fields` est optionnel. Si non fourni, un formulaire vide sera créé avec `sections: []`

4. **Gestion des erreurs**: En cas d'erreur sur un formulaire, l'import continue pour les autres formulaires. Vérifiez le champ `failed` dans la réponse

5. **Idempotence**: L'endpoint est idempotent. Vous pouvez relancer l'import plusieurs fois sans créer de doublons (sauf si `overwrite_existing: true`)

## Support

Pour toute question ou problème, contactez l'équipe de développement.
