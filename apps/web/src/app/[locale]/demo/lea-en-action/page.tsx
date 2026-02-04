"use client";

import { useState, useEffect } from "react";
import { 
  Mic, 
  FileText, 
  Calendar, 
  Bell, 
  CheckCircle, 
  Mail,
  Sparkles,
  ArrowRight,
  Play
} from "lucide-react";

export default function LeaEnActionDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant", content: string }>>([]);
  const [showAnimation, setShowAnimation] = useState(false);

  const demoSteps = [
    {
      id: 0,
      title: "Bienvenue dans ImmoAssist",
      subtitle: "Découvrez Léa, votre assistante AI",
      description: "Léa est votre assistante intelligente qui automatise toutes vos tâches de courtage immobilier.",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      demoMessages: []
    },
    {
      id: 1,
      title: "Création de transaction par la voix",
      subtitle: "Parlez, Léa s'occupe du reste",
      description: "Dites simplement à Léa les détails de votre nouvelle transaction.",
      icon: Mic,
      color: "from-blue-500 to-cyan-500",
      demoMessages: [
        { role: "user" as const, content: "Léa, crée une nouvelle transaction pour Sophie Martin, achat au 123 Rue Principale, Montréal, 450 000 dollars" },
        { role: "assistant" as const, content: "Parfait ! Je crée la transaction pour Sophie Martin. Voici ce que j'ai compris :\n\n• **Client** : Sophie Martin\n• **Type** : Achat\n• **Adresse** : 123 Rue Principale, Montréal\n• **Prix** : 450 000 $\n\n✅ Transaction créée avec succès ! J'ai généré automatiquement le dossier complet avec tous les documents nécessaires." }
      ]
    },
    {
      id: 2,
      title: "Pré-remplissage automatique des formulaires OACIQ",
      subtitle: "Fini la paperasse manuelle",
      description: "Léa remplit automatiquement vos contrats de courtage et promesses d'achat.",
      icon: FileText,
      color: "from-green-500 to-emerald-500",
      demoMessages: [
        { role: "user" as const, content: "Peux-tu pré-remplir le contrat de courtage achat pour Sophie ?" },
        { role: "assistant" as const, content: "Bien sûr ! Je remplis le contrat de courtage achat (CCA) avec les informations de Sophie Martin...\n\n✅ **Contrat pré-rempli à 95% !**\n\n• Nom de l'acheteur : Sophie Martin\n• Budget maximum : 450 000 $\n• Secteur recherché : Montréal\n• Date de début : 2026-02-03\n• Durée du contrat : 90 jours\n\nIl ne reste plus qu'à vérifier et signer !" }
      ]
    },
    {
      id: 3,
      title: "Gestion intelligente des délais",
      subtitle: "Ne manquez plus jamais une échéance",
      description: "Léa surveille tous vos délais et vous alerte automatiquement.",
      icon: Calendar,
      color: "from-orange-500 to-red-500",
      demoMessages: [
        { role: "user" as const, content: "Quelles sont mes prochaines échéances ?" },
        { role: "assistant" as const, content: "Voici vos échéances cette semaine :\n\n⚠️ **Mercredi 5 février - Inspection**\n123 Rue Principale - 14h00\n*Dans 2 jours*\n\n⚠️ **Vendredi 7 février - Financement**\nDate limite d'obtention du prêt\n*Dans 4 jours*\n\n📅 **Samedi 8 février - Signature**\nChez le notaire - 10h00\n*Dans 5 jours*\n\nJe vous enverrai des rappels automatiques 24h et 1h avant chaque échéance." }
      ]
    },
    {
      id: 4,
      title: "Rappels automatiques à vos clients",
      subtitle: "Communication proactive",
      description: "Léa envoie automatiquement des rappels à vos clients.",
      icon: Bell,
      color: "from-indigo-500 to-purple-500",
      demoMessages: [
        { role: "user" as const, content: "Envoie un rappel à Sophie pour l'inspection de demain" },
        { role: "assistant" as const, content: "✅ **Rappel envoyé à Sophie Martin !**\n\n📧 **Email** :\n\"Bonjour Sophie, rappel pour votre inspection demain à 14h00 au 123 Rue Principale. N'oubliez pas d'apporter vos questions pour l'inspecteur !\"\n\n📱 **SMS** :\n\"Rappel : Inspection demain 14h - 123 Rue Principale\"\n\nSophie a bien reçu les deux notifications." }
      ]
    },
    {
      id: 5,
      title: "Archivage intelligent par email",
      subtitle: "Forward et c'est classé",
      description: "Transférez vos documents à Léa par email et elle les classe automatiquement.",
      icon: Mail,
      color: "from-pink-500 to-rose-500",
      demoMessages: [
        { role: "user" as const, content: "J'ai transféré la promesse d'achat signée à documents@immoassist.ai" },
        { role: "assistant" as const, content: "✅ **Document reçu et classé automatiquement !**\n\n📧 **Email analysé** :\n• De : sophie.martin@email.com\n• Objet : PA signée - 123 Rue Principale\n• Pièce jointe : PA_123_Principale_signee.pdf\n\n📁 **Classement** :\nTransaction : 123 Rue Principale → Documents → Promesse d'achat signée\n\nLe document est maintenant accessible dans votre dossier de transaction." }
      ]
    },
    {
      id: 6,
      title: "Coordination complète de la transaction",
      subtitle: "Votre chef d'orchestre personnel",
      description: "Léa coordonne toutes les étapes de A à Z.",
      icon: CheckCircle,
      color: "from-teal-500 to-green-500",
      demoMessages: [
        { role: "user" as const, content: "Donne-moi un aperçu de la transaction de Sophie" },
        { role: "assistant" as const, content: "**Transaction : 123 Rue Principale, Montréal**\n\n📊 **Progression : 75%**\n\n✅ **Étapes complétées** :\n• Promesse d'achat acceptée (1er février)\n• Inspection complétée (2 février)\n• Financement approuvé (3 février)\n\n⏳ **Prochaine étape** :\n• Signature chez le notaire (8 février - 10h00)\n\n📋 **Documents à jour** :\n• Contrat de courtage ✓\n• Promesse d'achat signée ✓\n• Rapport d'inspection ✓\n• Lettre de financement ✓\n\nTout est sur la bonne voie ! Je vous tiendrai informé de chaque avancement." }
      ]
    }
  ];

  const currentStepData = demoSteps[currentStep];

  useEffect(() => {
    setMessages([]);
    setIsActive(false);
    setShowAnimation(true);
    const timer = setTimeout(() => setShowAnimation(false), 1000);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const startDemo = () => {
    if (currentStepData.demoMessages.length === 0) return;
    
    setIsActive(true);
    setMessages([]);
    
    let messageIndex = 0;
    const addNextMessage = () => {
      if (messageIndex < currentStepData.demoMessages.length) {
        const message = currentStepData.demoMessages[messageIndex];
        setMessages(prev => [...prev, message]);
        messageIndex++;
        
        const delay = message.role === "user" ? 1500 : 3000;
        setTimeout(addNextMessage, delay);
      } else {
        setTimeout(() => setIsActive(false), 1000);
      }
    };
    
    setTimeout(addNextMessage, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">ImmoAssist</h1>
              <p className="text-sm text-slate-600">Démo interactive avec Léa</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="font-medium">Étape {currentStep + 1}</span>
            <span className="text-slate-400">/</span>
            <span>{demoSteps.length}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Parcours de démonstration</h2>
              <div className="space-y-2">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(index)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-gradient-to-r " + step.color + " text-white shadow-lg scale-105"
                          : isCompleted
                          ? "bg-green-50 text-green-700 hover:bg-green-100"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? "bg-white/20" : isCompleted ? "bg-green-100" : "bg-white"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                        )}
                      </div>
                      <span className="text-sm font-medium text-left">{step.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step Header */}
            <div className={`bg-gradient-to-r ${currentStepData.color} rounded-2xl shadow-xl p-8 text-white transform transition-all duration-500 ${
              showAnimation ? "scale-105" : "scale-100"
            }`}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <currentStepData.icon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold mb-2">{currentStepData.title}</h2>
                  <p className="text-lg text-white/90 mb-4">{currentStepData.subtitle}</p>
                  <p className="text-white/80">{currentStepData.description}</p>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              {/* Chat Header with Léa Circle */}
              <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-4">
                  {/* Cercle pulse comme ChatGPT */}
                  <div className="relative flex items-center justify-center">
                    {isActive && (
                      <>
                        <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-20 animate-ping" />
                        <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-40 animate-pulse" />
                      </>
                    )}
                    <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center transition-all ${
                      isActive ? "scale-110" : "scale-100"
                    }`}>
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Léa</h3>
                    <p className="text-sm text-slate-600">
                      {isActive ? "En train de répondre..." : "Votre assistante AI"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
                {messages.length === 0 && !isActive && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Prêt à découvrir cette fonctionnalité ?</h3>
                    <p className="text-slate-600 mb-6">Cliquez sur le bouton ci-dessous pour lancer la démonstration.</p>
                    {currentStepData.demoMessages.length > 0 && (
                      <button
                        onClick={startDemo}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${currentStepData.color} hover:shadow-lg hover:scale-105 transition-all`}
                      >
                        <Play className="w-5 h-5" />
                        Lancer la démonstration
                      </button>
                    )}
                  </div>
                )}

                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-gradient-to-r " + currentStepData.color + " text-white"
                            : "bg-slate-100 text-slate-900"
                        }`}
                      >
                        <p className="whitespace-pre-line">{message.content}</p>
                      </div>
                      {message.role === "user" && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                          <span className="text-sm font-semibold text-slate-700">Vous</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Footer */}
              {messages.length > 0 && !isActive && (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={startDemo}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Rejouer la démonstration
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentStep === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:shadow-md"
                }`}
              >
                ← Précédent
              </button>
              <button
                onClick={() => setCurrentStep(Math.min(demoSteps.length - 1, currentStep + 1))}
                disabled={currentStep === demoSteps.length - 1}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  currentStep === demoSteps.length - 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:scale-105"
                }`}
              >
                Suivant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
