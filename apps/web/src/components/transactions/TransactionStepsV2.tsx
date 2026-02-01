'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Home,
  Users,
  MessageSquare,
  Sparkles,
  Bell,
  Info,
} from 'lucide-react';
import { transactionStepsAPI } from '@/lib/api/transaction-steps-adapters';
import type {
  Step,
  StepAction,
  StepReminder,
  TransactionStepsTransaction,
} from '@/lib/api/transaction-steps-adapters';

interface TransactionStepsV2Props {
  transactionId: number | null;
  onError?: (message: string) => void;
  /** When true, hide the page header (for use inside transaction detail tab) */
  embedded?: boolean;
}

export default function TransactionStepsV2({
  transactionId,
  onError,
  embedded = false,
}: TransactionStepsV2Props) {
  const [selectedView, setSelectedView] = useState<'acheteur' | 'vendeur'>('acheteur');
  const [showLeaPanel, setShowLeaPanel] = useState(false);
  const [selectedAction, setSelectedAction] = useState<StepAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    transaction: TransactionStepsTransaction;
    buyer_steps: Step[];
    vendor_steps: Step[];
  } | null>(null);
  const [togglingAction, setTogglingAction] = useState<string | null>(null);
  const [togglingStep, setTogglingStep] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchSteps = useCallback(async () => {
    if (!transactionId) {
      setData(null);
      setFetchError(null);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const result = await transactionStepsAPI.getSteps(transactionId);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setFetchError(msg);
      onError?.(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [transactionId, onError]);

  useEffect(() => {
    fetchSteps();
  }, [fetchSteps]);

  const handleActionToggle = async (action: StepAction) => {
    if (!transactionId || !data) return;
    setTogglingAction(action.code);
    try {
      await transactionStepsAPI.completeAction(
        transactionId,
        action.code,
        !action.completed
      );
      await fetchSteps();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setTogglingAction(null);
    }
  };

  const handleStepToggle = async (step: Step) => {
    if (!transactionId || !data) return;
    setTogglingStep(step.code);
    try {
      await transactionStepsAPI.completeStep(
        transactionId,
        step.code,
        step.status !== 'completed'
      );
      await fetchSteps();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'étape');
    } finally {
      setTogglingStep(null);
    }
  };

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

  const getPriorityColor = (priority: StepReminder['priority']) => {
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
    return date.toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount);
  };

  if (!transactionId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl">
        <p className="text-gray-500">Sélectionnez une transaction pour voir ses étapes</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 rounded-2xl">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6">
        <p className="text-red-600 text-center">
          {fetchError || 'Impossible de charger les étapes'}
        </p>
        {fetchError && (
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            La transaction n’existe peut-être pas ou vous n’y avez pas accès. Choisissez une transaction dans la liste ci-dessus.
          </p>
        )}
        <button
          type="button"
          onClick={() => fetchSteps()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { transaction, buyer_steps, vendor_steps } = data;
  const steps = selectedView === 'acheteur' ? buyer_steps : vendor_steps;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-gray-50'}>
      {!embedded && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Étapes de transaction
                </h1>
                <p className="text-gray-600 mt-1">
                  Guidé par Léa, votre assistante AI
                </p>
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
      )}

      <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {/* Transaction Overview */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Home className="w-6 h-6 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {transaction.name}
                </h2>
              </div>
              <p className="text-gray-600 ml-9">{transaction.address}</p>
              <div className="flex items-center gap-6 mt-4 ml-9 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Acheteur:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.buyer}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Vendeur:</span>
                  <span className="font-medium text-gray-900">
                    {transaction.seller}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {transaction.price != null
                  ? formatCurrency(transaction.price)
                  : '-'}
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                {transaction.status}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progression globale
              </span>
              <span className="text-sm text-gray-600">
                {transaction.progress}%
              </span>
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
            <span className="text-sm font-medium text-gray-700">
              Point de vue:
            </span>
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
          <div className="lg:col-span-2 space-y-4">
            {steps.map((step) => (
              <div
                key={step.code}
                className={`bg-white rounded-2xl shadow-sm border transition-all ${
                  step.status === 'current'
                    ? 'border-blue-300 ring-2 ring-blue-100'
                    : 'border-gray-100'
                }`}
              >
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {step.title}
                        </h3>
                        {step.status === 'current' && (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
                            En cours
                          </span>
                        )}
                        {step.status === 'completed' && (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200">
                            Complétée
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="checkbox"
                          checked={step.status === 'completed'}
                          onChange={() => handleStepToggle(step)}
                          disabled={togglingStep === step.code}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                          title={step.status === 'completed' ? 'Marquer comme non complétée' : 'Marquer comme complétée'}
                        />
                        <label 
                          onClick={() => handleStepToggle(step)}
                          className="text-sm text-gray-600 cursor-pointer select-none"
                        >
                          {step.status === 'completed' ? 'Marquer comme non complétée' : 'Marquer comme complétée'}
                        </label>
                      </div>
                      <p className="text-gray-600 text-sm">{step.description}</p>
                      {step.due_date && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Date limite: {formatDate(step.due_date)}
                          </span>
                        </div>
                      )}
                      {step.completed_date && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            Complété le {formatDate(step.completed_date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {step.actions.length > 0 && (
                  <div className="p-6 space-y-3">
                    {step.actions.map((action) => (
                      <div
                        key={action.code}
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
                            onChange={() => handleActionToggle(action)}
                            disabled={togglingAction === action.code}
                            className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4
                                className={`font-medium ${
                                  action.completed
                                    ? 'text-gray-500 line-through'
                                    : 'text-gray-900'
                                }`}
                              >
                                {action.title}
                              </h4>
                              {action.required && (
                                <span className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium border border-red-200">
                                  Requis
                                </span>
                              )}
                            </div>
                            <p
                              className={`text-sm ${
                                action.completed
                                  ? 'text-gray-400'
                                  : 'text-gray-600'
                              }`}
                            >
                              {action.description}
                            </p>
                            {action.due_date && !action.completed && (
                              <div className="flex items-center gap-2 mt-2 text-sm text-orange-600">
                                <Clock className="w-4 h-4" />
                                <span>
                                  À faire avant le {formatDate(action.due_date)}
                                </span>
                              </div>
                            )}
                            {action.documents?.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  Documents: {action.documents.join(', ')}
                                </span>
                              </div>
                            )}
                            {action.lea_guidance && !action.completed && (
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

          <div className="space-y-6">
            {/* Reminders */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Rappels
                </h3>
              </div>
              <div className="space-y-3">
                {steps
                  .flatMap((s) =>
                    s.reminders.map((r) => ({
                      ...r,
                      dueDate: r.due_date,
                    }))
                  )
                  .sort(
                    (a, b) =>
                      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                  )
                  .map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`p-3 rounded-lg border ${getPriorityColor(
                        reminder.priority
                      )}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{reminder.title}</p>
                          <p className="text-xs mt-1">
                            {formatDate(reminder.dueDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                {steps.flatMap((s) => s.reminders).length === 0 && (
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
                    <p className="text-sm text-gray-600">
                      Votre assistante AI
                    </p>
                  </div>
                </div>
                {selectedAction?.lea_guidance ? (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-medium text-gray-900">
                        {selectedAction.title}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {selectedAction.lea_guidance}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      Bonjour ! Je suis Léa, votre assistante AI. Je suis là
                      pour vous guider à travers chaque étape de votre
                      transaction immobilière. Cliquez sur &quot;Demander conseil à
                      Léa&quot; sur n&apos;importe quelle action pour obtenir de
                      l&apos;aide.
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Étapes complétées
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {steps.filter((s) => s.status === 'completed').length} /{' '}
                    {steps.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Actions restantes
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {
                      steps
                        .flatMap((s) => s.actions)
                        .filter((a) => !a.completed).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Documents requis
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {
                      steps
                        .flatMap((s) => s.actions)
                        .flatMap((a) => a.documents || []).length
                    }
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
