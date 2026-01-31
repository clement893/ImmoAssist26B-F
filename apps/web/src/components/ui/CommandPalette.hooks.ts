/**
 * CommandPalette Hooks
 * Custom hooks for CommandPalette logic
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Command } from './CommandPalette.types';

/**
 * Hook for filtering commands
 */
export function useFilteredCommands(commands: Command[], search: string) {
  return useMemo(() => {
    if (!search) return commands;

    const searchLower = search.toLowerCase();
    return commands.filter((command) => {
      return (
        command.label.toLowerCase().includes(searchLower) ||
        command.description?.toLowerCase().includes(searchLower) ||
        command.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower)) ||
        command.category?.toLowerCase().includes(searchLower)
      );
    });
  }, [commands, search]);
}

/**
 * Hook for grouping commands by category
 */
export function useGroupedCommands(commands: Command[]) {
  return useMemo(() => {
    return commands.reduce(
      (acc, command) => {
        const category = command.category || 'Autres';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(command);
        return acc;
      },
      {} as Record<string, Command[]>
    );
  }, [commands]);
}

/**
 * Hook for keyboard navigation
 */
export function useKeyboardNavigation(
  isOpen: boolean,
  filteredCommands: Command[],
  selectedIndex: number,
  onSelect: (index: number) => void,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        onSelect(Math.min(selectedIndex + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onSelect(Math.max(selectedIndex - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelect, onClose]);
}

/**
 * Hook for Command Palette state management
 */
export function useCommandPaletteState(commands: Command[], isOpen: boolean, onClose: () => void) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = useFilteredCommands(commands, search);
  const groupedCommands = useGroupedCommands(filteredCommands);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  useKeyboardNavigation(isOpen, filteredCommands, selectedIndex, handleSelect, onClose);

  return {
    search,
    setSearch,
    selectedIndex,
    filteredCommands,
    groupedCommands,
  };
}
