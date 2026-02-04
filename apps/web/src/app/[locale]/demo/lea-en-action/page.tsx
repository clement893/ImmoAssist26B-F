"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Play } from "lucide-react";

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

interface DemoStep {
  id: number;
  title: string;
  description: string;
  demoMessages: DemoMessage[];
}

export default function LeaEnActionDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState<DemoMessage[]>([]);

  const demoSteps: DemoStep[] = [
    {
      id: 0,
      title: "Bienvenue",
      description: "Découvrez Léa, votre assistante AI qui automatise tout",
      demoMessages: []
    },
    {
      id: 1,
      title: "Création de transaction par la voix",
      description: "Parlez, Léa s'occupe du reste",
      demoMessages: [
        { role: "user", content: "Léa, crée une nouvelle transaction pour Sophie Martin, achat au 123 Rue Principale, Montréal, 450 000 dollars" },
        { role: "assistant", content: "Parfait ! Je crée la transaction pour Sophie Martin.\n\n• Client : Sophie Martin\n• Type : Achat\n• Adresse : 123 Rue Principale, Montréal\n• Prix : 450 000 $\n\n✅ Transaction créée avec succès !" }
      ]
    },
    {
      id: 2,
      title: "Pré-remplissage automatique des formulaires OACIQ",
      description: "Léa remplit vos contrats automatiquement",
      demoMessages: [
        { role: "user", content: "Peux-tu pré-remplir le contrat de courtage achat pour Sophie ?" },
        { role: "assistant", content: "Je remplis le contrat de courtage achat (CCA)...\n\n✅ Contrat pré-rempli à 95% !\n\n• Nom : Sophie Martin\n• Budget : 450 000 $\n• Secteur : Montréal\n• Durée : 90 jours\n\nIl ne reste qu'à vérifier et signer !" }
      ]
    },
    {
      id: 3,
      title: "Gestion intelligente des délais",
      description: "Ne manquez plus jamais une échéance",
      demoMessages: [
        { role: "user", content: "Quelles sont mes prochaines échéances ?" },
        { role: "assistant", content: "Vos échéances cette semaine :\n\n⚠️ Mercredi 5 février - Inspection\n123 Rue Principale - 14h00\n\n⚠️ Vendredi 7 février - Financement\nDate limite d'obtention du prêt\n\n📅 Samedi 8 février - Signature\nChez le notaire - 10h00\n\nJe vous enverrai des rappels 24h et 1h avant." }
      ]
    },
    {
      id: 4,
      title: "Rappels automatiques aux clients",
      description: "Communication proactive",
      demoMessages: [
        { role: "user", content: "Envoie un rappel à Sophie pour l'inspection de demain" },
        { role: "assistant", content: "✅ Rappel envoyé à Sophie Martin !\n\n📧 Email :\n\"Bonjour Sophie, rappel pour votre inspection demain à 14h00 au 123 Rue Principale.\"\n\n📱 SMS :\n\"Rappel : Inspection demain 14h - 123 Rue Principale\"\n\nSophie a bien reçu les notifications." }
      ]
    },
    {
      id: 5,
      title: "Archivage intelligent par email",
      description: "Forward et c'est classé",
      demoMessages: [
        { role: "user", content: "J'ai transféré la promesse d'achat signée à documents@immoassist.ai" },
        { role: "assistant", content: "✅ Document reçu et classé automatiquement !\n\n📧 Email analysé :\n• De : sophie.martin@email.com\n• Objet : PA signée - 123 Rue Principale\n• Pièce jointe : PA_123_Principale_signee.pdf\n\n📁 Classement :\nTransaction : 123 Rue Principale → Documents → Promesse d'achat signée" }
      ]
    },
    {
      id: 6,
      title: "Coordination complète",
      description: "Votre chef d'orchestre personnel",
      demoMessages: [
        { role: "user", content: "Donne-moi un aperçu de la transaction de Sophie" },
        { role: "assistant", content: "Transaction : 123 Rue Principale, Montréal\n\n📊 Progression : 75%\n\n✅ Étapes complétées :\n• Promesse d'achat acceptée (1er février)\n• Inspection complétée (2 février)\n• Financement approuvé (3 février)\n\n⏳ Prochaine étape :\n• Signature chez le notaire (8 février - 10h00)\n\n📋 Documents à jour :\n• Contrat de courtage ✓\n• Promesse d'achat signée ✓\n• Rapport d'inspection ✓\n• Lettre de financement ✓" }
      ]
    }
  ];

  const currentStepData = demoSteps[currentStep];

  useEffect(() => {
    setMessages([]);
    setIsActive(false);
  }, [currentStep]);

  const startDemo = () => {
    if (!currentStepData || currentStepData.demoMessages.length === 0) return;
    
    setIsActive(true);
    setMessages([]);
    
    let messageIndex = 0;
    const addNextMessage = () => {
      if (!currentStepData) return;
      if (messageIndex < currentStepData.demoMessages.length) {
        const message = currentStepData.demoMessages[messageIndex];
        if (!message) return;
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

  if (!currentStepData) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* Header minimaliste */}
      <div className="border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <h1 className="text-2xl font-bold text-slate-900">ImmoAssist</h1>
          <p className="text-slate-600 mt-1">Démo interactive avec Léa</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* Titre de l'étape */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-700 mb-6">
            Étape {currentStep + 1} / {demoSteps.length}
          </div>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{currentStepData.title}</h2>
          <p className="text-xl text-slate-600">{currentStepData.description}</p>
        </div>

        {/* Cercle Léa - VRAIMENT WOW */}
        <div className="flex justify-center mb-16">
          <div className="relative">
            {/* Cercles d'animation - beaucoup plus grands et impressionnants */}
            {isActive && (
              <>
                {/* Onde 1 - la plus grande */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-slate-900 animate-ping"
                  style={{
                    width: '400px',
                    height: '400px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDuration: '2s'
                  }}
                />
                {/* Onde 2 - moyenne */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-slate-700 animate-ping"
                  style={{
                    width: '300px',
                    height: '300px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDuration: '1.5s',
                    animationDelay: '0.2s'
                  }}
                />
                {/* Onde 3 - petite */}
                <div 
                  className="absolute inset-0 rounded-full border-4 border-slate-500 animate-ping"
                  style={{
                    width: '200px',
                    height: '200px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animationDuration: '1s',
                    animationDelay: '0.4s'
                  }}
                />
              </>
            )}
            
            {/* Cercle principal - GROS et impressionnant */}
            <div 
              className={`relative rounded-full bg-slate-900 flex items-center justify-center transition-all duration-500 ${
                isActive ? 'scale-110 shadow-2xl' : 'scale-100 shadow-xl'
              }`}
              style={{
                width: '160px',
                height: '160px'
              }}
            >
              {/* Pulse interne quand actif */}
              {isActive && (
                <div className="absolute inset-0 rounded-full bg-slate-700 animate-pulse" />
              )}
              
              {/* Texte Léa */}
              <span className="relative text-5xl font-bold text-white">Léa</span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-12">
          <p className="text-lg font-medium text-slate-900">
            {isActive ? "En train de répondre..." : "Prête à vous assister"}
          </p>
        </div>

        {/* Zone de messages */}
        <div className="bg-slate-50 rounded-2xl p-8 min-h-[400px]">
          {messages.length === 0 && !isActive && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Prêt à découvrir cette fonctionnalité ?</h3>
              <p className="text-slate-600 mb-8 text-lg">Cliquez sur le bouton ci-dessous pour lancer la démonstration.</p>
              {currentStepData.demoMessages.length > 0 && (
                <button
                  onClick={startDemo}
                  className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white bg-slate-900 hover:bg-slate-800 hover:shadow-lg transition-all text-lg"
                >
                  <Play className="w-6 h-6" />
                  Lancer la démonstration
                </button>
              )}
            </div>
          )}

          <div className="space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 border-2 border-slate-200"
                  }`}
                >
                  <p className="whitespace-pre-line text-base leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton rejouer */}
          {messages.length > 0 && !isActive && (
            <div className="mt-8 text-center">
              <button
                onClick={startDemo}
                className="px-6 py-3 rounded-xl font-medium text-slate-700 bg-white border-2 border-slate-200 hover:bg-slate-50 transition-all"
              >
                Rejouer la démonstration
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-12">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              currentStep === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-white text-slate-900 border-2 border-slate-200 hover:bg-slate-50"
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
                : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg"
            }`}
          >
            Suivant
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
