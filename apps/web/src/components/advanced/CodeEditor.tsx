/** * Code Editor Component * Code editor with syntax highlighting support */ 'use client';
import { useState } from 'react';
import { clsx } from 'clsx';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import type { SelectOption } from '@/components/ui/Select';
import { Code, Copy, Download, Save } from 'lucide-react';
import { logger } from '@/lib/logger';
export interface CodeEditorProps {
  language?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}
const languageOptions: SelectOption[] = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'JSON', value: 'json' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'SQL', value: 'sql' },
];
export default function CodeEditor({
  language = 'javascript',
  value = '',
  onChange,
  onSave,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const [code, setCode] = useState(value);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [copied, setCopied] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCode(newValue);
    onChange?.(newValue);
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      logger.info('Code copied to clipboard');
    } catch (error) {
      logger.error(
        'Failed to copy code',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  };
  const handleSave = async () => {
    if (onSave) {
      await onSave(code);
    }
  };
  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${selectedLanguage === 'javascript' ? 'js' : selectedLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <Card className={clsx('bg-background', className)}>
      {' '}
      <div className="space-y-4">
        {' '}
        {/* Toolbar */}{' '}
        <div className="flex items-center justify-between">
          {' '}
          <div className="flex items-center gap-2">
            {' '}
            <Code className="w-5 h-5 text-primary-600 dark:text-primary-400" />{' '}
            <h3 className="text-lg font-semibold text-foreground"> Code Editor </h3>{' '}
          </div>{' '}
          <div className="flex items-center gap-2">
            {' '}
            {!readOnly && (
              <Select
                options={languageOptions}
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-40"
              />
            )}{' '}
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                {copied ? <Save className="w-4 h-4" /> : <Copy className="w-4 h-4" />}{' '}
                {copied ? 'Copied!' : 'Copy'}{' '}
              </span>{' '}
            </Button>{' '}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              {' '}
              <span className="flex items-center gap-2">
                {' '}
                <Download className="w-4 h-4" /> Download{' '}
              </span>{' '}
            </Button>{' '}
            {onSave && !readOnly && (
              <Button variant="primary" size="sm" onClick={handleSave}>
                {' '}
                <span className="flex items-center gap-2">
                  {' '}
                  <Save className="w-4 h-4" /> Save{' '}
                </span>{' '}
              </Button>
            )}{' '}
          </div>{' '}
        </div>{' '}
        {/* Editor */}{' '}
        <div className="relative">
          {' '}
          <textarea
            value={code}
            onChange={handleChange}
            readOnly={readOnly}
            placeholder="Enter your code here..."
            className={clsx(
              'w-full h-96 p-4 font-mono text-sm border rounded-lg',
              'bg-muted',
              'text-muted-foreground',
              'border-border',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400',
              'resize-none',
              readOnly && 'cursor-not-allowed opacity-75'
            )}
            style={{
              fontFamily: 'Monaco, Menlo,"Ubuntu Mono", Consolas,"source-code-pro", monospace',
            }}
          />{' '}
          {readOnly && (
            <div className="absolute top-2 right-2">
              {' '}
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {' '}
                Read Only{' '}
              </span>{' '}
            </div>
          )}{' '}
        </div>{' '}
        {/* Info */}{' '}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {' '}
          <div>
            {' '}
            Language: <span className="font-medium">{selectedLanguage}</span>{' '}
          </div>{' '}
          <div>
            {' '}
            {code.length} characters • {code.split('\n').length} lines{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </Card>
  );
}
