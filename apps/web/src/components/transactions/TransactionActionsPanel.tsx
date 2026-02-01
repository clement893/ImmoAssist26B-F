'use client';

import { useState } from 'react';
import { Card, Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { getAvailableActions, executeAction, TransactionAction, ExecuteActionRequest } from '@/lib/api/transaction-actions';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast';

interface TransactionActionsPanelProps {
  transactionId: number;
  onActionComplete?: () => void;
}

export default function TransactionActionsPanel({ transactionId, onActionComplete }: TransactionActionsPanelProps) {
  const [selectedAction, setSelectedAction] = useState<TransactionAction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useToast();

  const { data: actions, isLoading, error } = useQuery({
    queryKey: ['transaction-actions', transactionId],
    queryFn: () => getAvailableActions(transactionId),
  });

  const executeMutation = useMutation({
    mutationFn: (request: ExecuteActionRequest) => executeAction(transactionId, request),
    onSuccess: () => {
      showSuccess('Action exécutée avec succès');
      setIsDialogOpen(false);
      setNotes('');
      setSelectedAction(null);
      queryClient.invalidateQueries({ queryKey: ['transaction', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-actions', transactionId] });
      queryClient.invalidateQueries({ queryKey: ['transaction-action-history', transactionId] });
      onActionComplete?.();
    },
    onError: (error: any) => {
      showError(error?.response?.data?.detail || 'Erreur lors de l\'exécution de l\'action');
    },
  });

  const handleExecute = () => {
    if (!selectedAction) return;

    const request: ExecuteActionRequest = {
      action_code: selectedAction.code,
      notes: notes.trim() || undefined,
    };

    executeMutation.mutate(request);
  };

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
          <p>Erreur lors du chargement des actions</p>
        </div>
      </Card>
    );
  }

  if (!actions || actions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <CheckCircle2 className="h-5 w-5" />
          <p>Aucune action disponible pour le moment</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Actions disponibles</h3>
        
        <div className="space-y-3">
          {actions.map((action) => (
            <div
              key={action.code}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition cursor-pointer"
              onClick={() => {
                setSelectedAction(action);
                setIsDialogOpen(true);
              }}
            >
              <div className="flex-1">
                <h4 className="font-medium">{action.name}</h4>
                {action.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {action.description}
                  </p>
                )}
                
                {action.creates_deadline && action.deadline_days && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 dark:text-orange-400">
                    <Clock className="h-3 w-3" />
                    <span>Crée un délai de {action.deadline_days} jours</span>
                  </div>
                )}

                {action.required_fields && action.required_fields.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Champs requis: {action.required_fields.join(', ')}
                  </div>
                )}
              </div>
              
              <Button
                variant="default"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedAction(action);
                  setIsDialogOpen(true);
                }}
              >
                Exécuter
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal de confirmation */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setNotes('');
          setSelectedAction(null);
        }}
        title={selectedAction?.name}
        size="lg"
      >
        {selectedAction?.description && (
          <p className="text-sm text-muted-foreground mb-4">{selectedAction.description}</p>
        )}
        
        <div className="space-y-4">
            {selectedAction?.required_fields && selectedAction.required_fields.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                      Champs requis
                    </p>
                    <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                      {selectedAction.required_fields.map((field) => (
                        <li key={field}>{field}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selectedAction?.required_documents && selectedAction.required_documents.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Documents requis
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 list-disc list-inside">
                      {selectedAction.required_documents.map((doc) => (
                        <li key={doc}>{doc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notes (optionnel)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette action..."
                className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setNotes('');
                  setSelectedAction(null);
                }}
                disabled={executeMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleExecute}
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    En cours...
                  </>
                ) : (
                  'Confirmer'
                )}
              </Button>
            </div>
          </div>
      </Modal>
    </>
  );
}
