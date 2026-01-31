'use client';

/**
 * ThemeTabs Component
 * Manages tabs for theme editor (Form, JSON, Preview)
 */

import { FileText, Code, Eye, Type } from 'lucide-react';

export type ThemeTab = 'form' | 'json' | 'preview' | 'fonts';

interface ThemeTabsProps {
  activeTab: ThemeTab;
  onTabChange: (tab: ThemeTab) => void;
}

export function ThemeTabs({ activeTab, onTabChange }: ThemeTabsProps) {
  const tabs: { id: ThemeTab; label: string; icon: React.ReactNode }[] = [
    { id: 'form', label: 'Formulaire', icon: <FileText className="w-4 h-4" /> },
    { id: 'json', label: 'JSON', icon: <Code className="w-4 h-4" /> },
    { id: 'fonts', label: 'Polices', icon: <Type className="w-4 h-4" /> },
    { id: 'preview', label: 'Prévisualisation', icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="border-b border-border">
      <nav className="flex space-x-1" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:border-b-2 hover:border-border'
              }
            `}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
