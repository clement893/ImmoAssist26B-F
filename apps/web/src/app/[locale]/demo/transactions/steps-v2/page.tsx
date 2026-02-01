'use client';

import { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  FileText,
  Calendar,
  DollarSign,
  Home,
  Users,
  MessageSquare,
  Sparkles,
  Bell,
  ArrowRight,
  Info
} from 'lucide-react';

// Types
interface Action {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  dueDate?: string;
  documents?: string[];
  leaGuidance?: string;
}

interface Step {
  id: string;
  code: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'overdue';
  dueDate?: string;
  completedDate?: string;
  actions: Action[];
  reminders: Reminder[];
}

interface Reminder {
  id: string;
  type: 'deadline' | 'action' | 'document';
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

interface Transaction {
  id: string;
  name: string;
  address: string;
  price: number;
  buyer: string;
  seller: string;
  status: string;
  currentStep: string;
  progress: number;
}

export default function TransactionStepsV2Page() {
  const [selectedView, setSelectedView] = useState<'acheteur' | 'vendeur'>('acheteur');
  const [showLeaPanel, setShowLeaPanel] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  // Données de démo
  const transaction: Transaction = {
    id: '1',
    name: 'Achat - 123 Rue Principale',
    address: '123 Rue Principale, Montréal, QC H1A 1A1',
    price: 450000,
    buyer: 'Sophie Martin',
    seller: 'Jean Tremblay',
    status: 'Offre acceptée',
    currentStep: 'accept_offer',
    progress: 35
  };

  // Étapes pour l'acheteur
  const buyerSteps: Step[] = [
    {
      id: '1',
      code: 'preparation',
      title: 'Préparation et recherche',
      description: 'Définir vos besoins, obtenir une préapprobation hypothécaire et choisir un courtier',
      status: 'completed',
      completedDate: '2024-01-15',
      actions: [
        {
          id: 'a1',
          title: 'Définir budget et besoins',
          description: 'Établir les critères de recherche et évaluer la capacité financière',
          required: true,
          completed: true,
          leaGuidance: 'Je peux vous aider à calculer votre budget maximal en tenant compte de vos revenus, dettes et mise de fonds disponible.'
        },
        {
          id: 'a2',
          title: 'Obtenir préapprobation hypothécaire',
          description: 'Démarcher une institution financière pour connaître sa capacité d\'emprunt',
          required: true,
          completed: true,
          documents: ['Preuve de revenus', 'Relevés bancaires'],
          leaGuidance: 'Une préapprobation hypothécaire renforce votre position lors des négociations. Je peux vous guider sur les documents à préparer.'
        },
        {
          id: 'a3',
          title: 'Signer contrat de courtage',
          description: 'Choisir un courtier immobilier et signer le contrat de courtage exclusif',
          required: true,
          completed: true,
          documents: ['Contrat de courtage – Achat'],
          leaGuidance: 'Le contrat de courtage vous protège et définit clairement les services que votre courtier vous fournira.'
        }
      ],
      reminders: []
    },
    {
      id: '2',
      code: 'submit_offer',
      title: 'Promesse d\'achat',
      description: 'Rédiger et soumettre une offre formelle sur la propriété',
      status: 'completed',
      completedDate: '2024-01-22',
      actions: [
        {
          id: 'a4',
          title: 'Rédiger la promesse d\'achat',
          description: 'Le courtier rédige l\'offre sur le formulaire obligatoire OACIQ',
          required: true,
          completed: true,
          documents: ['Formulaire Promesse d\'achat'],
          leaGuidance: 'La promesse d\'achat doit inclure le prix offert, les conditions suspensives (inspection, financement) et les délais.'
        },
        {
          id: 'a5',
          title: 'Négocier les termes',
          description: 'Le vendeur peut accepter, refuser ou faire une contre-proposition',
          required: true,
          completed: true,
          leaGuidance: 'Les négociations peuvent impliquer plusieurs contre-propositions. Je peux vous conseiller sur les stratégies de négociation.'
        }
      ],
      reminders: []
    },
    {
      id: '3',
      code: 'accept_offer',
      title: 'Offre acceptée',
      description: 'L\'offre est acceptée, réaliser les conditions suspensives',
      status: 'current',
      dueDate: '2024-02-05',
      actions: [
        {
          id: 'a6',
          title: 'Planifier l\'inspection préachat',
          description: 'Engager un inspecteur en bâtiment certifié',
          required: true,
          completed: false,
          dueDate: '2024-02-05',
          documents: ['Rapport d\'inspection'],
          leaGuidance: 'L\'inspection doit être faite dans les 10 jours. Je peux vous recommander des inspecteurs certifiés dans votre région.'
        },
        {
          id: 'a7',
          title: 'Finaliser le financement',
          description: 'Fournir tous les documents à la banque pour l\'approbation finale',
          required: true,
          completed: false,
          dueDate: '2024-02-15',
          documents: ['Promesse d\'achat acceptée', 'Rapport d\'inspection'],
          leaGuidance: 'Assurez-vous d\'avoir tous les documents requis : preuve d\'emploi récente, relevés bancaires, déclarations de revenus.'
        },
        {
          id: 'a8',
          title: 'Souscrire assurance habitation',
          description: 'Obtenir une preuve d\'assurance habitation',
          required: true,
          completed: false,
          dueDate: '2024-02-20',
          documents: ['Preuve d\'assurance'],
          leaGuidance: 'L\'assurance habitation est obligatoire pour obtenir le prêt hypothécaire. Comparez plusieurs assureurs pour le meilleur prix.'
        }
      ],
      reminders: [
        {
          id: 'r1',
          type: 'deadline',
          title: 'Date limite inspection',
          dueDate: '2024-02-05',
          priority: 'high'
        },
        {
          id: 'r2',
          type: 'deadline',
          title: 'Date limite financement',
          dueDate: '2024-02-15',
          priority: 'high'
        }
      ]
    },
    {
      id: '4',
      code: 'complete_inspection',
      title: 'Inspection complétée',
      description: 'Inspection effectuée et rapport reçu',
      status: 'upcoming',
      actions: [
        {
          id: 'a9',
          title: 'Analyser le rapport d\'inspection',
          description: 'Examiner les problèmes identifiés avec votre courtier',
          required: true,
          completed: false,
          leaGuidance: 'Je peux vous aider à comprendre les enjeux du rapport et à évaluer si des négociations sont nécessaires.'
        },
        {
          id: 'a10',
          title: 'Négocier réparations ou ajustement de prix',
          description: 'Si des problèmes majeurs sont découverts',
          required: false,
          completed: false,
          leaGuidance: 'Selon la gravité des problèmes, vous pouvez demander une réduction de prix, des réparations ou vous retirer de la transaction.'
        }
      ],
      reminders: []
    },
    {
      id: '5',
      code: 'approve_financing',
      title: 'Financement approuvé',
      description: 'Approbation hypothécaire confirmée par la banque',
      status: 'upcoming',
      actions: [
        {
          id: 'a11',
          title: 'Recevoir lettre d\'engagement',
          description: 'Obtenir la confirmation écrite de la banque',
          required: true,
          completed: false,
          documents: ['Lettre d\'engagement hypothécaire'],
          leaGuidance: 'La lettre d\'engagement confirme que la banque s\'engage à vous prêter le montant nécessaire.'
        },
        {
          id: 'a12',
          title: 'Choisir un notaire',
          description: 'Sélectionner le notaire qui rédigera l\'acte de vente',
          required: true,
          completed: false,
          leaGuidance: 'Le notaire est choisi par l\'acheteur. Je peux vous expliquer son rôle et vous suggérer des questions à lui poser.'
        }
      ],
      reminders: []
    },
    {
      id: '6',
      code: 'complete_signing',
      title: 'Signature chez le notaire',
      description: 'Signature de l\'acte de vente officialisant le transfert',
      status: 'upcoming',
      actions: [
        {
          id: 'a13',
          title: 'Préparer les fonds requis',
          description: 'Chèque certifié ou virement pour la mise de fonds et les frais',
          required: true,
          completed: false,
          leaGuidance: 'Vous devrez payer la mise de fonds, les droits de mutation, les honoraires du notaire et autres frais de clôture.'
        },
        {
          id: 'a14',
          title: 'Signer l\'acte de vente',
          description: 'Signature officielle chez le notaire',
          required: true,
          completed: false,
          documents: ['Acte de vente', 'Acte de prêt hypothécaire'],
          leaGuidance: 'Le notaire vous expliquera tous les documents avant la signature. N\'hésitez pas à poser des questions.'
        }
      ],
      reminders: []
    },
    {
      id: '7',
      code: 'transfer_keys',
      title: 'Prise de possession',
      description: 'Remise des clés et prise de possession de la propriété',
      status: 'upcoming',
      actions: [
        {
          id: 'a15',
          title: 'Récupérer les clés',
          description: 'Obtenir toutes les clés et codes d\'accès',
          required: true,
          completed: false,
          leaGuidance: 'Faites une inspection finale de la propriété avant de prendre possession pour vous assurer que tout est conforme.'
        },
        {
          id: 'a16',
          title: 'Effectuer l\'inspection finale',
          description: 'Vérifier que la propriété est dans l\'état convenu',
          required: true,
          completed: false,
          leaGuidance: 'Vérifiez que les inclusions sont présentes et que les réparations convenues ont été effectuées.'
        }
      ],
      reminders: []
    }
  ];

  // Étapes pour le vendeur
  const vendorSteps: Step[] = [
    {
      id: '1',
      code: 'preparation',
      title: 'Préparation et mise en marché',
      description: 'Choisir un courtier, établir le prix et préparer la propriété',
      status: 'completed',
      completedDate: '2024-01-10',
      actions: [
        {
          id: 'v1',
          title: 'Signer contrat de courtage',
          description: 'Choisir un courtier et signer le contrat de courtage exclusif – Vente',
          required: true,
          completed: true,
          documents: ['Contrat de courtage – Vente'],
          leaGuidance: 'Le contrat établit le prix de vente, la commission du courtier et les activités promotionnelles.'
        },
        {
          id: 'v2',
          title: 'Remplir déclarations du vendeur',
          description: 'Fournir toutes les informations connues sur l\'état de la propriété',
          required: true,
          completed: true,
          documents: ['Formulaire Déclarations du vendeur sur l\'immeuble'],
          leaGuidance: 'Ce formulaire vous protège contre les poursuites futures. Soyez transparent sur tous les aspects de la propriété.'
        },
        {
          id: 'v3',
          title: 'Préparer la propriété',
          description: 'Home staging, réparations mineures, photos professionnelles',
          required: false,
          completed: true,
          leaGuidance: 'Une propriété bien présentée se vend plus rapidement et à meilleur prix. Je peux vous donner des conseils de mise en valeur.'
        }
      ],
      reminders: []
    },
    {
      id: '2',
      code: 'publish_listing',
      title: 'Propriété listée',
      description: 'La propriété est publiée et visible sur les plateformes',
      status: 'completed',
      completedDate: '2024-01-15',
      actions: [
        {
          id: 'v4',
          title: 'Organiser les visites',
          description: 'Coordonner les visites avec le courtier',
          required: true,
          completed: true,
          leaGuidance: 'Gardez la propriété propre et accueillante. Abstenez-vous d\'être présent lors des visites pour laisser les acheteurs à l\'aise.'
        },
        {
          id: 'v5',
          title: 'Obtenir certificat de localisation',
          description: 'Commander un certificat de localisation à jour',
          required: true,
          completed: true,
          documents: ['Certificat de localisation'],
          leaGuidance: 'Le certificat doit avoir moins de 10 ans et être conforme. Commandez-le dès maintenant pour éviter les délais.'
        }
      ],
      reminders: []
    },
    {
      id: '3',
      code: 'receive_offer',
      title: 'Réception d\'offre',
      description: 'Une ou plusieurs promesses d\'achat sont reçues',
      status: 'completed',
      completedDate: '2024-01-20',
      actions: [
        {
          id: 'v6',
          title: 'Analyser les offres',
          description: 'Examiner toutes les offres avec votre courtier',
          required: true,
          completed: true,
          leaGuidance: 'Ne considérez pas seulement le prix. Évaluez aussi les conditions, les délais et la solidité financière des acheteurs.'
        },
        {
          id: 'v7',
          title: 'Accepter ou contre-proposer',
          description: 'Décider d\'accepter, refuser ou faire une contre-proposition',
          required: true,
          completed: true,
          documents: ['Formulaire Contre-proposition'],
          leaGuidance: 'Une contre-proposition annule l\'offre initiale. Assurez-vous d\'être à l\'aise avec vos modifications.'
        }
      ],
      reminders: []
    },
    {
      id: '4',
      code: 'accept_offer',
      title: 'Offre acceptée',
      description: 'L\'offre est acceptée, l\'acheteur doit réaliser ses conditions',
      status: 'current',
      dueDate: '2024-02-15',
      actions: [
        {
          id: 'v8',
          title: 'Permettre l\'inspection',
          description: 'Donner accès à la propriété pour l\'inspection préachat',
          required: true,
          completed: false,
          dueDate: '2024-02-05',
          leaGuidance: 'L\'acheteur a généralement 10 jours pour faire inspecter. Assurez-vous que la propriété soit accessible.'
        },
        {
          id: 'v9',
          title: 'Préparer documents pour notaire',
          description: 'Rassembler tous les documents requis',
          required: true,
          completed: false,
          documents: ['Certificat de localisation', 'Comptes de taxes', 'Quittance hypothécaire'],
          leaGuidance: 'Le notaire aura besoin de plusieurs documents. Commencez à les rassembler maintenant pour éviter les retards.'
        },
        {
          id: 'v10',
          title: 'Obtenir quittance hypothécaire',
          description: 'Demander la quittance à votre institution financière',
          required: true,
          completed: false,
          dueDate: '2024-02-10',
          leaGuidance: 'La quittance peut prendre 2-3 semaines. Contactez votre banque dès maintenant.'
        }
      ],
      reminders: [
        {
          id: 'r3',
          type: 'action',
          title: 'Permettre inspection',
          dueDate: '2024-02-05',
          priority: 'high'
        },
        {
          id: 'r4',
          type: 'document',
          title: 'Obtenir quittance',
          dueDate: '2024-02-10',
          priority: 'medium'
        }
      ]
    },
    {
      id: '5',
      code: 'complete_signing',
      title: 'Signature chez le notaire',
      description: 'Signature de l\'acte de vente et transfert de propriété',
      status: 'upcoming',
      actions: [
        {
          id: 'v11',
          title: 'Signer l\'acte de vente',
          description: 'Signature officielle chez le notaire',
          required: true,
          completed: false,
          documents: ['Acte de vente'],
          leaGuidance: 'Le notaire vous remettra le produit de la vente après avoir remboursé votre hypothèque et payé tous les frais.'
        },
        {
          id: 'v12',
          title: 'Recevoir le produit de la vente',
          description: 'Le notaire distribue les fonds',
          required: true,
          completed: false,
          leaGuidance: 'Vous recevrez le prix de vente moins l\'hypothèque, la commission du courtier et les frais de clôture.'
        }
      ],
      reminders: []
    },
    {
      id: '6',
      code: 'transfer_keys',
      title: 'Remise des clés',
      description: 'Libérer la propriété et remettre les clés',
      status: 'upcoming',
      actions: [
        {
          id: 'v13',
          title: 'Vider la propriété',
          description: 'Retirer tous vos biens et nettoyer',
          required: true,
          completed: false,
          leaGuidance: 'Assurez-vous de laisser les inclusions convenues et de retirer toutes les exclusions.'
        },
        {
          id: 'v14',
          title: 'Remettre toutes les clés',
          description: 'Fournir toutes les clés, codes et télécommandes',
          required: true,
          completed: false,
          leaGuidance: 'Préparez un inventaire complet : clés de portes, garage, cabanon, codes d\'alarme, télécommandes, etc.'
        }
      ],
      reminders: []
    }
  ];

  const steps = selectedView === 'acheteur' ? buyerSteps : vendorSteps;
  const currentStepIndex = steps.findIndex(s => s.status === 'current');

  const getStatusIcon = (status: Step['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'current':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  const getPriorityColor = (priority: Reminder['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Étapes de transaction</h1>
              <p className="text-gray-600 mt-1">Guidé par Léa, votre assistante AI</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowLeaPanel(!showLeaPanel)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Demander à Léa
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Transaction Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Home className="w-6 h-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900">{transaction.name}</h2>
              </div>
              <p className="text-gray-600 ml-9">{transaction.address}</p>
              <div className="flex items-center gap-6 mt-4 ml-9 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Acheteur:</span>
                  <span className="font-medium text-gray-900">{transaction.buyer}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Vendeur:</span>
                  <span className="font-medium text-gray-900">{transaction.seller}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(transaction.price)}
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progression globale</span>
              <span className="text-sm text-gray-600">{transaction.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${transaction.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Point de vue:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedView('acheteur')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedView === 'acheteur'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Vue acheteur
              </button>
              <button
                onClick={() => setSelectedView('vendeur')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedView === 'vendeur'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Vue vendeur
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Steps */}
          <div className="lg:col-span-2 space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  step.status === 'current'
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : 'border-gray-100'
                }`}
              >
                {/* Step Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                        {step.status === 'current' && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                            En cours
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                      {step.dueDate && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Date limite: {formatDate(step.dueDate)}</span>
                        </div>
                      )}
                      {step.completedDate && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complété le {formatDate(step.completedDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {step.actions.length > 0 && (
                  <div className="p-6 space-y-3">
                    {step.actions.map((action) => (
                      <div
                        key={action.id}
                        className={`p-4 rounded-xl border transition-all ${
                          action.completed
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={action.completed}
                            onChange={() => {}}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className={`font-medium ${action.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {action.title}
                              </h4>
                              {action.required && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200">
                                  Requis
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${action.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                              {action.description}
                            </p>
                            {action.dueDate && !action.completed && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                                <Clock className="w-4 h-4" />
                                <span>À faire avant le {formatDate(action.dueDate)}</span>
                              </div>
                            )}
                            {action.documents && action.documents.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Documents: {action.documents.join(', ')}
                                </span>
                              </div>
                            )}
                            {action.leaGuidance && !action.completed && (
                              <button
                                onClick={() => {
                                  setSelectedAction(action);
                                  setShowLeaPanel(true);
                                }}
                                className="flex items-center gap-2 mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                <Sparkles className="w-4 h-4" />
                                Demander conseil à Léa
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar - Reminders & Léa */}
          <div className="space-y-6">
            {/* Reminders */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Rappels</h3>
              </div>
              <div className="space-y-3">
                {steps
                  .flatMap(s => s.reminders)
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-3 rounded-lg border ${getPriorityColor(reminder.priority)}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{reminder.title}</p>
                          <p className="text-xs mt-1">{formatDate(reminder.dueDate)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                {steps.flatMap(s => s.reminders).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Aucun rappel pour le moment
                  </p>
                )}
              </div>
            </div>

            {/* Léa Panel */}
            {showLeaPanel && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm p-6 border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Léa</h3>
                    <p className="text-sm text-gray-600">Votre assistante AI</p>
                  </div>
                </div>
                {selectedAction && selectedAction.leaGuidance ? (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-gray-900">{selectedAction.title}</p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedAction.leaGuidance}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Bonjour ! Je suis Léa, votre assistante AI. Je suis là pour vous guider à travers chaque étape de votre transaction immobilière.
                      Cliquez sur "Demander conseil à Léa" sur n'importe quelle action pour obtenir de l'aide.
                    </p>
                  </div>
                )}
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-blue-600 rounded-xl hover:bg-gray-50 transition-all font-medium border border-blue-200">
                  <MessageSquare className="w-4 h-4" />
                  Poser une question
                </button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Étapes complétées</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {steps.filter(s => s.status === 'completed').length} / {steps.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Actions restantes</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {steps.flatMap(s => s.actions).filter(a => !a.completed).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Documents requis</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {steps.flatMap(s => s.actions).flatMap(a => a.documents || []).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
