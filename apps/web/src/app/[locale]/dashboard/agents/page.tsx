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
  ArrowLeft
} from 'lucide-react';
import LeaChat from '@/components/lea/LeaChat';

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

function AgentsContent() {
  const { user } = useAuthStore();
  const [showChat, setShowChat] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);

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

  if (showChat) {
    return (
      <div className="w-full">
        {/* Back button */}
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowChat(false);
              setSelectedPrompt(null);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
        <div className="h-[calc(100vh-180px)] min-h-[600px] w-full">
          <LeaChat initialMessage={selectedPrompt || undefined} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Right Navigation */}
      <div className="flex items-center justify-end gap-4 mb-8 px-6 pt-6">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Search className="w-4 h-4 mr-2" />
          Rechercher dans les conversations
        </Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
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
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle conversation
        </Button>
      </div>

      {/* Main Content - Centered */}
      <div className="flex flex-col items-center justify-center px-6 pb-12 max-w-4xl mx-auto">
        {/* Large Green Sphere Icon */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 via-green-600 to-blue-600 flex items-center justify-center shadow-2xl shadow-green-500/50 animate-pulse">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-400 to-blue-500 opacity-20 blur-2xl animate-pulse" />
        </div>

        {/* Greeting */}
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Utilisateur'}
        </h1>
        
        {/* Question with gradient */}
        <h2 className="text-2xl md:text-3xl font-semibold mb-12">
          Qu'est-ce qui vous préoccupe{' '}
          <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
            aujourd'hui ?
          </span>
        </h2>

        {/* Large Input Field */}
        <div className="w-full mb-8">
          <div className="relative bg-background border-2 border-border rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              type="text"
              placeholder="Posez une question à l'IA ou faites une demande..."
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-lg outline-none pr-20"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setSelectedPrompt(e.currentTarget.value.trim());
                  setShowChat(true);
                }
              }}
              onFocus={(e) => {
                e.currentTarget.addEventListener('keydown', (ev: KeyboardEvent) => {
                  if (ev.key === 'Enter' && e.currentTarget.value.trim()) {
                    setSelectedPrompt(e.currentTarget.value.trim());
                    setShowChat(true);
                  }
                });
              }}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Citation"
              >
                <Quote className="w-5 h-5 text-green-500" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exampleCards.map((card, index) => (
              <Card
                key={index}
                hover
                onClick={() => handleExampleClick(card.prompt)}
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
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return <AgentsContent />;
}
