/**
 * Calendar Settings Page
 * Connect Google Calendar and Outlook
 */

'use client';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useTranslations } from 'next-intl';
import { PageHeader, PageContainer } from '@/components/layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useCalendarConnections } from '@/hooks/useAppointments';
import { Calendar, Link2, Unlink } from 'lucide-react';

export default function CalendarSettingsPage() {
  const t = useTranslations('settings');
  const { connections, isLoading, error, mutate } = useCalendarConnections();

  const hasGoogle = connections.some((c) => c.provider === 'google');
  const hasOutlook = connections.some((c) => c.provider === 'outlook');

  const handleDisconnect = async (provider: 'google' | 'outlook') => {
    try {
      const { appointmentsAPI } = await import('@/lib/api/appointments');
      await appointmentsAPI.disconnectCalendar(provider);
      await mutate();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t('navigation.calendar') || 'Calendrier'}
        description={t('navigation.calendarDescription') || 'Connecter Google Calendar et Outlook'}
        breadcrumbs={[
          { label: t('breadcrumbs.dashboard') || 'Dashboard', href: '/dashboard' },
          { label: t('breadcrumbs.settings') || 'Settings', href: '/settings' },
          { label: t('navigation.calendar') || 'Calendrier' },
        ]}
      />

      <div className="mt-8 space-y-6">
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            Erreur lors du chargement des connexions.
          </div>
        )}

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Connexions calendrier
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Connectez vos calendriers pour synchroniser vos rendez-vous ImmoAssist avec Google Calendar ou Outlook.
          </p>

          {isLoading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-blue-500/10">
                    <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Google Calendar</p>
                    <p className="text-sm text-muted-foreground">
                      {hasGoogle ? 'Connecté' : 'Non connecté'}
                    </p>
                  </div>
                </div>
                {hasGoogle ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('google')}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Déconnecter
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="OAuth Google à configurer côté backend"
                  >
                    Connecter (bientôt)
                  </Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-sky-500/10">
                    <Link2 className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div>
                    <p className="font-medium">Outlook / Microsoft 365</p>
                    <p className="text-sm text-muted-foreground">
                      {hasOutlook ? 'Connecté' : 'Non connecté'}
                    </p>
                  </div>
                </div>
                {hasOutlook ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('outlook')}
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Déconnecter
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    title="OAuth Outlook à configurer côté backend"
                  >
                    Connecter (bientôt)
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </PageContainer>
  );
}
