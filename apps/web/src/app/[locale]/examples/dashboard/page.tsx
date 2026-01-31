'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Container from '@/components/ui/Container';
import StatsCard from '@/components/ui/StatsCard';

export default function ExampleDashboardPage() {
  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Dashboard</h1>
        <p className="text-muted-foreground">
          Un exemple de tableau de bord avec widgets et statistiques
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Utilisateurs"
          value="1,234"
          trend="+12%"
          trendDirection="up"
        />
        <StatsCard
          title="Campagnes Actives"
          value="8"
          trend="+3"
          trendDirection="up"
        />
        <StatsCard
          title="Montant Collecté"
          value="45,678€"
          trend="+8%"
          trendDirection="up"
        />
        <StatsCard
          title="Taux de Conversion"
          value="3.2%"
          trend="+0.5%"
          trendDirection="up"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Activité Récente</h2>
            <div className="space-y-4">
              {[
                {
                  name: 'Jean Dupont',
                  action: 'a fait un don de',
                  amount: '50€',
                  time: 'Il y a 2 heures',
                },
                {
                  name: 'Marie Martin',
                  action: 'a rejoint la campagne',
                  campaign: 'Campagne Hiver',
                  time: 'Il y a 5 heures',
                },
                { name: 'Pierre Durand', action: 'a mis à jour son profil', time: 'Il y a 1 jour' },
              ].map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-4 border-b border-border last:border-0"
                >
                  <div className="w-10 h-10 bg-info-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-info-600 font-semibold">{activity.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">
                      <span className="font-semibold">{activity.name}</span> {activity.action}{' '}
                      {activity.amount && (
                        <span className="font-semibold text-success-600 dark:text-success-400">
                          {activity.amount}
                        </span>
                      )}
                      {activity.campaign && (
                        <span className="font-semibold">{activity.campaign}</span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Campagnes en Cours</h2>
            <div className="space-y-4">
              {[
                { name: 'Campagne Hiver 2024', progress: 75, amount: '30,000€', target: '40,000€' },
                { name: 'Aide aux Familles', progress: 45, amount: '9,000€', target: '20,000€' },
                { name: 'Éducation', progress: 90, amount: '18,000€', target: '20,000€' },
              ].map((campaign, index) => (
                <div key={index} className="pb-4 border-b border-border last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground">{campaign.name}</h3>
                    <Badge variant="success">{campaign.progress}%</Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{campaign.amount} collectés</span>
                    <span>Objectif: {campaign.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">➕</span>
              <span>Nouveau Projet</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">📊</span>
              <span>Nouvelle Campagne</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">📧</span>
              <span>Envoyer Email</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
              <span className="text-2xl mb-2">📄</span>
              <span>Générer Rapport</span>
            </Button>
          </div>
        </div>
      </Card>
    </Container>
  );
}
