/**
 * Configuration du Sitemap
 * Centralise toutes les pages du site pour le sitemap HTML et XML
 */

export interface SitemapPage {
  path: string;
  title: string;
  description: string;
  priority?: number;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  requiresAuth?: boolean; // Indique si la page nécessite une authentification
  requiresAdmin?: boolean; // Indique si la page nécessite des droits administrateur
}

export interface SitemapCategory {
  name: string;
  pages: SitemapPage[];
}

// Configuration de l'URL de base du site
export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Structure des pages du site organisées par catégories
export const sitePages: Record<string, SitemapPage[]> = {
  Accueil: [
    {
      path: '/',
      title: 'Accueil',
      description: "Page d'accueil du site",
      priority: 1.0,
      changefreq: 'daily',
    },
  ],
  Authentification: [
    {
      path: '/auth/login',
      title: 'Connexion',
      description: 'Page de connexion',
      priority: 0.8,
      changefreq: 'monthly',
    },
    {
      path: '/auth/register',
      title: 'Inscription',
      description: "Page d'inscription",
      priority: 0.8,
      changefreq: 'monthly',
    },
    {
      path: '/auth/signin',
      title: 'Sign In',
      description: 'Page de connexion alternative',
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      path: '/auth/callback',
      title: 'Callback',
      description: 'Callback OAuth',
      priority: 0.5,
      changefreq: 'monthly',
    },
  ],
  Dashboard: [
    {
      path: '/dashboard',
      title: 'Dashboard',
      description: 'Tableau de bord principal',
      priority: 0.9,
      changefreq: 'daily',
      requiresAuth: true,
    },
    {
      path: '/dashboard/analytics',
      title: 'Analytics',
      description: 'Métriques et analyses de performance',
      priority: 0.8,
      changefreq: 'daily',
      requiresAuth: true,
    },
    {
      path: '/dashboard/reports',
      title: 'Reports',
      description: 'Créer et consulter des rapports personnalisés',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/dashboard/activity',
      title: 'Activity Feed',
      description: "Flux d'activité récentes",
      priority: 0.8,
      changefreq: 'daily',
      requiresAuth: true,
    },
    {
      path: '/dashboard/insights',
      title: 'Business Insights',
      description: 'Métriques et tendances business',
      priority: 0.8,
      changefreq: 'daily',
      requiresAuth: true,
    },
    {
      path: '/profile',
      title: 'Profile',
      description: 'Gérer votre profil utilisateur',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/profile/settings',
      title: 'Profile Settings',
      description: 'Paramètres du compte et préférences',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/profile/security',
      title: 'Profile Security',
      description: 'Paramètres de sécurité, 2FA et clés API',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/profile/notifications',
      title: 'Profile Notifications',
      description: 'Préférences de notifications',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/profile/activity',
      title: 'Profile Activity',
      description: 'Historique des activités du compte',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
    },
  ],
  'Gestion de contenu': [
    {
      path: '/content',
      title: 'Content Management',
      description: 'Tableau de bord de gestion de contenu',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/content/pages',
      title: 'Pages Management',
      description: 'Gestion des pages statiques',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/content/posts',
      title: 'Blog Posts Management',
      description: 'Gestion des articles de blog',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/content/media',
      title: 'Media Library',
      description: 'Bibliothèque de médias',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/content/categories',
      title: 'Categories Management',
      description: 'Gestion des catégories',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/content/tags',
      title: 'Tags Management',
      description: 'Gestion des tags',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/content/templates',
      title: 'Templates Management',
      description: 'Gestion des modèles de contenu',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/content/schedule',
      title: 'Scheduled Content',
      description: 'Contenu programmé',
      priority: 0.7,
      changefreq: 'daily',
      requiresAuth: true,
    },
  ],
  Blog: [
    {
      path: '/blog',
      title: 'Blog',
      description: 'Liste des articles de blog',
      priority: 0.9,
      changefreq: 'daily',
    },
  ],
  'Page Builder': [
    {
      path: '/pages',
      title: 'Pages',
      description: 'Gestion des pages',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
  ],
  'CMS Features': [
    {
      path: '/menus',
      title: 'Menu Management',
      description: 'Gestion des menus de navigation',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/forms',
      title: 'Form Builder',
      description: 'Création de formulaires dynamiques',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/surveys',
      title: 'Surveys',
      description: 'Création et gestion de sondages et questionnaires',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/seo',
      title: 'SEO Management',
      description: 'Gestion des paramètres SEO',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
  ],
  'Aide & Support': [
    {
      path: '/help',
      title: 'Help Center',
      description: "Centre d'aide et de support",
      priority: 0.8,
      changefreq: 'weekly',
    },
    {
      path: '/help/faq',
      title: 'FAQ',
      description: 'Questions fréquemment posées',
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      path: '/help/contact',
      title: 'Contact Support',
      description: 'Contacter le support',
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      path: '/help/tickets',
      title: 'Support Tickets',
      description: 'Gérer vos tickets de support',
      priority: 0.7,
      changefreq: 'daily',
      requiresAuth: true,
    },
    {
      path: '/help/guides',
      title: 'User Guides',
      description: 'Guides utilisateur et documentation',
      priority: 0.7,
      changefreq: 'monthly',
    },
    {
      path: '/help/videos',
      title: 'Video Tutorials',
      description: 'Tutoriels vidéo',
      priority: 0.7,
      changefreq: 'monthly',
    },
  ],
  Paramètres: [
    {
      path: '/settings',
      title: 'Settings',
      description: "Hub des paramètres de l'application",
      priority: 0.8,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/general',
      title: 'General Settings',
      description: "Paramètres généraux de l'application",
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/organization',
      title: 'Organization Settings',
      description: "Paramètres de l'organisation",
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/team',
      title: 'Team Settings',
      description: "Gestion de l'équipe et des permissions",
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/settings/billing',
      title: 'Billing Settings',
      description: 'Gestion de la facturation et des abonnements',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/integrations',
      title: 'Integrations Settings',
      description: 'Intégrations tierces et connexions',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/api',
      title: 'API Settings',
      description: 'Configuration et paramètres API',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/security',
      title: 'Security Settings',
      description: 'Paramètres de sécurité, 2FA et sessions',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/notifications',
      title: 'Notification Settings',
      description: 'Préférences et paramètres de notifications',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/settings/preferences',
      title: 'Preferences Settings',
      description: 'Préférences utilisateur et personnalisation',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
  ],
  Abonnements: [
    {
      path: '/pricing',
      title: 'Tarifs',
      description: 'Page des plans et tarifs',
      priority: 0.9,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
    {
      path: '/subscriptions',
      title: 'Mes Abonnements',
      description: 'Gestion des abonnements',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true,
    },
    {
      path: '/subscriptions/success',
      title: 'Succès Abonnement',
      description: "Confirmation d'abonnement",
      priority: 0.6,
      changefreq: 'monthly',
      requiresAuth: true,
    },
  ],
  Administration: [
    {
      path: '/admin',
      title: 'Admin',
      description: "Panneau d'administration",
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      path: '/admin/teams',
      title: 'Gestion des Équipes',
      description: 'Administration des équipes',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      path: '/admin/invitations',
      title: 'Invitations',
      description: 'Gestion des invitations',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      path: '/admin/rbac',
      title: 'RBAC',
      description: 'Gestion des rôles et permissions',
      priority: 0.7,
      changefreq: 'weekly',
      requiresAuth: true,
      requiresAdmin: true,
    },
  ],
  Onboarding: [
    {
      path: '/onboarding',
      title: 'Onboarding',
      description: 'Configuration initiale du compte',
      priority: 0.8,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/onboarding/welcome',
      title: 'Onboarding Welcome',
      description: 'Écran de bienvenue',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/onboarding/profile',
      title: 'Onboarding Profile',
      description: 'Configuration du profil',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/onboarding/preferences',
      title: 'Onboarding Preferences',
      description: 'Configuration des préférences',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/onboarding/team',
      title: 'Onboarding Team',
      description: "Configuration de l'équipe",
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
    {
      path: '/onboarding/complete',
      title: 'Onboarding Complete',
      description: 'Onboarding terminé',
      priority: 0.7,
      changefreq: 'monthly',
      requiresAuth: true,
    },
  ],
  Outils: [
    {
      path: '/ai/chat',
      title: 'AI Chat',
      description: 'Chat avec OpenAI GPT ou Anthropic Claude',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: true, // Protected page
    },
    {
      path: '/monitoring',
      title: 'Monitoring',
      description: 'Page de monitoring',
      priority: 0.6,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
    {
      path: '/docs',
      title: 'Documentation',
      description: 'Documentation du projet',
      priority: 0.8,
      changefreq: 'weekly',
      requiresAuth: false, // Page publique
    },
  ],
};

// Fonction utilitaire pour obtenir toutes les pages en liste plate
export function getAllPages(): SitemapPage[] {
  return Object.values(sitePages).flat();
}

// Fonction utilitaire pour obtenir les pages pour le sitemap XML
export function getPagesForXML(): Array<{ path: string; priority: number; changefreq: string }> {
  return getAllPages().map((page) => ({
    path: page.path,
    priority: page.priority || 0.5,
    changefreq: page.changefreq || 'monthly',
  }));
}
