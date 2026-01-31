# Module CRM - Template

Template complet pour un module CRM (Customer Relationship Management).

## 📁 Structure

```
crm/
├── models/          # Modèles SQLAlchemy
│   ├── lead.py
│   ├── contact.py
│   └── deal.py
├── schemas/         # Schemas Pydantic
│   ├── lead.py
│   ├── contact.py
│   └── deal.py
├── api/            # Endpoints FastAPI
│   └── endpoints/
│       ├── leads.py
│       ├── contacts.py
│       └── deals.py
└── services/       # Logique métier
    ├── lead_service.py
    └── contact_service.py
```

## 🚀 Utilisation

1. Copier le template dans votre projet
2. Adapter les modèles selon vos besoins
3. Générer les types TypeScript : `npm run generate:types`
4. Créer les pages frontend correspondantes

## 📋 Fonctionnalités

- ✅ Gestion des leads (prospects)
- ✅ Gestion des contacts
- ✅ Gestion des deals (affaires)
- ✅ Pipeline de vente
- ✅ Historique des interactions
- ✅ Statistiques et rapports
