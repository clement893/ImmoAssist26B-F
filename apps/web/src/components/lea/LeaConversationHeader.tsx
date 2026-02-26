'use client';

import { Sparkles, Volume2, VolumeX, Trash2, X, Square } from 'lucide-react';
import Button from '@/components/ui/Button';

interface LeaConversationHeaderProps {
  onToggleSound: () => void;
  onClear: () => void;
  onClose?: () => void;
  soundEnabled: boolean;
  soundSupported: boolean;
  isSpeaking?: boolean;
  onStopSpeaking?: () => void;
}

export default function LeaConversationHeader({
  onToggleSound,
  onClear,
  onClose,
  soundEnabled,
  soundSupported,
  isSpeaking = false,
  onStopSpeaking,
}: LeaConversationHeaderProps) {
  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Avatar and name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center shadow-standard-lg"> {/* UI Revamp - shadow-standard-lg */}
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Léa</h3>
              <p className="text-xs text-muted-foreground">Assistante AI Immobilière</p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Bouton d'arrêt de la lecture - visible uniquement quand Léa parle */}
            {soundSupported && isSpeaking && onStopSpeaking && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onStopSpeaking}
                title="Arrêter la lecture"
                className="text-red-600 dark:text-red-400 animate-pulse"
              >
                <Square className="w-4 h-4 mr-2" />
                Arrêter
              </Button>
            )}
            {soundSupported && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSound}
                title={soundEnabled ? 'Désactiver la lecture automatique' : 'Activer la lecture automatique'}
                className={soundEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}
                disabled={isSpeaking}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 mr-2" />
                ) : (
                  <VolumeX className="w-4 h-4 mr-2" />
                )}
                {soundEnabled ? 'Léa parle' : 'Son désactivé'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              title="Effacer l'historique"
              className="text-muted-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Effacer
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                title="Fermer"
                className="text-muted-foreground"
              >
                <X className="w-4 h-4 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
