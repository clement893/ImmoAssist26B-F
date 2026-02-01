'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { Button } from '@/components/ui';
import { Code, Copy, Check, ExternalLink, FileText } from 'lucide-react';
import { useToast } from '@/components/ui';

export default function OACIQImportPage() {
  const { showToast } = useToast();
  const [copiedSections, setCopiedSections] = useState<Set<string>>(new Set());

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSections(new Set([...copiedSections, sectionId]));
    showToast({
      message: 'Code copié dans le presse-papier',
      type: 'success',
    });
    setTimeout(() => {
      setCopiedSections(new Set(copiedSections));
    }, 2000);
  };

  const exampleSingleForm = `{
  "code": "PA",
  "name": "Promesse d'achat",
  "name_en": "Promise to Purchase",
  "name_fr": "Promesse d'achat",
  "category": "obligatoire",
  "pdf_url": "https://www.oaciq.com/formulaires/PA.pdf",
  "web_url": "https://www.oaciq.com/formulaires/promesse-achat",
  "objective": "Document utilisé pour formaliser l'intention d'achat d'un bien immobilier. Permet de définir les conditions de la transaction avant la signature de l'acte de vente.",
  "fields": {
    "sections": [
      {
        "id": "identification",
        "title": "Identification",
        "order": 1,
        "fields": [
          {
            "id": "acheteur_nom",
            "label": "Nom de l'acheteur",
            "type": "text",
            "required": true,
            "placeholder": "Entrez le nom complet"
          },
          {
            "id": "vendeur_nom",
            "label": "Nom du vendeur",
            "type": "text",
            "required": true
          }
        ]
      }
    ]
  }
}`;

  const exampleBulkImport = `{
  "overwrite_existing": false,
  "forms": [
    {
      "code": "PA",
      "name": "Promesse d'achat",
      "name_en": "Promise to Purchase",
      "name_fr": "Promesse d'achat",
      "category": "obligatoire",
      "pdf_url": "https://www.oaciq.com/formulaires/PA.pdf",
      "web_url": "https://www.oaciq.com/formulaires/promesse-achat",
      "objective": "Document utilisé pour formaliser l'intention d'achat d'un bien immobilier."
    },
    {
      "code": "CCVE",
      "name": "Clause de cession de vente d'entreprise",
      "name_en": "Business Sale Assignment Clause",
      "name_fr": "Clause de cession de vente d'entreprise",
      "category": "recommandé",
      "pdf_url": "https://www.oaciq.com/formulaires/CCVE.pdf",
      "web_url": "https://www.oaciq.com/formulaires/clause-cession-vente-entreprise",
      "objective": "Clause permettant la cession d'une entreprise dans le cadre d'une transaction immobilière."
    },
    {
      "code": "CP",
      "name": "Contrat de courtage",
      "name_en": "Brokerage Contract",
      "name_fr": "Contrat de courtage",
      "category": "obligatoire",
      "pdf_url": "https://www.oaciq.com/formulaires/CP.pdf",
      "web_url": "https://www.oaciq.com/formulaires/contrat-courtage",
      "objective": "Contrat établissant les conditions de la relation entre le courtier et son client.",
      "fields": {
        "sections": [
          {
            "id": "parties",
            "title": "Parties",
            "order": 1,
            "fields": [
              {
                "id": "courtier_nom",
                "label": "Nom du courtier",
                "type": "text",
                "required": true
              },
              {
                "id": "client_nom",
                "label": "Nom du client",
                "type": "text",
                "required": true
              }
            ]
          }
        ]
      }
    }
  ]
}`;

  const curlExample = `curl -X POST "https://immoassist26b-f-production.up.railway.app/api/v1/oaciq/forms/import" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "overwrite_existing": false,
    "forms": [
      {
        "code": "PA",
        "name": "Promesse d'\''achat",
        "name_en": "Promise to Purchase",
        "name_fr": "Promesse d'\''achat",
        "category": "obligatoire",
        "pdf_url": "https://www.oaciq.com/formulaires/PA.pdf",
        "web_url": "https://www.oaciq.com/formulaires/promesse-achat",
        "objective": "Document utilisé pour formaliser l'\''intention d'\''achat d'\''un bien immobilier."
      }
    ]
  }'`;

  const pythonExample = `import requests

url = "https://immoassist26b-f-production.up.railway.app/api/v1/oaciq/forms/import"
headers = {
    "Authorization": "Bearer YOUR_API_TOKEN",
    "Content-Type": "application/json"
}

data = {
    "overwrite_existing": False,
    "forms": [
        {
            "code": "PA",
            "name": "Promesse d'achat",
            "name_en": "Promise to Purchase",
            "name_fr": "Promesse d'achat",
            "category": "obligatoire",
            "pdf_url": "https://www.oaciq.com/formulaires/PA.pdf",
            "web_url": "https://www.oaciq.com/formulaires/promesse-achat",
            "objective": "Document utilisé pour formaliser l'intention d'achat d'un bien immobilier."
        },
        {
            "code": "CCVE",
            "name": "Clause de cession de vente d'entreprise",
            "name_en": "Business Sale Assignment Clause",
            "name_fr": "Clause de cession de vente d'entreprise",
            "category": "recommandé",
            "pdf_url": "https://www.oaciq.com/formulaires/CCVE.pdf",
            "web_url": "https://www.oaciq.com/formulaires/clause-cession-vente-entreprise",
            "objective": "Clause permettant la cession d'une entreprise dans le cadre d'une transaction immobilière."
        }
    ]
}

response = requests.post(url, json=data, headers=headers)
print(response.json())`;

  const javascriptExample = `const axios = require('axios');

const url = 'https://immoassist26b-f-production.up.railway.app/api/v1/oaciq/forms/import';
const headers = {
  'Authorization': 'Bearer YOUR_API_TOKEN',
  'Content-Type': 'application/json'
};

const data = {
  overwrite_existing: false,
  forms: [
    {
      code: 'PA',
      name: 'Promesse d\'achat',
      name_en: 'Promise to Purchase',
      name_fr: 'Promesse d\'achat',
      category: 'obligatoire',
      pdf_url: 'https://www.oaciq.com/formulaires/PA.pdf',
      web_url: 'https://www.oaciq.com/formulaires/promesse-achat',
      objective: 'Document utilisé pour formaliser l\'intention d\'achat d\'un bien immobilier.'
    },
    {
      code: 'CCVE',
      name: 'Clause de cession de vente d\'entreprise',
      name_en: 'Business Sale Assignment Clause',
      name_fr: 'Clause de cession de vente d\'entreprise',
      category: 'recommandé',
      pdf_url: 'https://www.oaciq.com/formulaires/CCVE.pdf',
      web_url: 'https://www.oaciq.com/formulaires/clause-cession-vente-entreprise',
      objective: 'Clause permettant la cession d\'une entreprise dans le cadre d\'une transaction immobilière.'
    }
  ]
};

axios.post(url, data, { headers })
  .then(response => {
    console.log('Import réussi:', response.data);
  })
  .catch(error => {
    console.error('Erreur:', error.response.data);
  });`;

  const responseExample = `{
  "success": true,
  "total": 2,
  "created": 2,
  "updated": 0,
  "skipped": 0,
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
      "action": "created",
      "form_id": 124
    }
  ]
}`;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-[1200px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Guide d'importation des formulaires OACIQ par API
          </h1>
          <p className="text-lg text-gray-600">
            Documentation complète pour importer les formulaires OACIQ depuis Manus via l'API
          </p>
        </div>

        {/* Overview Card */}
        <Card variant="default" className="rounded-3xl p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Vue d'ensemble</h2>
                <p className="text-gray-600 mb-4">
                  L'endpoint d'import en masse permet d'importer jusqu'à 100 formulaires OACIQ en une seule requête.
                  Chaque formulaire peut inclure son PDF officiel, sa structure de champs, et sa catégorie.
                </p>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-sm font-medium text-blue-900 mb-1">Endpoint API</p>
                  <code className="text-sm text-blue-700">
                    POST /api/v1/oaciq/forms/import
                  </code>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Authentication */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentification</h2>
          <p className="text-gray-600 mb-4">
            Toutes les requêtes doivent inclure un token d'authentification dans le header :
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
            <code className="text-sm text-gray-800">
              Authorization: Bearer YOUR_API_TOKEN
            </code>
          </div>
        </Card>

        {/* Structure des données */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Structure des données</h2>
          
          <div className="space-y-6">
            {/* Form Item Structure */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Structure d'un formulaire</h3>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <div className="space-y-2 text-sm">
                  <div><code className="text-blue-600">code</code> <span className="text-gray-600">(string, requis)</span> - Code unique du formulaire (ex: "PA", "CCVE")</div>
                  <div><code className="text-blue-600">name</code> <span className="text-gray-600">(string, requis)</span> - Nom du formulaire (FR par défaut)</div>
                  <div><code className="text-blue-600">name_en</code> <span className="text-gray-600">(string, optionnel)</span> - Nom du formulaire en anglais</div>
                  <div><code className="text-blue-600">name_fr</code> <span className="text-gray-600">(string, optionnel)</span> - Nom du formulaire en français</div>
                  <div><code className="text-blue-600">category</code> <span className="text-gray-600">(enum, requis)</span> - Catégorie : "obligatoire", "recommandé", ou "curateur_public"</div>
                  <div><code className="text-blue-600">pdf_url</code> <span className="text-gray-600">(string, optionnel)</span> - URL du PDF officiel OACIQ</div>
                  <div><code className="text-blue-600">web_url</code> <span className="text-gray-600">(string, optionnel)</span> - Lien web vers la page du formulaire sur le site OACIQ</div>
                  <div><code className="text-blue-600">objective</code> <span className="text-gray-600">(string, optionnel)</span> - Objectif du formulaire (description de son usage)</div>
                  <div><code className="text-blue-600">fields</code> <span className="text-gray-600">(object, optionnel)</span> - Structure des champs du formulaire</div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Catégories disponibles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
                  <div className="font-medium text-red-900 mb-1">obligatoire</div>
                  <div className="text-sm text-red-700">Formulaires obligatoires</div>
                </div>
                <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                  <div className="font-medium text-yellow-900 mb-1">recommandé</div>
                  <div className="text-sm text-yellow-700">Formulaires recommandés</div>
                </div>
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                  <div className="font-medium text-purple-900 mb-1">curateur_public</div>
                  <div className="text-sm text-purple-700">Formulaires curateur public</div>
                </div>
              </div>
            </div>

            {/* Fields Structure */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Structure des champs (fields)</h3>
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-3">
                  Le champ <code className="text-blue-600">fields</code> est optionnel mais recommandé pour définir la structure du formulaire.
                </p>
                <div className="space-y-2 text-sm">
                  <div><code className="text-blue-600">sections</code> <span className="text-gray-600">(array)</span> - Liste des sections du formulaire</div>
                  <div className="ml-4 space-y-1">
                    <div>• <code className="text-blue-600">id</code> - Identifiant unique de la section</div>
                    <div>• <code className="text-blue-600">title</code> - Titre de la section</div>
                    <div>• <code className="text-blue-600">order</code> - Ordre d'affichage</div>
                    <div>• <code className="text-blue-600">fields</code> - Liste des champs dans la section</div>
                  </div>
                  <div className="ml-8 space-y-1 mt-2">
                    <div>• <code className="text-blue-600">id</code> - Identifiant unique du champ</div>
                    <div>• <code className="text-blue-600">label</code> - Libellé du champ</div>
                    <div>• <code className="text-blue-600">type</code> - Type : text, textarea, email, number, date, select, etc.</div>
                    <div>• <code className="text-blue-600">required</code> - Champ obligatoire (true/false)</div>
                    <div>• <code className="text-blue-600">placeholder</code> - Texte d'aide (optionnel)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Exemple simple */}
        <Card variant="default" className="rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Exemple : Formulaire simple</h2>
            <Button
              variant="white"
              size="sm"
              onClick={() => copyToClipboard(exampleSingleForm, 'single')}
              className="flex items-center gap-2"
            >
              {copiedSections.has('single') ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{exampleSingleForm}</code>
            </pre>
          </div>
        </Card>

        {/* Exemple import en masse */}
        <Card variant="default" className="rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Exemple : Import en masse</h2>
            <Button
              variant="white"
              size="sm"
              onClick={() => copyToClipboard(exampleBulkImport, 'bulk')}
              className="flex items-center gap-2"
            >
              {copiedSections.has('bulk') ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{exampleBulkImport}</code>
            </pre>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Note :</strong> Le paramètre <code className="text-yellow-900">overwrite_existing</code> contrôle le comportement pour les formulaires existants.
              Si <code className="text-yellow-900">false</code>, les formulaires existants sont ignorés. Si <code className="text-yellow-900">true</code>, ils sont mis à jour.
            </p>
          </div>
        </Card>

        {/* Exemples de code */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Exemples de code</h2>
          
          <div className="space-y-6">
            {/* cURL */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">cURL</h3>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => copyToClipboard(curlExample, 'curl')}
                  className="flex items-center gap-2"
                >
                  {copiedSections.has('curl') ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{curlExample}</code>
                </pre>
              </div>
            </div>

            {/* Python */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">Python</h3>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => copyToClipboard(pythonExample, 'python')}
                  className="flex items-center gap-2"
                >
                  {copiedSections.has('python') ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{pythonExample}</code>
                </pre>
              </div>
            </div>

            {/* JavaScript */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-900">JavaScript/Node.js</h3>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => copyToClipboard(javascriptExample, 'javascript')}
                  className="flex items-center gap-2"
                >
                  {copiedSections.has('javascript') ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>
              <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{javascriptExample}</code>
                </pre>
              </div>
            </div>
          </div>
        </Card>

        {/* Réponse API */}
        <Card variant="default" className="rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Réponse de l'API</h2>
            <Button
              variant="white"
              size="sm"
              onClick={() => copyToClipboard(responseExample, 'response')}
              className="flex items-center gap-2"
            >
              {copiedSections.has('response') ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </Button>
          </div>
          <div className="bg-gray-900 rounded-2xl p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{responseExample}</code>
            </pre>
          </div>
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <div><strong>success</strong> : true si tous les formulaires ont été importés avec succès</div>
            <div><strong>total</strong> : Nombre total de formulaires dans la requête</div>
            <div><strong>created</strong> : Nombre de formulaires créés</div>
            <div><strong>updated</strong> : Nombre de formulaires mis à jour</div>
            <div><strong>skipped</strong> : Nombre de formulaires ignorés (déjà existants)</div>
            <div><strong>failed</strong> : Nombre de formulaires ayant échoué</div>
            <div><strong>results</strong> : Détails pour chaque formulaire avec action effectuée</div>
          </div>
        </Card>

        {/* Bonnes pratiques */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bonnes pratiques</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">URLs PDF</div>
                <div className="text-sm text-gray-600">
                  Utilisez des URLs HTTPS valides pointant vers les PDFs officiels OACIQ. Les URLs doivent être accessibles publiquement.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Codes uniques</div>
                <div className="text-sm text-gray-600">
                  Chaque formulaire doit avoir un code unique (ex: "PA", "CCVE"). Les codes existants seront mis à jour ou ignorés selon le paramètre <code className="text-blue-600">overwrite_existing</code>.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Import en masse</div>
                <div className="text-sm text-gray-600">
                  Vous pouvez importer jusqu'à 100 formulaires par requête. Pour des imports plus volumineux, divisez en plusieurs requêtes.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Champs optionnels</div>
                <div className="text-sm text-gray-600">
                  Le champ <code className="text-blue-600">fields</code> est optionnel. Vous pouvez l'ajouter plus tard ou utiliser l'endpoint <code className="text-blue-600">/extract-fields</code> pour extraire automatiquement les champs d'un PDF.
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Champs multilingues et objectif */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Champs multilingues et objectif</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Noms multilingues</h3>
              <p className="text-gray-600 mb-3">
                Pour supporter plusieurs langues, utilisez les champs <code className="text-blue-600">name_en</code> et <code className="text-blue-600">name_fr</code>.
                Le champ <code className="text-blue-600">name</code> reste requis et servira de valeur par défaut.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lien web</h3>
              <p className="text-gray-600 mb-3">
                Le champ <code className="text-blue-600">web_url</code> permet de référencer la page du formulaire sur le site officiel OACIQ.
                Ce lien peut être utilisé pour rediriger les utilisateurs vers plus d'informations.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Objectif du formulaire</h3>
              <p className="text-gray-600 mb-3">
                Le champ <code className="text-blue-600">objective</code> permet de décrire l'usage et le but du formulaire.
                Cette information aide les utilisateurs à comprendre quand et comment utiliser chaque formulaire.
              </p>
            </div>
          </div>
        </Card>

        {/* Liens utiles */}
        <Card variant="default" className="rounded-3xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Liens utiles</h2>
          <div className="space-y-3">
            <a
              href="https://www.oaciq.com/formulaires"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Site officiel OACIQ</div>
                <div className="text-sm text-gray-500">https://www.oaciq.com/formulaires</div>
              </div>
            </a>
            <a
              href="/api/v1/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
            >
              <Code className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">Documentation API complète</div>
                <div className="text-sm text-gray-500">/api/v1/docs</div>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
