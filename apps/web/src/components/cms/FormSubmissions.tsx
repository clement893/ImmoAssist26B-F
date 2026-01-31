/**
 * Form Submissions Component
 *
 * Displays and manages form submissions.
 *
 * @component
 */
'use client';

import { useState } from 'react';
import { Card, DataTable, Button, Modal } from '@/components/ui';
import type { Column } from '@/components/ui/DataTable';
import { Eye, Download, Trash2 } from 'lucide-react';

export interface FormSubmission extends Record<string, unknown> {
  id: number;
  form_id: number;
  form_name: string;
  data: Record<string, unknown>;
  submitted_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface FormSubmissionsProps {
  submissions?: FormSubmission[];
  onView?: (submission: FormSubmission) => void;
  onDelete?: (id: number) => Promise<void>;
  onExport?: () => void;
  className?: string;
}

/**
 * Form Submissions Component
 *
 * Displays form submissions in a DataTable.
 */
export default function FormSubmissions({
  submissions = [],
  onView,
  onDelete,
  onExport,
  className,
}: FormSubmissionsProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleView = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setIsViewModalOpen(true);
    if (onView) {
      onView(submission);
    }
  };

  const columns: Column<FormSubmission>[] = [
    {
      key: 'form_name',
      label: 'Form',
      sortable: true,
      render: (_value: unknown, submission: FormSubmission) => (
        <span className="font-medium text-foreground">{submission.form_name}</span>
      ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      sortable: true,
      render: (_value: unknown, submission: FormSubmission) => (
        <span className="text-sm text-muted-foreground">
          {new Date(submission.submitted_at).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'data',
      label: 'Data Preview',
      render: (_value: unknown, submission: FormSubmission) => {
        const dataKeys = Object.keys(submission.data || {});
        return (
          <span className="text-sm text-muted-foreground">
            {dataKeys.length} field{dataKeys.length !== 1 ? 's' : ''}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_value: unknown, submission: FormSubmission) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleView(submission)} title="View">
            <Eye className="w-4 h-4" />
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(submission.id)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={className}>
      <Card title="Form Submissions">
        {onExport && (
          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}

        <DataTable
          data={submissions}
          columns={columns}
          pageSize={10}
          searchable
          searchPlaceholder="Search submissions..."
        />
      </Card>

      {/* View Submission Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedSubmission(null);
        }}
        title={selectedSubmission ? `Submission #${selectedSubmission.id}` : 'View Submission'}
        size="lg"
      >
        {selectedSubmission && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Form</h3>
              <p className="text-foreground">{selectedSubmission.form_name}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Submitted At</h3>
              <p className="text-foreground">
                {new Date(selectedSubmission.submitted_at).toLocaleString()}
              </p>
            </div>

            {selectedSubmission.data && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Submission Data</h3>
                <div className="space-y-2">
                  {Object.entries(selectedSubmission.data).map(([key, value]) => (
                    <div key={key} className="border border-border rounded-lg p-3">
                      <div className="text-xs font-medium text-muted-foreground mb-1">{key}</div>
                      <div className="text-sm text-foreground">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedSubmission.ip_address && (
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">IP Address</h3>
                <p className="text-foreground">{selectedSubmission.ip_address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
