'use client';

import { useAuthStore } from '@/lib/store';
import { Sparkles, Quote, Plus, Paperclip, ChevronDown, ListTodo, Mail, FileText, Code, Mic, MicOff, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { clsx } from 'clsx';

interface LeaInitialUIProps {
  onPromptSelect?: (prompt: string) => void;
  onInputSubmit?: (text: string) => void;
  inputValue?: string;
  onInputChange?: (value: string) => void;
  inputPlaceholder?: string;
  showExampleCards?: boolean;
  isListening?: boolean;
  onVoiceToggle?: () => void;
  voiceSupported?: boolean;
  isLoading?: boolean;
}

const exampleCards = [
  {
    title: "Écrire une liste de tâches pour un projet personnel",
    icon: <ListTodo className="w-6 h-6" />,
    prompt: "Crée une liste de tâches pour mon projet immobilier"
  },
  {
    title: "Générer un email pour répondre à une offre d'emploi",
    icon: <Mail className="w-6 h-6" />,
    prompt: "Rédige un email professionnel pour répondre à une offre d'emploi"
  },
  {
    title: "Résumer cet article en un paragraphe",
    icon: <FileText className="w-6 h-6" />,
    prompt: "Résume cet article en un paragraphe"
  },
  {
    title: "Comment fonctionne l'IA de manière technique",
    icon: <Code className="w-6 h-6" />,
    prompt: "Explique-moi comment fonctionne l'IA de manière technique"
  }
];

export default function LeaInitialUI({
  onPromptSelect,
  onInputSubmit,
  inputValue = '',
  onInputChange,
  inputPlaceholder = "Posez une question à l'IA ou faites une demande...",
  showExampleCards = true,
  isListening = false,
  onVoiceToggle,
  voiceSupported = false,
  isLoading = false,
}: LeaInitialUIProps) {
  const { user } = useAuthStore();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim() && onInputSubmit) {
      e.preventDefault();
      onInputSubmit(inputValue.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-6 pb-12 max-w-4xl mx-auto w-full">
      {/* Large Purple Sphere Icon */}
      <div className="mb-8 relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-purple-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-purple-500/50 animate-pulse">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 opacity-20 blur-2xl animate-pulse" />
      </div>

      {/* Greeting */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
        {getGreeting()}, {user?.name?.split(' ')[0] || 'Utilisateur'}
      </h1>
      
      {/* Question with gradient */}
      <h2 className="text-2xl md:text-3xl font-semibold mb-12">
        Qu'est-ce qui vous préoccupe{' '}
        <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
          aujourd'hui ?
        </span>
      </h2>

      {/* Large Input Field */}
      <div className="w-full mb-8">
        <div className="relative bg-background border-2 border-border rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            onKeyPress={handleInputKeyPress}
            placeholder={inputPlaceholder}
            disabled={isLoading || isListening}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-lg outline-none pr-24"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {/* Voice Button */}
            {voiceSupported && onVoiceToggle && (
              <button
                type="button"
                onClick={onVoiceToggle}
                disabled={isLoading}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'hover:bg-muted'
                )}
                title={isListening ? 'Arrêter l\'écoute' : 'Parler à Léa'}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            )}
            {/* Send Button */}
            {inputValue.trim() && (
              <button
                type="button"
                onClick={() => inputValue.trim() && onInputSubmit?.(inputValue.trim())}
                disabled={!inputValue.trim() || isLoading || isListening}
                className={clsx(
                  'p-2 rounded-lg transition-colors',
                  inputValue.trim() && !isLoading && !isListening
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
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
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Citation"
            >
              <Quote className="w-5 h-5 text-purple-500" />
            </button>
            <button
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              title="Ajouter"
            >
              <Plus className="w-5 h-5 text-foreground" />
            </button>
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
            <Quote className="w-4 h-4 mr-2 text-purple-500" />
            Citation
          </Button>
        </div>
      </div>

      {/* Example Cards Section */}
      {showExampleCards && (
        <div className="w-full mt-12">
          <p className="text-sm text-muted-foreground text-center mb-6 uppercase tracking-wider">
            Commencez avec un exemple ci-dessous
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleCards.map((card, index) => (
              <Card
                key={index}
                hover
                onClick={() => onPromptSelect?.(card.prompt)}
                className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
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
      )}
    </div>
  );
}
