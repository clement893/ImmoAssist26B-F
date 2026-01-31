/** * Content Preview Component * * Displays a preview of content (blog post, page, etc.) in a modal or page. * * @component */ 'use client';
import { Modal } from '@/components/ui';
import { SafeHTML } from '@/components/ui/SafeHTML';
export interface ContentPreviewProps {
  title: string;
  content: string;
  contentHtml?: string;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}
/** * Content Preview Component * * Displays content preview in a modal with proper formatting. */ export default function ContentPreview({
  title,
  content,
  contentHtml,
  isOpen,
  onClose,
  className,
}: ContentPreviewProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex justify-end">
          {' '}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground hover:text-foreground"
          >
            {' '}
            Close{' '}
          </button>{' '}
        </div>
      }
    >
      {' '}
      <div className={className}>
        {' '}
        {contentHtml ? (
          <SafeHTML html={contentHtml} className="prose prose-lg dark:prose-invert max-w-none" />
        ) : (
          <div className="prose prose-lg dark:prose-invert max-w-none whitespace-pre-wrap">
            {' '}
            {content}{' '}
          </div>
        )}{' '}
      </div>{' '}
    </Modal>
  );
}
