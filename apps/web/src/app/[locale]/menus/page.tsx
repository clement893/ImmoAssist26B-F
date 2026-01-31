/**
 * Menu Management Page
 *
 * Page for managing navigation menus.
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MenuBuilder } from '@/components/cms';
import type { Menu } from '@/components/cms';
import { PageHeader, PageContainer } from '@/components/layout';
import { Loading, Alert, useToast } from '@/components/ui';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { menusAPI } from '@/lib/api';
import { handleApiError } from '@/lib/errors/api';
import { logger } from '@/lib/logger';

export default function MenusPage() {
  const t = useTranslations('menus');
  const [menu, setMenu] = useState<Menu | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMenu();
  }, []);

  const { showToast } = useToast();

  const loadMenu = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await menusAPI.list();
      const menus = response.data || [];

      if (menus.length > 0) {
        const firstMenu = menus[0];
        setMenu({
          id: String(firstMenu.id),
          name: firstMenu.name,
          location: firstMenu.location,
          items: firstMenu.items || [],
        });
      } else {
        setMenu(null);
      }
      setIsLoading(false);
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to load menu', appError);
      setError(
        appError.message || t('errors.loadFailed') || 'Failed to load menu. Please try again.'
      );
      setIsLoading(false);
    }
  };

  const handleSave = async (updatedMenu: Menu) => {
    try {
      setIsLoading(true);
      setError(null);

      if (updatedMenu.id && updatedMenu.id !== '') {
        // Update existing menu
        const menuId = parseInt(updatedMenu.id, 10);
        await menusAPI.update(menuId, {
          name: updatedMenu.name,
          location: updatedMenu.location,
          items: updatedMenu.items,
        });
        showToast({ message: 'Menu updated successfully', type: 'success' });
      } else {
        // Create new menu
        const response = await menusAPI.create({
          name: updatedMenu.name,
          location: updatedMenu.location,
          items: updatedMenu.items,
        });
        setMenu({
          id: String(response.data.id),
          name: response.data.name,
          location: response.data.location,
          items: response.data.items || [],
        });
        showToast({ message: 'Menu created successfully', type: 'success' });
      }

      await loadMenu();
    } catch (error) {
      const appError = handleApiError(error);
      logger.error('Failed to save menu', appError);
      setError(appError.message || 'Failed to save menu. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loading />
          </div>
        </PageContainer>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageContainer>
        <PageHeader
          title={t('title') || 'Menu Management'}
          description={t('description') || 'Build and manage navigation menus'}
          breadcrumbs={[
            { label: t('breadcrumbs.home') || 'Home', href: '/' },
            { label: t('breadcrumbs.menus') || 'Menus' },
          ]}
        />

        {error && (
          <div className="mt-6">
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        <div className="mt-8">
          <MenuBuilder menu={menu || undefined} onSave={handleSave} />
        </div>
      </PageContainer>
    </ProtectedRoute>
  );
}
