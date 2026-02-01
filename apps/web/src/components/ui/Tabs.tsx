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
        container: 'border-b border-border',
        tab: (isActive: boolean) =>
          clsx(
            'px-5 py-3 text-sm font-medium border-b-2 transition-modern', // UI Revamp - Padding augmenté, transition moderne
            isActive
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60'
          ),
      },
      pills: {
        container: 'flex gap-2',
        tab: (isActive: boolean) =>
          clsx(
            'px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 ease-natural shadow-sm', // Revamp UI - Padding augmenté, transitions fluides, ombre
            isActive
              ? 'bg-primary-600 dark:bg-primary-500 text-background shadow-primary' // Revamp UI - Ombre colorée
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:shadow-md' // Revamp UI - Hover effect amélioré
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
                'flex items-center gap-2'
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={clsx(
                    'ml-1 px-2 py-0.5 text-xs rounded-full',
                    activeTab === tab.id
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-6">{activeTabContent}</div> {/* Revamp UI - Margin augmentée */}
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

// TabList Component
export function TabList({ children, className }: TabListProps) {
  return (
    <div className={clsx('flex border-b border-border overflow-x-auto', className)}>{children}</div>
  );
}

// Tab Component
export function Tab({ children, value, disabled, className }: TabProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => !disabled && setActiveTab(value)}
      disabled={disabled}
      className={clsx(
        'px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 ease-natural whitespace-nowrap flex-shrink-0', // Revamp UI - Padding augmenté, transitions fluides
        isActive
          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
          : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border/60',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
}

// TabPanels Component
export function TabPanels({ children, className }: TabPanelsProps) {
  return <div className={clsx('mt-6', className)}>{children}</div>; // Revamp UI - Margin augmentée
}

// TabPanel Component
export function TabPanel({ children, value, className }: TabPanelProps) {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) {
    return null;
  }
  return <div className={className}>{children}</div>;
}
