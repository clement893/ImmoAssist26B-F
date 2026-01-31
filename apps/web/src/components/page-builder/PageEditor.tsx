/** * Page Editor Component * * Visual page builder with drag-and-drop sections. * * @component */ 'use client';
import { useState } from 'react';
import { Card, Button, Input, Select, Badge, Alert } from '@/components/ui';
import { DragDropList } from '@/components/ui';
import type { DragDropListItem } from '@/components/ui';
import { Plus, Save, Eye, Trash2, Settings } from 'lucide-react';
export interface PageSection {
  id: string;
  type: 'hero' | 'content' | 'features' | 'testimonials' | 'cta' | 'custom';
  title?: string;
  content?: string;
  config?: Record<string, unknown>;
}
export interface PageEditorProps {
  initialSections?: PageSection[];
  onSave?: (sections: PageSection[]) => Promise<void>;
  onPreview?: () => void;
  className?: string;
}
/** * Page Editor Component * * Visual page builder with drag-and-drop functionality. */ export default function PageEditor({
  initialSections = [],
  onSave,
  onPreview,
  className,
}: PageEditorProps) {
  const [sections, setSections] = useState<PageSection[]>(initialSections);
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handleReorder = (newOrder: DragDropListItem[]) => {
    const reorderedSections = newOrder.map((item) => sections.find((s) => s.id === item.id)!);
    setSections(reorderedSections);
  };
  const handleAddSection = (type: PageSection['type']) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      title: '',
      content: '',
      config: {},
    };
    setSections([...sections, newSection]);
    setSelectedSection(newSection);
  };
  const handleDeleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
    if (selectedSection?.id === id) {
      setSelectedSection(null);
    }
  };
  const handleUpdateSection = (id: string, updates: Partial<PageSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    if (selectedSection?.id === id) {
      setSelectedSection({ ...selectedSection, ...updates });
    }
  };
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (onSave) {
        await onSave(sections);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };
  const dragDropItems: DragDropListItem[] = sections.map((section) => ({
    id: section.id,
    content: (
      <div className="flex items-center justify-between w-full">
        {' '}
        <div className="flex items-center gap-3">
          {' '}
          <Badge variant="default">{section.type}</Badge>{' '}
          <span className="text-sm text-foreground">
            {' '}
            {section.title || `Section ${section.type}`}{' '}
          </span>{' '}
        </div>{' '}
        <div className="flex items-center gap-2">
          {' '}
          <Button variant="ghost" size="sm" onClick={() => setSelectedSection(section)}>
            {' '}
            <Settings className="w-4 h-4" />{' '}
          </Button>{' '}
          <Button variant="ghost" size="sm" onClick={() => handleDeleteSection(section.id)}>
            {' '}
            <Trash2 className="w-4 h-4" />{' '}
          </Button>{' '}
        </div>{' '}
      </div>
    ),
  }));
  return (
    <div className={className}>
      {' '}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {' '}
        {/* Main Editor */}{' '}
        <div className="lg:col-span-2 space-y-4">
          {' '}
          <Card title="Page Sections">
            {' '}
            {error && (
              <div className="mb-4">
                {' '}
                <Alert variant="error" onClose={() => setError(null)}>
                  {' '}
                  {error}{' '}
                </Alert>{' '}
              </div>
            )}{' '}
            <div className="mb-4">
              {' '}
              <div className="flex gap-2 flex-wrap">
                {' '}
                <Button variant="outline" size="sm" onClick={() => handleAddSection('hero')}>
                  {' '}
                  <Plus className="w-4 h-4 mr-2" /> Hero{' '}
                </Button>{' '}
                <Button variant="outline" size="sm" onClick={() => handleAddSection('content')}>
                  {' '}
                  <Plus className="w-4 h-4 mr-2" /> Content{' '}
                </Button>{' '}
                <Button variant="outline" size="sm" onClick={() => handleAddSection('features')}>
                  {' '}
                  <Plus className="w-4 h-4 mr-2" /> Features{' '}
                </Button>{' '}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSection('testimonials')}
                >
                  {' '}
                  <Plus className="w-4 h-4 mr-2" /> Testimonials{' '}
                </Button>{' '}
                <Button variant="outline" size="sm" onClick={() => handleAddSection('cta')}>
                  {' '}
                  <Plus className="w-4 h-4 mr-2" /> CTA{' '}
                </Button>{' '}
              </div>{' '}
            </div>{' '}
            {sections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {' '}
                <p>No sections yet. Add a section to get started.</p>{' '}
              </div>
            ) : (
              <DragDropList items={dragDropItems} onReorder={handleReorder} />
            )}{' '}
          </Card>{' '}
          {/* Section Preview */}{' '}
          {selectedSection && (
            <Card title={`Edit ${selectedSection.type} Section`}>
              {' '}
              <div className="space-y-4">
                {' '}
                <div>
                  {' '}
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {' '}
                    Title{' '}
                  </label>{' '}
                  <Input
                    value={selectedSection.title || ''}
                    onChange={(e) =>
                      handleUpdateSection(selectedSection.id, { title: e.target.value })
                    }
                    placeholder="Section title"
                  />{' '}
                </div>{' '}
                <div>
                  {' '}
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {' '}
                    Content{' '}
                  </label>{' '}
                  <textarea
                    value={selectedSection.content || ''}
                    onChange={(e) =>
                      handleUpdateSection(selectedSection.id, { content: e.target.value })
                    }
                    placeholder="Section content"
                    rows={6}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />{' '}
                </div>{' '}
              </div>{' '}
            </Card>
          )}{' '}
        </div>{' '}
        {/* Sidebar */}{' '}
        <div className="space-y-4">
          {' '}
          <Card title="Actions">
            {' '}
            <div className="space-y-2">
              {' '}
              <Button variant="primary" onClick={handleSave} disabled={isSaving} className="w-full">
                {' '}
                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Page'}{' '}
              </Button>{' '}
              {onPreview && (
                <Button variant="outline" onClick={onPreview} className="w-full">
                  {' '}
                  <Eye className="w-4 h-4 mr-2" /> Preview{' '}
                </Button>
              )}{' '}
            </div>{' '}
          </Card>{' '}
          <Card title="Page Info">
            {' '}
            <div className="space-y-4">
              {' '}
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground mb-2">
                  {' '}
                  Page Title{' '}
                </label>{' '}
                <Input placeholder="Page title" />{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground mb-2">
                  {' '}
                  Slug{' '}
                </label>{' '}
                <Input placeholder="page-slug" />{' '}
              </div>{' '}
              <div>
                {' '}
                <label className="block text-sm font-medium text-foreground mb-2">
                  {' '}
                  Status{' '}
                </label>{' '}
                <Select
                  options={[
                    { label: 'Draft', value: 'draft' },
                    { label: 'Published', value: 'published' },
                    { label: 'Archived', value: 'archived' },
                  ]}
                  value="draft"
                />{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
        </div>{' '}
      </div>{' '}
    </div>
  );
}
