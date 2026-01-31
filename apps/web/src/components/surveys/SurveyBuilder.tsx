/**
 * Survey Builder Component
 *
 * Advanced survey/questionnaire builder with survey-specific features.
 * Extends CMSFormBuilder with survey-specific question types and logic.
 *
 * @component
 * @example
 * ```tsx
 * <SurveyBuilder
 *   survey={surveyData}
 *   onSave={async (survey) => {
 *     await surveysAPI.update(survey.id, survey);
 *   }}
 * />
 * ```
 *
 * @features
 * - Survey-specific question types (scale, matrix, ranking, NPS)
 * - Conditional logic (skip logic)
 * - Multiple pages/sections
 * - Progress bar
 * - Survey settings (public link, dates, limits)
 * - Question randomization
 *
 * @see {@link https://github.com/your-repo/docs/components/survey-builder} Component Documentation
 */
'use client';
import { useState, useCallback } from 'react';
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  Modal,
  Alert,
  DragDropList,
  type DragDropListItem,
  Switch,
  useToast,
} from '@/components/ui';
import { Plus, Save, Eye, Trash2, Settings, Copy } from 'lucide-react';
import { PageHeader, PageContainer } from '@/components/layout';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
export type SurveyQuestionType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'number'
  | 'date'
  | 'scale' // Échelle (1-5, 1-10, etc.)
  | 'matrix' // Matrice (questions multiples avec mêmes options)
  | 'ranking' // Classement
  | 'nps' // Net Promoter Score
  | 'rating' // Note étoiles
  | 'yesno'; // Oui/Non

export interface SurveyQuestion {
  id: string;
  type: SurveyQuestionType;
  label: string;
  description?: string;
  name: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  // Survey-specific options
  scaleMin?: number;
  scaleMax?: number;
  scaleStep?: number;
  scaleLabels?: { min?: string; max?: string };
  matrixRows?: string[]; // For matrix questions
  matrixColumns?: string[]; // For matrix questions
  // Conditional logic
  showIf?: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number;
  };
  // Page/Section
  page?: number;
}

export interface SurveySettings {
  allowAnonymous: boolean;
  requireAuth: boolean;
  limitOneResponse: boolean;
  limitOneResponsePerUser: boolean;
  startDate?: string;
  endDate?: string;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  publicLink?: string;
  publicLinkEnabled: boolean;
}

export interface Survey {
  id: string;
  name: string;
  description?: string;
  questions: SurveyQuestion[];
  settings: SurveySettings;
  submitButtonText?: string;
  successMessage?: string;
  status: 'draft' | 'published' | 'closed';
}

export interface SurveyBuilderProps {
  survey?: Survey;
  onSave?: (survey: Survey) => Promise<void>;
  onPublish?: (survey: Survey) => Promise<void>;
  onPreview?: (survey: Survey) => void;
  loading?: boolean;
  error?: string | null;
}

const questionTypes = [
  { label: 'Texte', value: 'text' },
  { label: 'Email', value: 'email' },
  { label: 'Zone de texte', value: 'textarea' },
  { label: 'Sélection', value: 'select' },
  { label: 'Case à cocher', value: 'checkbox' },
  { label: 'Bouton radio', value: 'radio' },
  { label: 'Nombre', value: 'number' },
  { label: 'Date', value: 'date' },
  { label: 'Échelle', value: 'scale' },
  { label: 'Matrice', value: 'matrix' },
  { label: 'Classement', value: 'ranking' },
  { label: 'NPS', value: 'nps' },
  { label: 'Note étoiles', value: 'rating' },
  { label: 'Oui/Non', value: 'yesno' },
];

export default function SurveyBuilder({
  survey,
  onSave,
  onPublish,
  onPreview,
  loading,
  error,
}: SurveyBuilderProps) {
  const t = useTranslations('SurveyBuilder');
  const { showToast } = useToast();
  const [currentSurvey, setCurrentSurvey] = useState<Survey>(
    survey || {
      id: `survey-${Date.now()}`,
      name: '',
      description: '',
      questions: [],
      settings: {
        allowAnonymous: true,
        requireAuth: false,
        limitOneResponse: false,
        limitOneResponsePerUser: true,
        showProgressBar: true,
        randomizeQuestions: false,
        publicLinkEnabled: false,
      },
      status: 'draft',
    }
  );
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleAddQuestion = useCallback(() => {
    const newQuestion: SurveyQuestion = {
      id: `q-${Date.now()}`,
      type: 'text',
      label: '',
      name: '',
      required: false,
      page: 1,
    };
    setEditingQuestion(newQuestion);
    setIsQuestionModalOpen(true);
  }, []);

  const handleEditQuestion = useCallback((question: SurveyQuestion) => {
    setEditingQuestion({ ...question });
    setIsQuestionModalOpen(true);
  }, []);

  const handleDeleteQuestion = useCallback(
    (questionId: string) => {
      setCurrentSurvey((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
    },
    []
  );

  const handleReorderQuestions = useCallback(
    (newOrder: DragDropListItem[]) => {
      const reorderedQuestions = newOrder.map(
        (item) => currentSurvey.questions.find((q) => q.id === item.id)!
      );
      setCurrentSurvey((prev) => ({
        ...prev,
        questions: reorderedQuestions,
      }));
    },
    [currentSurvey.questions]
  );

  const handleSaveQuestion = useCallback(() => {
    if (!editingQuestion || !editingQuestion.label || !editingQuestion.name) {
      showToast({
        message: t('errors.requiredFields') || 'Label and name are required',
        type: 'error',
      });
      return;
    }

    // Validate question-specific requirements
    if (
      (editingQuestion.type === 'select' ||
        editingQuestion.type === 'radio' ||
        editingQuestion.type === 'checkbox' ||
        editingQuestion.type === 'ranking') &&
      (!editingQuestion.options || editingQuestion.options.length === 0)
    ) {
      showToast({
        message: t('errors.optionsRequired') || 'Options are required for this question type',
        type: 'error',
      });
      return;
    }

    if (
      editingQuestion.type === 'matrix' &&
      (!editingQuestion.matrixRows ||
        editingQuestion.matrixRows.length === 0 ||
        !editingQuestion.matrixColumns ||
        editingQuestion.matrixColumns.length === 0)
    ) {
      showToast({
        message: t('errors.matrixRequired') || 'Matrix rows and columns are required',
        type: 'error',
      });
      return;
    }

    setCurrentSurvey((prev) => {
      const existingIndex = prev.questions.findIndex((q) => q.id === editingQuestion.id);
      if (existingIndex >= 0) {
        // Update existing question
        const updated = [...prev.questions];
        updated[existingIndex] = editingQuestion;
        return { ...prev, questions: updated };
      } else {
        // Add new question
        return { ...prev, questions: [...prev.questions, editingQuestion] };
      }
    });

    setIsQuestionModalOpen(false);
    setEditingQuestion(null);
  }, [editingQuestion, t, showToast]);

  const handleSave = useCallback(async () => {
    if (!currentSurvey.name) {
      showToast({
        message: t('errors.surveyNameRequired') || 'Survey name is required',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(currentSurvey);
      showToast({
        message: t('success.saved') || 'Survey saved successfully',
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to save survey', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: t('errors.saveFailed') || 'Failed to save survey',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  }, [currentSurvey, onSave, t, showToast]);

  const handlePublish = useCallback(async () => {
    if (!currentSurvey.name) {
      showToast({
        message: t('errors.surveyNameRequired') || 'Survey name is required',
        type: 'error',
      });
      return;
    }

    if (currentSurvey.questions.length === 0) {
      showToast({
        message: t('errors.noQuestions') || 'Add at least one question before publishing',
        type: 'error',
      });
      return;
    }

    setIsPublishing(true);
    try {
      const publishedSurvey = { ...currentSurvey, status: 'published' as const };
      await onPublish?.(publishedSurvey);
      setCurrentSurvey(publishedSurvey);
      showToast({
        message: t('success.published') || 'Survey published successfully',
        type: 'success',
      });
    } catch (error) {
      logger.error('Failed to publish survey', error instanceof Error ? error : new Error(String(error)));
      showToast({
        message: t('errors.publishFailed') || 'Failed to publish survey',
        type: 'error',
      });
    } finally {
      setIsPublishing(false);
    }
  }, [currentSurvey, onPublish, t, showToast]);

  const generatePublicLink = useCallback(() => {
    const link = `${window.location.origin}/surveys/${currentSurvey.id}`;
    setCurrentSurvey((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        publicLink: link,
        publicLinkEnabled: true,
      },
    }));
    navigator.clipboard.writeText(link);
    showToast({
      message: t('success.linkCopied') || 'Public link copied to clipboard',
      type: 'success',
    });
  }, [currentSurvey.id, t, showToast]);

  const getQuestionIcon = (type: SurveyQuestionType) => {
    switch (type) {
      case 'scale':
        return '📊';
      case 'matrix':
        return '📋';
      case 'ranking':
        return '🔢';
      case 'nps':
        return '⭐';
      case 'rating':
        return '🌟';
      case 'yesno':
        return '✅';
      default:
        return '📝';
    }
  };

  return (
    <PageContainer className="py-8">
      <PageHeader
        title={currentSurvey.name || t('new_survey') || 'New Survey'}
        description={t('build_surveys') || 'Create and manage surveys and questionnaires'}
        breadcrumbs={[
          { label: t('home') || 'Home', href: '/' },
          { label: t('surveys') || 'Surveys', href: '/surveys' },
          { label: currentSurvey.name || t('new_survey') || 'New Survey' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSettingsModalOpen(true)}
              disabled={loading || isSaving || isPublishing}
            >
              <Settings className="h-4 w-4 mr-2" /> {t('settings') || 'Settings'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onPreview?.(currentSurvey)}
              disabled={loading || isSaving || isPublishing}
            >
              <Eye className="h-4 w-4 mr-2" /> {t('preview') || 'Preview'}
            </Button>
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={loading || isSaving || isPublishing}
            >
              <Save className="h-4 w-4 mr-2" />{' '}
              {isSaving ? t('saving') || 'Saving...' : t('save_draft') || 'Save Draft'}
            </Button>
            <Button
              variant="primary"
              onClick={handlePublish}
              disabled={loading || isSaving || isPublishing || currentSurvey.status === 'published'}
            >
              {isPublishing ? t('publishing') || 'Publishing...' : t('publish') || 'Publish'}
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="error" title={t('error') || 'Error'} className="mb-4">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <Card title={t('survey_details') || 'Survey Details'}>
            <Input
              label={t('survey_name') || 'Survey Name'}
              value={currentSurvey.name}
              onChange={(e) => setCurrentSurvey({ ...currentSurvey, name: e.target.value })}
              placeholder={t('enter_survey_name') || 'Enter survey name'}
              className="mb-4"
            />
            <Textarea
              label={t('description') || 'Description'}
              value={currentSurvey.description || ''}
              onChange={(e) => setCurrentSurvey({ ...currentSurvey, description: e.target.value })}
              placeholder={t('enter_description') || 'Enter survey description'}
            />
          </Card>

          <Card
            title={t('questions') || 'Questions'}
            actions={
              <Button onClick={handleAddQuestion}>
                <Plus className="h-4 w-4 mr-2" /> {t('add_question') || 'Add Question'}
              </Button>
            }
          >
            {currentSurvey.questions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>{t('no_questions_yet') || 'No questions yet'}</p>
                <Button onClick={handleAddQuestion} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" /> {t('add_first_question') || 'Add First Question'}
                </Button>
              </div>
            ) : (
              <DragDropList
                items={currentSurvey.questions.map((question) => ({
                  id: question.id,
                  content: (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getQuestionIcon(question.type)}</span>
                        <span className="font-medium">
                          {question.label || t('untitled_question') || 'Untitled Question'}
                        </span>
                        <span className="text-sm text-muted-foreground capitalize">({question.type})</span>
                        {question.required && <span className="text-danger-500 text-xs ml-1">*</span>}
                        {question.showIf && (
                          <span
                            className="text-xs text-primary-500 dark:text-primary-400"
                            title={t('conditional') || 'Conditional'}
                          >
                            {' '}
                            🔗{' '}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditQuestion(question)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          color="danger"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ),
                }))}
                onReorder={handleReorderQuestions}
              />
            )}
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card title={t('survey_status') || 'Survey Status'}>
            <Select
              label={t('status') || 'Status'}
              value={currentSurvey.status}
              onChange={(e) =>
                setCurrentSurvey({ ...currentSurvey, status: e.target.value as Survey['status'] })
              }
              options={[
                { label: t('draft') || 'Draft', value: 'draft' },
                { label: t('published') || 'Published', value: 'published' },
                { label: t('closed') || 'Closed', value: 'closed' },
              ]}
              className="mb-4"
            />
            <div className="text-sm text-muted-foreground">
              <p>
                {t('questions_count') || 'Questions'}: {currentSurvey.questions.length}
              </p>
            </div>
          </Card>

          {currentSurvey.settings.publicLinkEnabled && currentSurvey.settings.publicLink && (
            <Card title={t('public_link') || 'Public Link'}>
              <div className="flex items-center gap-2 mb-2">
                <Input value={currentSurvey.settings.publicLink} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(currentSurvey.settings.publicLink!);
                    showToast({
                      message: t('link_copied') || 'Link copied',
                      type: 'success',
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Question Editor Modal */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => {
          setIsQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        title={
          editingQuestion?.id && currentSurvey.questions.find((q) => q.id === editingQuestion.id)
            ? t('edit_question') || 'Edit Question'
            : t('add_question') || 'Add Question'
        }
        size="lg"
      >
        {editingQuestion && (
          <div className="space-y-4">
            <Select
              label={t('question_type') || 'Question Type'}
              value={editingQuestion.type}
              onChange={(e) =>
                setEditingQuestion({ ...editingQuestion, type: e.target.value as SurveyQuestionType })
              }
              options={questionTypes}
            />
            <Input
              label={t('question_label') || 'Question Label'}
              value={editingQuestion.label}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, label: e.target.value })}
              placeholder={t('enter_question_label') || 'Enter question label'}
              required
            />
            <Input
              label={t('field_name') || 'Field Name'}
              value={editingQuestion.name}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, name: e.target.value })}
              placeholder={t('enter_field_name') || 'Enter field name (for data)'}
              required
              helperText={t('field_name_helper') || 'Used for data storage (e.g., satisfaction_score)'}
            />
            <Textarea
              label={t('description') || 'Description'}
              value={editingQuestion.description || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, description: e.target.value })}
              placeholder={t('optional_description') || 'Optional description or help text'}
            />

            {/* Scale-specific options */}
            {(editingQuestion.type === 'scale' ||
              editingQuestion.type === 'rating' ||
              editingQuestion.type === 'nps') && (
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={t('min_value') || 'Min'}
                  type="number"
                  value={editingQuestion.scaleMin || 1}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, scaleMin: parseInt(e.target.value) || 1 })
                  }
                />
                <Input
                  label={t('max_value') || 'Max'}
                  type="number"
                  value={editingQuestion.scaleMax || 5}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, scaleMax: parseInt(e.target.value) || 5 })
                  }
                />
                <Input
                  label={t('step') || 'Step'}
                  type="number"
                  value={editingQuestion.scaleStep || 1}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, scaleStep: parseInt(e.target.value) || 1 })
                  }
                />
              </div>
            )}

            {/* Matrix-specific options */}
            {editingQuestion.type === 'matrix' && (
              <div className="space-y-4">
                <Textarea
                  label={t('matrix_rows') || 'Matrix Rows (one per line)'}
                  value={editingQuestion.matrixRows?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      matrixRows: e.target.value.split('\n').filter((line) => line.trim()),
                    })
                  }
                  placeholder="Question 1\nQuestion 2\nQuestion 3"
                />
                <Textarea
                  label={t('matrix_columns') || 'Matrix Columns (one per line)'}
                  value={editingQuestion.matrixColumns?.join('\n') || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      matrixColumns: e.target.value.split('\n').filter((line) => line.trim()),
                    })
                  }
                  placeholder="Strongly Agree\nAgree\nNeutral\nDisagree\nStrongly Disagree"
                />
              </div>
            )}

            {/* Options for select/radio/checkbox/ranking */}
            {(editingQuestion.type === 'select' ||
              editingQuestion.type === 'radio' ||
              editingQuestion.type === 'checkbox' ||
              editingQuestion.type === 'ranking') && (
              <Textarea
                label={t('options') || 'Options'}
                value={(editingQuestion.options || []).map((opt) => `${opt.label}:${opt.value}`).join('\n')}
                onChange={(e) => {
                  const options = e.target.value
                    .split('\n')
                    .filter((line) => line.trim())
                    .map((line) => {
                      const [label, value] = line.split(':');
                      return {
                        label: label?.trim() || '',
                        value: (value || label)?.trim() || '',
                      };
                    });
                  setEditingQuestion({ ...editingQuestion, options });
                }}
                placeholder="Option 1:value1\nOption 2:value2"
                helperText={t('options_helper') || 'One option per line. Format: Label:Value'}
              />
            )}

            <Input
              label={t('placeholder') || 'Placeholder'}
              value={editingQuestion.placeholder || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, placeholder: e.target.value })}
              placeholder={t('optional_placeholder') || 'Optional placeholder text'}
            />

            <div className="flex items-center gap-4">
              <Switch
                label={t('required') || 'Required'}
                checked={editingQuestion.required || false}
                onChange={(e) => setEditingQuestion({ ...editingQuestion, required: e.target.checked })}
              />
            </div>

            {/* Conditional Logic */}
            {currentSurvey.questions.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">
                  {t('conditional_logic') || 'Conditional Logic (Show if)'}
                </h4>
                <div className="space-y-2">
                  <Select
                    label={t('show_if_question') || 'Show if question'}
                    value={editingQuestion.showIf?.questionId || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        showIf: e.target.value
                          ? {
                              questionId: e.target.value,
                              operator: (editingQuestion.showIf?.operator || 'equals') as
                                | 'equals'
                                | 'not_equals'
                                | 'contains'
                                | 'greater_than'
                                | 'less_than',
                              value: editingQuestion.showIf?.value || '',
                            }
                          : undefined,
                      })
                    }
                    options={[
                      { label: t('none') || 'None (always show)', value: '' },
                      ...currentSurvey.questions
                        .filter((q) => q.id !== editingQuestion.id)
                        .map((q) => ({ label: q.label || q.name, value: q.id })),
                    ]}
                  />
                  {editingQuestion.showIf && (
                    <>
                      <Select
                        label={t('operator') || 'Operator'}
                        value={editingQuestion.showIf?.operator || 'equals'}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            showIf: editingQuestion.showIf
                              ? {
                                  ...editingQuestion.showIf,
                                  operator: e.target.value as
                                    | 'equals'
                                    | 'not_equals'
                                    | 'contains'
                                    | 'greater_than'
                                    | 'less_than',
                                }
                              : undefined,
                          })
                        }
                        options={[
                          { label: t('equals') || 'Equals', value: 'equals' },
                          { label: t('not_equals') || 'Not equals', value: 'not_equals' },
                          { label: t('contains') || 'Contains', value: 'contains' },
                          { label: t('greater_than') || 'Greater than', value: 'greater_than' },
                          { label: t('less_than') || 'Less than', value: 'less_than' },
                        ]}
                      />
                      <Input
                        label={t('value') || 'Value'}
                        value={String(editingQuestion.showIf.value || '')}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            showIf: editingQuestion.showIf
                              ? {
                                  ...editingQuestion.showIf,
                                  value: e.target.value,
                                }
                              : undefined,
                          })
                        }
                        placeholder={t('enter_value') || 'Enter value'}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setIsQuestionModalOpen(false);
              setEditingQuestion(null);
            }}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleSaveQuestion}>{t('save_question') || 'Save Question'}</Button>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        title={t('survey_settings') || 'Survey Settings'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">{t('access_settings') || 'Access Settings'}</h4>
            <Switch
              label={t('allow_anonymous') || 'Allow Anonymous Responses'}
              checked={currentSurvey.settings.allowAnonymous}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, allowAnonymous: e.target.checked },
                })
              }
            />
            <Switch
              label={t('require_auth') || 'Require Authentication'}
              checked={currentSurvey.settings.requireAuth}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, requireAuth: e.target.checked },
                })
              }
            />
            <Switch
              label={t('limit_one_response') || 'Limit to One Response Total'}
              checked={currentSurvey.settings.limitOneResponse}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, limitOneResponse: e.target.checked },
                })
              }
            />
            <Switch
              label={t('limit_one_per_user') || 'Limit to One Response Per User'}
              checked={currentSurvey.settings.limitOneResponsePerUser}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, limitOneResponsePerUser: e.target.checked },
                })
              }
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">{t('public_link') || 'Public Link'}</h4>
            <Switch
              label={t('enable_public_link') || 'Enable Public Link'}
              checked={currentSurvey.settings.publicLinkEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked && !currentSurvey.settings.publicLink) {
                  generatePublicLink();
                } else {
                  setCurrentSurvey({
                    ...currentSurvey,
                    settings: { ...currentSurvey.settings, publicLinkEnabled: checked },
                  });
                }
              }}
            />
            {currentSurvey.settings.publicLinkEnabled && (
              <div className="flex items-center gap-2">
                <Input value={currentSurvey.settings.publicLink || ''} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentSurvey.settings.publicLink) {
                      navigator.clipboard.writeText(currentSurvey.settings.publicLink);
                      showToast({
                        message: t('link_copied') || 'Link copied',
                        type: 'success',
                      });
                    } else {
                      generatePublicLink();
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">{t('dates') || 'Dates'}</h4>
            <Input
              label={t('start_date') || 'Start Date'}
              type="datetime-local"
              value={currentSurvey.settings.startDate || ''}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, startDate: e.target.value },
                })
              }
            />
            <Input
              label={t('end_date') || 'End Date'}
              type="datetime-local"
              value={currentSurvey.settings.endDate || ''}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, endDate: e.target.value },
                })
              }
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">{t('display_options') || 'Display Options'}</h4>
            <Switch
              label={t('show_progress_bar') || 'Show Progress Bar'}
              checked={currentSurvey.settings.showProgressBar}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, showProgressBar: e.target.checked },
                })
              }
            />
            <Switch
              label={t('randomize_questions') || 'Randomize Questions'}
              checked={currentSurvey.settings.randomizeQuestions}
              onChange={(e) =>
                setCurrentSurvey({
                  ...currentSurvey,
                  settings: { ...currentSurvey.settings, randomizeQuestions: e.target.checked },
                })
              }
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <h4 className="text-sm font-semibold">{t('messages') || 'Messages'}</h4>
            <Input
              label={t('submit_button_text') || 'Submit Button Text'}
              value={currentSurvey.submitButtonText || 'Submit'}
              onChange={(e) => setCurrentSurvey({ ...currentSurvey, submitButtonText: e.target.value })}
            />
            <Textarea
              label={t('success_message') || 'Success Message'}
              value={currentSurvey.successMessage || ''}
              onChange={(e) => setCurrentSurvey({ ...currentSurvey, successMessage: e.target.value })}
              placeholder={t('success_message_placeholder') || 'Thank you for your response!'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)}>
            {t('close') || 'Close'}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
