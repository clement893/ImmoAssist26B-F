# Module Facturation - Template

Template complet pour un module de facturation.

## 📁 Structure

```
billing/
├── models/          # Modèles SQLAlchemy
│   ├── invoice.py
│   ├── payment.py
│   └── product.py
├── schemas/         # Schemas Pydantic
│   ├── invoice.py
│   ├── payment.py
│   └── product.py
├── api/            # Endpoints FastAPI
│   └── endpoints/
│       ├── invoices.py
│       ├── payments.py
│       └── products.py
└── services/       # Logique métier
    ├── invoice_service.py
    └── payment_service.py
```

## 🚀 Utilisation

1. Copier le template dans votre projet
2. Adapter les modèles selon vos besoins
3. Générer les types TypeScript : `npm run generate:types`
4. Créer les pages frontend correspondantes

## 📋 Fonctionnalités

- ✅ Gestion des factures
- ✅ Gestion des paiements
- ✅ Gestion des produits/services
- ✅ Génération de factures PDF
- ✅ Suivi des paiements
- ✅ Rapports financiers
