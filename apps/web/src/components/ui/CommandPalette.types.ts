/**
 * CommandPalette Types
 * TypeScript types for CommandPalette component
 */

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  keywords?: string[];
  action: () => void;
  category?: string;
  shortcut?: string;
}

export interface CommandPaletteProps {
  commands: Command[];
  isOpen: boolean;
  onClose: () => void;
  placeholder?: string;
  emptyState?: React.ReactNode;
  className?: string;
}
