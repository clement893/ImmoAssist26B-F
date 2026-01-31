/**
 * Home Page
 * Landing page showcasing all project features with theme components
 */

'use client';

import { type ReactNode } from 'react';
import { Hero, Stats, TechStack, CTA } from '@/components/sections';
import { Container, Card, Badge, Grid } from '@/components/ui';
import {
  Shield,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Globe,
  Zap,
  Lock,
  Database,
  Settings,
  Layers,
  Code,
  Rocket,
  Palette,
  Server,
  Box,
  CheckCircle2,
} from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface FeatureCategory {
  title: string;
  icon: ReactNode;
  description: string;
  features: Array<{
    title: string;
    description: string;
  }>;
  badgeVariant: BadgeVariant;
  iconColor: string;
}

const featureCategories: FeatureCategory[] = [
  {
    title: 'Authentification & Sécurité',
    icon: <Shield className="w-6 h-6" />,
    description: 'Système de sécurité complet et robuste',
    badgeVariant: 'success',
    iconColor: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    features: [
      { title: 'JWT avec httpOnly cookies', description: 'Authentification sécurisée avec tokens' },
      { title: 'OAuth (Google, GitHub, Microsoft)', description: 'Connexion sociale intégrée' },
      { title: 'Multi-Factor Authentication (MFA)', description: '2FA avec TOTP pour une sécurité renforcée' },
      { title: 'Role-Based Access Control (RBAC)', description: 'Système de permissions flexible' },
      { title: 'API Key Management', description: 'Gestion sécurisée des clés API' },
      { title: 'Security Headers', description: 'CSP, HSTS, X-Frame-Options' },
    ],
  },
  {
    title: 'Gestion Utilisateurs & Équipes',
    icon: <Users className="w-6 h-6" />,
    description: 'Gestion complète des utilisateurs et équipes',
    badgeVariant: 'info',
    iconColor: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    features: [
      { title: 'Inscription & Connexion', description: 'Gestion complète des comptes utilisateurs' },
      { title: 'Profil Utilisateur', description: 'Gestion de profil avancée' },
      { title: 'Gestion des Équipes', description: 'Création et gestion d\'équipes multi-utilisateurs' },
      { title: 'Multi-tenancy', description: 'Support complet du multi-tenant' },
      { title: 'Invitations', description: 'Système d\'invitation par email' },
      { title: 'Préférences Utilisateur', description: 'Thème, langue et paramètres personnalisés' },
    ],
  },
  {
    title: 'Facturation & Abonnements',
    icon: <CreditCard className="w-6 h-6" />,
    description: 'Système de paiement et abonnements complet',
    badgeVariant: 'info',
    iconColor: 'bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400',
    features: [
      { title: 'Intégration Stripe', description: 'Paiements sécurisés avec Stripe' },
      { title: 'Gestion des Abonnements', description: 'Gestion complète des abonnements' },
      { title: 'Historique des Paiements', description: 'Suivi de toutes les transactions' },
      { title: 'Génération de Factures', description: 'Création automatique de factures' },
      { title: 'Metering d\'Usage', description: 'Suivi de l\'utilisation des services' },
      { title: 'Portail Client', description: 'Portail self-service pour les utilisateurs' },
    ],
  },
  {
    title: 'Gestion de Contenu',
    icon: <FileText className="w-6 h-6" />,
    description: 'CMS complet pour la gestion de contenu',
    badgeVariant: 'warning',
    iconColor: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    features: [
      { title: 'Système de Blog', description: 'Blog complet avec catégories et tags' },
      { title: 'Page Builder', description: 'Constructeur de pages visuel' },
      { title: 'Médiathèque', description: 'Gestion complète des médias' },
      { title: 'Planification de Contenu', description: 'Publication programmée' },
      { title: 'Gestion SEO', description: 'Optimisation pour les moteurs de recherche' },
      { title: 'Gestion de Menus', description: 'Création et gestion de menus' },
    ],
  },
  {
    title: 'Formulaires & Enquêtes',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Création et gestion de formulaires et enquêtes',
    badgeVariant: 'default',
    iconColor: 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400',
    features: [
      { title: 'Constructeur de Formulaires', description: 'Création de formulaires personnalisés' },
      { title: 'Soumissions de Formulaires', description: 'Gestion des réponses' },
      { title: 'Création d\'Enquêtes', description: 'Enquêtes interactives' },
      { title: 'Résultats d\'Enquêtes', description: 'Analyse et visualisation des résultats' },
      { title: 'Validation Avancée', description: 'Validation côté client et serveur' },
    ],
  },
  {
    title: 'Monitoring & Analytics',
    icon: <BarChart3 className="w-6 h-6" />,
    description: 'Suivi de performance et analytics',
    badgeVariant: 'error',
    iconColor: 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400',
    features: [
      { title: 'Monitoring de Performance', description: 'Suivi en temps réel des performances' },
      { title: 'Error Tracking (Sentry)', description: 'Suivi des erreurs avec Sentry' },
      { title: 'Web Vitals', description: 'Métriques Core Web Vitals' },
      { title: 'Tableau de Bord Analytics', description: 'Visualisation des données' },
      { title: 'Constructeur de Rapports', description: 'Création de rapports personnalisés' },
    ],
  },
  {
    title: 'Internationalisation',
    icon: <Globe className="w-6 h-6" />,
    description: 'Support multi-langues complet',
    badgeVariant: 'info',
    iconColor: 'bg-info-50 dark:bg-info-900/20 text-info-600 dark:text-info-400',
    features: [
      { title: 'Multi-langues (EN, FR, AR, HE)', description: 'Support de 4 langues' },
      { title: 'Routing par Locale', description: 'Routes localisées' },
      { title: 'Support RTL', description: 'Support Arabic et Hebrew (RTL)' },
      { title: 'Persistance de Préférences', description: 'Mémorisation de la langue' },
    ],
  },
  {
    title: 'Temps Réel',
    icon: <Zap className="w-6 h-6" />,
    description: 'Fonctionnalités temps réel',
    badgeVariant: 'warning',
    iconColor: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    features: [
      { title: 'Support WebSocket', description: 'Connexions temps réel' },
      { title: 'Notifications Temps Réel', description: 'Notifications instantanées' },
      { title: 'Centre de Notifications', description: 'Hub centralisé des notifications' },
      { title: 'Collaboration', description: 'Fonctionnalités de collaboration en temps réel' },
    ],
  },
  {
    title: 'ERP',
    icon: <Box className="w-6 h-6" />,
    description: 'Système ERP complet',
    badgeVariant: 'info',
    iconColor: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    features: [
      { title: 'Gestion Clients', description: 'CRM intégré' },
      { title: 'Gestion des Commandes', description: 'Suivi complet des commandes' },
      { title: 'Gestion des Factures', description: 'Facturation et comptabilité' },
      { title: 'Gestion des Stocks', description: 'Inventaire et stock' },
      { title: 'Rapports & Analytics', description: 'Rapports d\'entreprise' },
    ],
  },
  {
    title: 'Thème & Personnalisation',
    icon: <Palette className="w-6 h-6" />,
    description: 'Système de thème avancé',
    badgeVariant: 'default',
    iconColor: 'bg-secondary-50 dark:bg-secondary-900/20 text-secondary-600 dark:text-secondary-400',
    features: [
      { title: 'Thème Avancé', description: 'Système de thème complet (couleurs, typographie, espacement)' },
      { title: 'Dark Mode', description: 'Mode sombre intégré' },
      { title: 'Éditeur de Thème Visuel', description: 'Éditeur avec prévisualisation en direct' },
      { title: '357 Composants UI', description: 'Bibliothèque complète de composants' },
      { title: 'Effets Visuels', description: 'Glassmorphism, shadows, gradients' },
    ],
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <Hero />

      {/* Stats Section */}
      <Stats />

      {/* Core Features Section */}
      <section className="py-20 bg-background" aria-labelledby="core-features-heading">
        <Container>
          <div className="text-center mb-16">
            <Badge variant="info" className="mb-4">
              Fonctionnalités Principales
            </Badge>
            <h2
              id="core-features-heading"
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
            >
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Un template complet avec toutes les fonctionnalités essentielles pour démarrer votre projet SaaS
            </p>
          </div>

          <Grid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="loose">
            {featureCategories.map((category, index) => (
              <Card key={index} hover className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-3 rounded-lg ${category.iconColor} flex-shrink-0`}>
                    {category.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{category.title}</h3>
                      <Badge variant={category.badgeVariant} className="text-xs">
                        {category.features.length}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                  </div>
                </div>

                <ul className="space-y-3 flex-1">
                  {category.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{feature.title}</p>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </Grid>
        </Container>
      </section>

      {/* Tech Stack Section */}
      <TechStack />

      {/* Additional Features Section */}
      <section className="py-20 bg-muted/30" aria-labelledby="additional-features-heading">
        <Container>
          <div className="text-center mb-16">
            <h2
              id="additional-features-heading"
              className="text-4xl md:text-5xl font-bold mb-4 text-foreground"
            >
              Outils Développeur
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tout ce qu'il faut pour développer efficacement
            </p>
          </div>

          <Grid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="normal">
            <Card hover className="text-center">
              <Code className="w-10 h-10 mx-auto mb-4 text-primary-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">TypeScript</h3>
              <p className="text-sm text-muted-foreground">
                Typage statique pour un code plus sûr et maintenable
              </p>
            </Card>

            <Card hover className="text-center">
              <Rocket className="w-10 h-10 mx-auto mb-4 text-success-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">357 Composants</h3>
              <p className="text-sm text-muted-foreground">
                Bibliothèque complète de composants réutilisables
              </p>
            </Card>

            <Card hover className="text-center">
              <Database className="w-10 h-10 mx-auto mb-4 text-info-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Type Generation</h3>
              <p className="text-sm text-muted-foreground">
                Types TypeScript auto-générés depuis les schémas Pydantic
              </p>
            </Card>

            <Card hover className="text-center">
              <Server className="w-10 h-10 mx-auto mb-4 text-warning-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Testing Suite</h3>
              <p className="text-sm text-muted-foreground">
                Vitest (unit), Playwright (E2E), pytest (backend)
              </p>
            </Card>

            <Card hover className="text-center">
              <Settings className="w-10 h-10 mx-auto mb-4 text-error-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Code Generation</h3>
              <p className="text-sm text-muted-foreground">
                Outils CLI pour générer composants, pages et routes API
              </p>
            </Card>

            <Card hover className="text-center">
              <Layers className="w-10 h-10 mx-auto mb-4 text-secondary-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Storybook</h3>
              <p className="text-sm text-muted-foreground">
                Documentation et tests de composants
              </p>
            </Card>

            <Card hover className="text-center">
              <Zap className="w-10 h-10 mx-auto mb-4 text-primary-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Hot Reload</h3>
              <p className="text-sm text-muted-foreground">
                Rechargement rapide pour frontend et backend
              </p>
            </Card>

            <Card hover className="text-center">
              <Lock className="w-10 h-10 mx-auto mb-4 text-success-500" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">CI/CD Ready</h3>
              <p className="text-sm text-muted-foreground">
                Workflows GitHub Actions inclus
              </p>
            </Card>
          </Grid>
        </Container>
      </section>

      {/* CTA Section */}
      <CTA />
    </div>
  );
}