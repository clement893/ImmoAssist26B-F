/**
 * Tabs Component
 *
 * Tab navigation component for ERP applications
 * Supports both simple API (tabs prop) and compound API (TabList, Tab, TabPanels, TabPanel)
 */
'use client';

import { type ReactNode, useState, createContext, useContext } from 'react';
import { clsx } from 'clsx';

// Context for compound API
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component');
  }
  return context;
}

// Simple API Types
export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabsProps {
  children?: ReactNode;
  tabs?: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'pills' | 'underline';
}

// Compound API Components
export interface TabListProps {
  children: ReactNode;
  className?: string;
}

export interface TabProps {
  children: ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

export interface TabPanelsProps {
  children: ReactNode;
  className?: string;
}

export interface TabPanelProps {
  children: ReactNode;
  value: string;
  className?: string;
}

// Main Tabs Component
export default function Tabs({
  children,
  tabs,
  defaultTab,
  onChange,
  className,
  variant = 'default',
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs?.[0]?.id ?? '');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  // Simple API: render with tabs prop
  if (tabs) {
    const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

    const variantClasses = {
      default: {
        container: 'bg-white rounded-3xl shadow-sm overflow-hidden border-b border-gray-200', // Dashboard V2 Style - Container rounded-3xl
        tab: (isActive: boolean) =>
          clsx(
            'flex-1 px-6 py-4 text-sm font-medium transition-colors relative', // Dashboard V2 Style - flex-1, px-6 py-4
            isActive
              ? 'text-blue-600' // Dashboard V2 Style - text-blue-600 pour actif
              : 'text-gray-500 hover:text-gray-700', // Dashboard V2 Style - text-gray-500 pour inactif
            isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500' // Dashboard V2 Style - Ligne bleue en bas
          ),
      },
      pills: {
        container: 'flex gap-2',
        tab: (isActive: boolean) =>
          clsx(
            'px-5 py-2.5 text-sm font-medium rounded-full transition-modern shadow-subtle-sm', // UI Revamp - Transition moderne et nouveau système d'ombres
            isActive
              ? 'bg-primary-600 dark:bg-primary-500 text-background shadow-primary' // Revamp UI - Ombre colorée
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:shadow-standard-md' // UI Revamp - Nouveau système d'ombres
          ),
      },
      underline: {
        container: 'border-b border-border',
        tab: (isActive: boolean) =>
          clsx(
            'px-4 py-2 text-sm font-medium transition-modern relative', // UI Revamp - Transition moderne
            isActive
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-muted-foreground hover:text-foreground',
            isActive &&
              'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-600 dark:after:bg-primary-500'
          ),
      },
    };

    const classes = variantClasses[variant];

    return (
      <div className={clsx('w-full', className)}>
        <div className={clsx('flex', classes.container)}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={clsx(
                classes.tab(activeTab === tab.id),
                tab.disabled && 'opacity-50 cursor-not-allowed',
                'flex items-center justify-center gap-2' // Dashboard V2 Style - justify-center
              )}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>} {/* Dashboard V2 Style - w-4 h-4 */}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={clsx(
                    'ml-1 px-2 py-0.5 text-xs rounded-full font-medium',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700' // Dashboard V2 Style - Couleurs cohérentes
                      : 'bg-gray-100 text-gray-600'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="p-8">{activeTabContent}</div> {/* Dashboard V2 Style - p-8 pour content */}
      </div>
    );
  }

  // Compound API: render with children
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabList Component - Dashboard V2 Style
export function TabList({ children, className }: TabListProps) {
  return (
    <div className={clsx('bg-white rounded-3xl shadow-sm overflow-hidden border-b border-gray-200 flex', className)}>
      {children}
    </div>
  );
}

// Tab Component - Dashboard V2 Style
export function Tab({ children, value, disabled, className }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={clsx(
        'flex-1 px-6 py-4 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0', // Dashboard V2 Style
        isActive
          ? 'text-blue-600' // Dashboard V2 Style - text-blue-600 pour actif
          : 'text-gray-500 hover:text-gray-700', // Dashboard V2 Style - text-gray-500 pour inactif
        isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500', // Dashboard V2 Style - Ligne bleue en bas
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        {children}
      </div>
    </button>
  );
}

// TabPanels Component - Dashboard V2 Style
export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={clsx('p-8', className)}>{children}</div>; // Dashboard V2 Style - p-8 pour content
}

// TabPanel Component
export function TabPanel({ children, value, className }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) {
    return null;
  }
  return <div className={className}>{children}</div>;
}
