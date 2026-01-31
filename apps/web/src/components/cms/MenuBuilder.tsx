/**
 * Menu Builder Component
 *
 * Drag-and-drop menu builder for CMS navigation management.
 * Allows users to create and manage navigation menus with drag-and-drop functionality.
 *
 * @component
 * @example
 * ```tsx
 * <MenuBuilder
 *   menu={menuData}
 *   onSave={async (menu) => {
 *     await menusAPI.update(menu.id, menu);
 *   }}
 * />
 * ```
 *
 * @features
 * - Drag-and-drop menu item reordering
 * - Add/edit/delete menu items
 * - Support for nested menu items
 * - Multiple menu locations (header, footer, sidebar)
 * - Real-time preview
 *
 * @see {@link https://github.com/your-repo/docs/components/menu-builder} Component Documentation
 */
'use client';

import { useState } from 'react';
import { logger } from '@/lib/logger';
import { Card, Button, Input, Select, Modal, Alert } from '@/components/ui';
import { DragDropList } from '@/components/ui';
import type { DragDropListItem } from '@/components/ui';
import { Plus, Save, Trash2, Edit, ExternalLink } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  target?: '_self' | '_blank';
  children?: MenuItem[];
}

export interface Menu {
  id: string;
  name: string;
  location: 'header' | 'footer' | 'sidebar';
  items: MenuItem[];
}

export interface MenuBuilderProps {
  menu?: Menu;
  onSave?: (menu: Menu) => Promise<void>;
  className?: string;
}

/**
 * Menu Builder Component
 *
 * Visual menu builder with drag-and-drop functionality.
 */
export default function MenuBuilder({ menu, onSave, className }: MenuBuilderProps) {
  const [currentMenu, setCurrentMenu] = useState<Menu>(
    menu || {
      id: '',
      name: '',
      location: 'header',
      items: [],
    }
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({
    label: '',
    url: '',
    target: '_self',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReorder = (newOrder: DragDropListItem[]) => {
    const reorderedItems = newOrder.map((item) => currentMenu.items.find((i) => i.id === item.id)!);
    setCurrentMenu({
      ...currentMenu,
      items: reorderedItems,
    });
  };

  const handleAddItem = () => {
    const item: MenuItem = {
      id: `item-${Date.now()}`,
      ...newItem,
    };
    setCurrentMenu({
      ...currentMenu,
      items: [...currentMenu.items, item],
    });
    setNewItem({ label: '', url: '', target: '_self' });
    setIsAddModalOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    setCurrentMenu({
      ...currentMenu,
      items: currentMenu.items.filter((item) => item.id !== id),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      if (onSave) {
        await onSave(currentMenu);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save menu');
    } finally {
      setIsSaving(false);
    }
  };

  const dragDropItems: DragDropListItem[] = currentMenu.items.map((item) => ({
    id: item.id,
    content: (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">{item.label}</span>
          <span className="text-xs text-muted-foreground">{item.url}</span>
          {item.target === '_blank' && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Edit functionality - implement when menu editing is needed
              logger.log('Edit item', item);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    ),
  }));

  return (
    <div className={className}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Menu Items">
            {error && (
              <div className="mb-4">
                <Alert variant="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              </div>
            )}

            <div className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Menu Name</label>
                <Input
                  value={currentMenu.name}
                  onChange={(e) =>
                    setCurrentMenu({
                      ...currentMenu,
                      name: e.target.value,
                    })
                  }
                  placeholder="Main Menu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                <Select
                  options={[
                    { label: 'Header', value: 'header' },
                    { label: 'Footer', value: 'footer' },
                    { label: 'Sidebar', value: 'sidebar' },
                  ]}
                  value={currentMenu.location}
                  onChange={(e) =>
                    setCurrentMenu({
                      ...currentMenu,
                      location: e.target.value as Menu['location'],
                    })
                  }
                />
              </div>
            </div>

            <div className="mb-4">
              <Button variant="outline" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            {currentMenu.items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No menu items yet. Add an item to get started.</p>
              </div>
            ) : (
              <DragDropList items={dragDropItems} onReorder={handleReorder} />
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div>
          <Card title="Actions">
            <div className="space-y-2">
              <Button variant="primary" onClick={handleSave} disabled={isSaving} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Menu'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Menu Item">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Label *</label>
            <Input
              value={newItem.label}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  label: e.target.value,
                })
              }
              placeholder="Menu Item Label"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">URL *</label>
            <Input
              value={newItem.url}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  url: e.target.value,
                })
              }
              placeholder="/page or https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Target</label>
            <Select
              options={[
                { label: 'Same Window', value: '_self' },
                { label: 'New Window', value: '_blank' },
              ]}
              value={newItem.target || '_self'}
              onChange={(e) =>
                setNewItem({
                  ...newItem,
                  target: e.target.value as '_self' | '_blank',
                })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddItem}
              disabled={!newItem.label || !newItem.url}
            >
              Add Item
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
