'use client';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { Button, Card } from '@/components/ui';
import { 
  Search, 
  UserPlus, 
  Plus, 
  Paperclip, 
  FileText, 
  Code, 
  Mail,
  ListTodo,
  Sparkles,
  Quote,
  ChevronDown,
  ArrowLeft,
  Send,
  Zap,
  Brain,
  MessageSquare
} from 'lucide-react';
import LeaChat from '@/components/lea/LeaChat';

const exampleCards = [
  {
    title: "Écrire une liste de tâches",
    description: "Crée une liste de tâches pour mon projet immobilier",
    icon: <ListTodo className="w-5 h-5" />,
    prompt: "Crée une liste de tâches pour mon projet immobilier",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30"
  },
  {
    title: "Générer un email professionnel",
    description: "Rédige un email professionnel pour répondre à une offre",
    icon: <Mail className="w-5 h-5" />,
    prompt: "Rédige un email professionnel pour répondre à une offre d'emploi",
    gradient: "from-indigo-500 to-purple-500",
    bgGradient: "from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
  },
  {
    title: "Résumer un article",
    description: "Résume cet article en un paragraphe",
    icon: <FileText className="w-5 h-5" />,
    prompt: "Résume cet article en un paragraphe",
    gradient: "from-green-500 to-emerald-500",
    bgGradient: "from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
  },
  {
    title: "Expliquer l'IA",
    description: "Explique-moi comment fonctionne l'IA de manière technique",
    icon: <Code className="w-5 h-5" />,
    prompt: "Explique-moi comment fonctionne l'IA de manière technique",
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30"
  }
];

function AgentsContent() {
  const { user } = useAuthStore();
  const [showChat, setShowChat] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const handleExampleClick = (prompt: string) => {
    setSelectedPrompt(prompt);
    setShowChat(true);
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setSelectedPrompt(inputValue.trim());
      setShowChat(true);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (showChat) {
    return (
      <div className="w-full h-full">
        {/* Back button - Improved styling */}
        <div className="mb-6 px-6 pt-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChat(false);
              setSelectedPrompt(null);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Button>
        </div>
        <div className="h-[calc(100vh-200px)] min-h-[600px] w-full px-6">
          <LeaChat initialMessage={selectedPrompt || undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header - Improved layout */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Assistant IA</h2>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground hidden md:flex"
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground hidden md:flex"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Inviter
              </Button>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => {
                  setShowChat(true);
                  setSelectedPrompt(null);
                }}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg shadow-green-500/25"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Centered and improved */}
      <div className="flex flex-col items-center justify-center px-6 py-12 max-w-4xl mx-auto">
        {/* Hero Section - Improved */}
        <div className="text-center mb-12 space-y-4">
          {/* Large Icon with better animation */}
          <div className="mb-8 relative inline-block">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-green-500/30 transform hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-blue-500 opacity-20 blur-2xl animate-pulse" />
          </div>

          {/* Greeting */}
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-3">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Utilisateur'}
          </h1>
          
          {/* Question with gradient */}
          <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
            Comment puis-je vous aider{' '}
            <span className="bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent font-bold">
              aujourd'hui ?
            </span>
          </h2>
        </div>

        {/* Input Field - Improved design */}
        <div className="w-full mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-background border-2 border-border rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Posez une question à l'IA ou faites une demande..."
                    className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-lg outline-none"
                    onKeyPress={handleKeyPress}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Joindre un fichier"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim()}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/25"
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions - Improved */}
          <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Joindre
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
            >
              <Zap className="w-4 h-4 mr-2" />
              Styles d'écriture
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
            >
              <Quote className="w-4 h-4 mr-2 text-green-500" />
              Citation
            </Button>
          </div>
        </div>

        {/* Example Cards Section - Improved design */}
        <div className="w-full mt-8">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Commencez avec un exemple
            </p>
            <div className="flex items-center justify-center gap-2 text-muted-foreground/60">
              <Brain className="w-4 h-4" />
              <span className="text-xs">Suggestions intelligentes</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleCards.map((card, index) => (
              <Card
                key={index}
                hover
                onClick={() => handleExampleClick(card.prompt)}
                className="cursor-pointer group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative flex items-start gap-4 p-6">
                  {/* Icon with gradient */}
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-foreground transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {card.description}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white`}>
                      <Plus className="w-4 h-4 rotate-45" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>L'IA peut faire des erreurs. Vérifiez toujours les informations importantes.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AgentsContent />;
}
