/**
 * Command Palette Component
 * Modern ⌘K command palette for SaaS applications
 */

'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useCommandPaletteState } from './CommandPalette.hooks';
import type { Command, CommandPaletteProps } from './CommandPalette.types';

export type { Command, CommandPaletteProps };

export default function CommandPalette({
  commands,
  isOpen,
  onClose,
  placeholder = 'Tapez une commande ou recherchez...',
  emptyState,
  className,
}: CommandPaletteProps) {
  const { search, setSearch, selectedIndex, filteredCommands, groupedCommands } =
    useCommandPaletteState(commands, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4"
      onClick={onClose}
    >
      <div
        className={clsx(
          'bg-background rounded-lg shadow-standard-xl w-full max-w-2xl transition-modern', // UI Revamp - Nouveau système d'ombres et transition moderne
          'border border-border',
          'max-h-[60vh] flex flex-col overflow-hidden',
          className
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <svg
            className="w-5 h-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
            aria-label="Search commands"
          />
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Commands List */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            emptyState || (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun résultat trouvé</p>
              </div>
            )
          ) : (
            <div className="space-y-1">
              {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                <div key={category}>
                  {category !== 'Autres' && (
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </div>
                  )}
                  {categoryCommands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = globalIndex === selectedIndex;

                    return (
                      <button
                        key={command.id}
                        onClick={() => {
                          command.action();
                          onClose();
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-modern', // UI Revamp - Transition moderne
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-900 dark:text-primary-100'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        {command.icon && (
                          <span className="flex-shrink-0 text-muted-foreground">
                            {command.icon}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{command.label}</div>
                          {command.description && (
                            <div className="text-sm text-muted-foreground truncate">
                              {command.description}
                            </div>
                          )}
                        </div>
                        {command.shortcut && (
                          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted border border-border rounded">
                            {command.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">↓</kbd>
              <span>Naviguer</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded">Enter</kbd>
              <span>Sélectionner</span>
            </div>
          </div>
          <div>
            {filteredCommands.length} résultat{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for using Command Palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  };
}
