'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';

export default function ExampleSettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: false,
      sms: false,
    },
    privacy: {
      profileVisible: true,
      showEmail: false,
      showPhone: false,
    },
    preferences: {
      language: 'fr',
      timezone: 'Europe/Paris',
      theme: 'light',
    },
  });

  type TabId = 'general' | 'notifications' | 'privacy' | 'security';
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'general', label: 'Général' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Confidentialité' },
    { id: 'security', label: 'Sécurité' },
  ];

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Paramètres</h1>
        <p className="text-muted-foreground">
          Une page de paramètres complète avec différents types de configurations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    className="w-full justify-start"
                  >
                    {tab.label}
                  </Button>
                ))}
              </nav>
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Card>
            <div className="p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Paramètres Généraux</h2>
                  <div className="space-y-6">
                    <div>
                      <Select
                        label="Langue"
                        value={settings.preferences.language}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, language: e.target.value },
                          })
                        }
                        fullWidth
                        options={[
                          { value: 'fr', label: 'Français' },
                          { value: 'en', label: 'English' },
                          { value: 'es', label: 'Español' },
                        ]}
                      />
                    </div>
                    <div>
                      <Select
                        label="Fuseau horaire"
                        value={settings.preferences.timezone}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, timezone: e.target.value },
                          })
                        }
                        fullWidth
                        options={[
                          { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1)' },
                          { value: 'America/New_York', label: 'America/New_York (UTC-5)' },
                          { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+9)' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Thème
                      </label>
                      <div className="flex gap-4">
                        {['light', 'dark', 'auto'].map((theme) => (
                          <Button
                            key={theme}
                            onClick={() =>
                              setSettings({
                                ...settings,
                                preferences: { ...settings.preferences, theme },
                              })
                            }
                            variant={settings.preferences.theme === theme ? 'primary' : 'outline'}
                          >
                            {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🔄'} {theme}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Notifications</h2>
                  <div className="space-y-4">
                    {Object.entries(settings.notifications).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-foreground capitalize">{key}</div>
                          <div className="text-sm text-muted-foreground">
                            {key === 'email' && 'Recevoir des notifications par email'}
                            {key === 'push' && 'Recevoir des notifications push'}
                            {key === 'sms' && 'Recevoir des notifications par SMS'}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              notifications: { ...settings.notifications, [key]: e.target.checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Confidentialité</h2>
                  <div className="space-y-4">
                    {Object.entries(settings.privacy).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      >
                        <div>
                          <div className="font-medium text-foreground">
                            {key === 'profileVisible' && 'Profil visible'}
                            {key === 'showEmail' && "Afficher l'email"}
                            {key === 'showPhone' && 'Afficher le téléphone'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {key === 'profileVisible' &&
                              'Permettre aux autres utilisateurs de voir votre profil'}
                            {key === 'showEmail' && 'Afficher votre adresse email publiquement'}
                            {key === 'showPhone' &&
                              'Afficher votre numéro de téléphone publiquement'}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              privacy: { ...settings.privacy, [key]: e.target.checked },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-6">Sécurité</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Changer le mot de passe
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <Input
                            label="Mot de passe actuel"
                            type="password"
                            placeholder="••••••••"
                            fullWidth
                          />
                        </div>
                        <div>
                          <Input
                            label="Nouveau mot de passe"
                            type="password"
                            placeholder="••••••••"
                            fullWidth
                          />
                        </div>
                        <div>
                          <Input
                            label="Confirmer le nouveau mot de passe"
                            type="password"
                            placeholder="••••••••"
                            fullWidth
                          />
                        </div>
                        <Button>Changer le mot de passe</Button>
                      </div>
                    </div>
                    <div className="border-t border-border pt-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Authentification à deux facteurs
                      </h3>
                      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                          <div className="font-medium text-foreground">2FA activée</div>
                          <div className="text-sm text-muted-foreground">
                            Protégez votre compte avec une authentification à deux facteurs
                          </div>
                        </div>
                        <Badge variant="success">Activé</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border flex justify-end">
                <Button>Enregistrer les modifications</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}
