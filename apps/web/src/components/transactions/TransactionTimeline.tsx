'use client';

import { Card } from '@/components/ui';
import { getActionHistory } from '@/lib/api/transaction-actions';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, User, Loader2, AlertCircle } from 'lucide-react';

function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `il y a ${diffInSeconds} seconde${diffInSeconds > 1 ? 's' : ''}`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `il y a ${diffInMonths} mois`;
  }
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
}

interface TransactionTimelineProps {
  transactionId: number;
}

export default function TransactionTimeline({ transactionId }: TransactionTimelineProps) {
  const { data: history, isLoading, error } = useQuery({
    queryKey: ['transaction-action-history', transactionId],
    queryFn: () => getActionHistory(transactionId),
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Erreur lors du chargement de l'historique</p>
        </div>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center py-8">Aucune action effectuée</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Historique des actions</h3>
      
      <div className="space-y-4">
        {history.map((completion, index) => (
          <div key={completion.id} className="flex gap-4">
            {/* Ligne verticale */}
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              {index < history.length - 1 && (
                <div className="w-0.5 h-full bg-border mt-2" />
              )}
            </div>

            {/* Contenu */}
            <div className="flex-1 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{completion.action_name || completion.action_code}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {completion.previous_status} → {completion.new_status}
                  </p>
                  {completion.notes && (
                    <p className="text-sm mt-2 p-2 bg-muted rounded">
                      {completion.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(completion.completed_at))}
                </span>
              </div>
              
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{completion.completed_by_name || `Utilisateur #${completion.completed_by}`}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
