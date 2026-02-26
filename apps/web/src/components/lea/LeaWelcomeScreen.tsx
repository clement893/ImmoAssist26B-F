'use client';

import { useAuthStore } from '@/lib/store';
import { Sparkles, Quote, Paperclip, ChevronDown, ListTodo, Mail, Mic, MicOff, ArrowUp, Receipt, Calculator, ClipboardList, Home, Square, AudioLines } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

interface LeaWelcomeScreenProps {
  onMessageSend: (message: string) => Promise<void>;
  initialMessage?: string;
  // Input handling
  inputValue: string;
  onInputChange: (value: string) => void;
  // Voice props
  isListening: boolean;
  onVoiceToggle: () => Promise<void>;
  voiceSupported: boolean;
  isLoading: boolean;
  // Voice recording (message vocal → API)
  recordSupported?: boolean;
  isRecording?: boolean;
  onVoiceRecordToggle?: () => Promise<void>;
  // Error handling
  voiceError?: string | null;
}

const exampleCards = [
  {
    title: "Créer une liste de tâches pour une transaction",
    icon: <ListTodo className="w-6 h-6" />,
    prompt: "Crée une liste de tâches complète pour une transaction immobilière au Québec, de la promesse d'achat jusqu'à la clôture"
  },
  {
    title: "Rédiger un email professionnel pour un client",
    icon: <Mail className="w-6 h-6" />,
    prompt: "Rédige un email professionnel et chaleureux pour informer un client de l'acceptation de son offre d'achat"
  },
  {
    title: "Expliquer les étapes d'une transaction immobilière",
    icon: <Receipt className="w-6 h-6" />,
    prompt: "Explique-moi les étapes principales d'une transaction immobilière au Québec et les délais typiques pour chacune"
  },
  {
    title: "Aide avec les formulaires OACIQ",
    icon: <ClipboardList className="w-6 h-6" />,
    prompt: "Quels formulaires OACIQ sont obligatoires pour une transaction de vente résidentielle au Québec ?"
  },
  {
    title: "Calculer les commissions",
    icon: <Calculator className="w-6 h-6" />,
    prompt: "Comment calculer les commissions pour une transaction de 500 000$ avec un taux de commission de 5% ?"
  },
  {
    title: "Rédiger une description de propriété",
    icon: <Home className="w-6 h-6" />,
    prompt: "Aide-moi à rédiger une description attrayante pour une propriété unifamiliale de 3 chambres à vendre"
  }
];

export default function LeaWelcomeScreen({
  onMessageSend,
  initialMessage: _initialMessage,
  inputValue,
  onInputChange,
  isListening,
  onVoiceToggle,
  voiceSupported,
  isLoading,
  recordSupported = false,
  isRecording = false,
  onVoiceRecordToggle,
  voiceError = null,
}: LeaWelcomeScreenProps) {
  const { user } = useAuthStore();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && !isLoading && !isListening) {
      e.preventDefault();
      onMessageSend(inputValue.trim());
      onInputChange('');
    }
  };

  const handlePromptSelect = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;
    onInputChange('');
    await onMessageSend(prompt.trim());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 pb-12 max-w-4xl mx-auto w-full">
      {/* Large Green Sphere Icon */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center shadow-standard-xl shadow-green-500/50 animate-pulse"> {/* UI Revamp - shadow-standard-xl */}
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-blue-500 opacity-20 blur-2xl animate-pulse" />
      </div>

      {/* Greeting */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
        {getGreeting()}, {user?.name?.split(' ')[0] || 'Utilisateur'}
      </h1>
      
      {/* Question with gradient - Voice-first messaging */}
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">
        {voiceSupported ? (
          <>
            Parlez-moi de{' '}
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              votre activité immobilière
            </span>
          </>
        ) : (
          <>
            Comment puis-je vous aider avec{' '}
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
              votre activité immobilière ?
            </span>
          </>
        )}
      </h2>
      {voiceSupported ? (
        <p className="text-muted-foreground text-lg mb-12">
          Cliquez sur le bouton ci-dessous pour commencer à parler avec Léa
        </p>
      ) : (
        <p className="text-muted-foreground text-lg mb-12">
          La reconnaissance vocale n'est pas disponible dans votre navigateur. Utilisez le champ de texte ci-dessous.
        </p>
      )}

      {/* Large Voice-First Input Field */}
      <div className="w-full mb-8">
        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
            <p>Debug: voiceSupported={voiceSupported ? 'true' : 'false'}, isListening={isListening ? 'true' : 'false'}</p>
          </div>
        )}

        {/* Error Alert */}
        {voiceError && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Erreur de reconnaissance vocale</p>
            <p className="text-sm text-red-700 dark:text-red-300">{voiceError}</p>
            {voiceError.includes('Permission') && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                Veuillez autoriser l'accès au microphone dans les paramètres de votre navigateur.
              </p>
            )}
          </div>
        )}

        {/* Voice Action Button - Prominent for voice-first experience */}
        {(voiceSupported || recordSupported) && (
          <div className="flex justify-center mb-6">
            {voiceSupported && (
              <button
                type="button"
                onClick={async () => {
                  console.log('Voice button clicked, isListening:', isListening);
                  try {
                    await onVoiceToggle();
                    console.log('Voice toggle completed');
                  } catch (err) {
                    console.error('Error clicking voice button:', err);
                  }
                }}
                disabled={isLoading || isRecording}
                className={clsx(
                  'px-8 py-4 rounded-2xl transition-all transform hover:scale-105 shadow-standard-xl',
                  'flex items-center gap-3 text-lg font-semibold',
                  isListening
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
                title={isListening ? 'Arrêter la dictée' : 'Parlez à Léa'}
              >
                {isListening ? (
                  <>
                    <div className="relative">
                      <MicOff className="w-6 h-6" />
                      <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                    </div>
                    <span>Écoute en cours...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>Parlez à Léa</span>
                  </>
                )}
              </button>
            )}
            {recordSupported && onVoiceRecordToggle && !voiceSupported && (
              <button
                type="button"
                onClick={onVoiceRecordToggle}
                disabled={isLoading || isListening}
                className={clsx(
                  'px-8 py-4 rounded-2xl transition-all transform hover:scale-105 shadow-standard-xl',
                  'flex items-center gap-3 text-lg font-semibold',
                  isRecording
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white animate-pulse'
                    : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                )}
                title={isRecording ? 'Arrêter et envoyer' : 'Message vocal'}
              >
                {isRecording ? (
                  <>
                    <Square className="w-6 h-6" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>Message vocal</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Listening Indicator */}
        {isListening && (
          <div className="mb-4 flex items-center justify-center gap-3 text-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 border-2 border-amber-200 dark:border-amber-800">
            <div className="relative">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-amber-500/50 animate-ping" />
            </div>
            <span className="font-semibold text-lg">Léa vous écoute... Parlez maintenant</span>
          </div>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mb-4 flex items-center justify-center gap-3 text-red-500 bg-red-50 dark:bg-red-950/20 rounded-xl p-4 border-2 border-red-200 dark:border-red-800">
            <div className="relative">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-red-500/50 animate-ping" />
            </div>
            <span className="font-semibold text-lg">Enregistrement en cours... Cliquez pour envoyer</span>
          </div>
        )}

        <div className="relative bg-background border-2 border-border rounded-2xl p-4 shadow-standard-lg hover:shadow-standard-xl transition-modern focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"> {/* UI Revamp - Nouveau système d'ombres et transition moderne */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyPress={handleInputKeyPress}
            placeholder={voiceSupported ? "Ou tapez votre message ici..." : "Posez une question sur l'immobilier, les transactions, les formulaires OACIQ..."}
            disabled={isLoading || isListening}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-lg outline-none pr-24"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Voice Recording - message vocal API */}
            {recordSupported && onVoiceRecordToggle && (
              <button
                type="button"
                onClick={onVoiceRecordToggle}
                disabled={isLoading || isListening}
                className={clsx(
                  'p-2 rounded-lg transition-modern',
                  isRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'hover:bg-muted'
                )}
                title={isRecording ? 'Arrêter et envoyer' : 'Message vocal'}
              >
                {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            {/* Voice Recognition - dictée */}
            {voiceSupported && (
              <button
                type="button"
                onClick={onVoiceToggle}
                disabled={isLoading || isRecording}
                className={clsx(
                  'p-2 rounded-lg transition-modern',
                  isListening ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'hover:bg-muted'
                )}
                title={isListening ? 'Arrêter la dictée' : 'Dicter'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <AudioLines className="w-5 h-5" />
                )}
              </button>
            )}
            {/* Send Button */}
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => {
                  if (inputValue.trim() && !isLoading && !isListening) {
                    onMessageSend(inputValue.trim());
                    onInputChange('');
                  }
                }}
                disabled={!inputValue.trim() || isLoading || isListening}
                className={clsx(
                  'p-2 rounded-lg transition-modern', // UI Revamp - Transition moderne
                  inputValue.trim() && !isLoading && !isListening
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white'
                    : 'bg-muted opacity-50 cursor-not-allowed'
                )}
                title="Envoyer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowUp className="w-5 h-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons Below Input */}
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Paperclip className="w-4 h-4 mr-2" />
              Joindre
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              Styles d'écriture
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Quote className="w-4 h-4 mr-2 text-green-500" />
            Citation
          </Button>
        </div>
      </div>

      {/* Example Cards Section */}
      <div className="w-full mt-12">
        <p className="text-sm text-muted-foreground text-center mb-6 uppercase tracking-wider">
          Commencez avec un exemple ci-dessous
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exampleCards.map((card, index) => (
            <Card
              key={index}
              hover
              onClick={() => handlePromptSelect(card.prompt)}
              className="cursor-pointer transition-modern hover:shadow-standard-lg hover:-translate-y-1" // UI Revamp - Transition moderne, shadow-standard-lg
            >
              <div className="flex items-start gap-4 p-6">
                <div className="p-3 rounded-lg bg-muted flex-shrink-0">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    {card.title}
                  </h3>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
