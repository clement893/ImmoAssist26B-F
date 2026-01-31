'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import Heading from '@/components/ui/Heading';
import Text from '@/components/ui/Text';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';

const componentCategories = [
  {
    id: 'ui',
    name: 'UI Components',
    description: 'Composants UI de base (boutons, inputs, cards, etc.)',
    count: 91,
    icon: '🎨',
    components: [
      { name: 'Button', description: 'Bouton avec plusieurs variantes et états' },
      { name: 'Input', description: 'Champ de saisie avec validation' },
      { name: 'Card', description: 'Carte de contenu flexible' },
      { name: 'Badge', description: 'Badge et étiquettes' },
      { name: 'Alert', description: 'Alertes et notifications' },
      { name: 'Modal', description: 'Modales et dialogues' },
      { name: 'DataTable', description: 'Tableaux de données avec tri et filtres' },
      { name: 'Select', description: 'Listes déroulantes' },
      { name: 'Checkbox', description: 'Cases à cocher' },
      { name: 'Radio', description: 'Boutons radio' },
      { name: 'Switch', description: 'Interrupteurs' },
      { name: 'Textarea', description: 'Zones de texte multilignes' },
      { name: 'Dropdown', description: 'Menus déroulants' },
      { name: 'Popover', description: 'Popovers et tooltips' },
      { name: 'Tooltip', description: 'Infobulles' },
      { name: 'Accordion', description: 'Accordéons' },
      { name: 'Tabs', description: 'Onglets' },
      { name: 'Stepper', description: 'Étapes de progression' },
      { name: 'Progress', description: 'Barres de progression' },
      { name: 'Spinner', description: 'Indicateurs de chargement' },
      { name: 'Skeleton', description: 'Placeholders de chargement' },
      { name: 'Avatar', description: 'Avatars utilisateurs' },
      { name: 'Divider', description: 'Séparateurs' },
      { name: 'Breadcrumbs', description: 'Fil d\'Ariane' },
      { name: 'Pagination', description: 'Pagination' },
    ],
  },
  {
    id: 'layout',
    name: 'Layout',
    description: 'Composants de mise en page',
    count: 14,
    icon: '📐',
    components: [
      { name: 'Header', description: 'En-tête de page' },
      { name: 'Footer', description: 'Pied de page' },
      { name: 'Sidebar', description: 'Barre latérale' },
      { name: 'Container', description: 'Conteneur de page' },
      { name: 'PageHeader', description: 'En-tête de section' },
      { name: 'Section', description: 'Section de contenu' },
      { name: 'Grid', description: 'Grille responsive' },
      { name: 'Stack', description: 'Empilement vertical/horizontal' },
    ],
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Composants de formulaire',
    count: 15,
    icon: '📝',
    components: [
      { name: 'Form', description: 'Formulaire avec validation' },
      { name: 'FormField', description: 'Champ de formulaire' },
      { name: 'FormLabel', description: 'Label de formulaire' },
      { name: 'FormError', description: 'Messages d\'erreur' },
      { name: 'DatePicker', description: 'Sélecteur de date' },
      { name: 'TimePicker', description: 'Sélecteur d\'heure' },
      { name: 'FileUpload', description: 'Upload de fichiers' },
      { name: 'RichTextEditor', description: 'Éditeur de texte riche' },
    ],
  },
  {
    id: 'auth',
    name: 'Authentication',
    description: 'Composants d\'authentification',
    count: 8,
    icon: '🔐',
    components: [
      { name: 'LoginForm', description: 'Formulaire de connexion' },
      { name: 'SignupForm', description: 'Formulaire d\'inscription' },
      { name: 'MFA', description: 'Authentification à deux facteurs' },
      { name: 'ProtectedRoute', description: 'Route protégée' },
      { name: 'SocialAuth', description: 'Connexion sociale (OAuth)' },
      { name: 'PasswordReset', description: 'Réinitialisation de mot de passe' },
    ],
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Composants de facturation',
    count: 9,
    icon: '💳',
    components: [
      { name: 'PricingCard', description: 'Carte de tarification' },
      { name: 'SubscriptionCard', description: 'Carte d\'abonnement' },
      { name: 'InvoiceList', description: 'Liste de factures' },
      { name: 'PaymentMethodForm', description: 'Formulaire de méthode de paiement' },
      { name: 'BillingDashboard', description: 'Tableau de bord de facturation' },
    ],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Composants d\'analyse',
    count: 6,
    icon: '📈',
    components: [
      { name: 'AnalyticsDashboard', description: 'Tableau de bord analytique' },
      { name: 'Chart', description: 'Graphiques et visualisations' },
      { name: 'ReportBuilder', description: 'Constructeur de rapports' },
      { name: 'DataExport', description: 'Export de données' },
    ],
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    description: 'Composants de monitoring',
    count: 9,
    icon: '📡',
    components: [
      { name: 'PerformanceDashboard', description: 'Tableau de bord de performance' },
      { name: 'LogsViewer', description: 'Visualiseur de logs' },
      { name: 'HealthStatus', description: 'Statut de santé' },
      { name: 'MetricsCard', description: 'Cartes de métriques' },
    ],
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Composants de paramètres',
    count: 12,
    icon: '⚙️',
    components: [
      { name: 'UserSettings', description: 'Paramètres utilisateur' },
      { name: 'OrganizationSettings', description: 'Paramètres d\'organisation' },
      { name: 'SecuritySettings', description: 'Paramètres de sécurité' },
      { name: 'NotificationSettings', description: 'Paramètres de notifications' },
      { name: 'APISettings', description: 'Paramètres API' },
    ],
  },
  {
    id: 'activity',
    name: 'Activity',
    description: 'Composants de suivi d\'activité',
    count: 6,
    icon: '📋',
    components: [
      { name: 'ActivityFeed', description: 'Flux d\'activité' },
      { name: 'ActivityLog', description: 'Journal d\'activité' },
      { name: 'AuditTrail', description: 'Piste d\'audit' },
      { name: 'EventHistory', description: 'Historique d\'événements' },
    ],
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Composants de notifications',
    count: 5,
    icon: '🔔',
    components: [
      { name: 'NotificationCenter', description: 'Centre de notifications' },
      { name: 'NotificationBell', description: 'Cloche de notifications' },
      { name: 'Toast', description: 'Notifications toast' },
    ],
  },
  {
    id: 'admin',
    name: 'Admin',
    description: 'Composants d\'administration',
    count: 9,
    icon: '👤',
    components: [
      { name: 'UserManagement', description: 'Gestion des utilisateurs' },
      { name: 'RoleManagement', description: 'Gestion des rôles' },
      { name: 'TeamManagement', description: 'Gestion des équipes' },
      { name: 'InvitationManagement', description: 'Gestion des invitations' },
    ],
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Composants de gestion de contenu',
    count: 10,
    icon: '📄',
    components: [
      { name: 'ContentEditor', description: 'Éditeur de contenu' },
      { name: 'MediaLibrary', description: 'Bibliothèque média' },
      { name: 'PageBuilder', description: 'Constructeur de pages' },
    ],
  },
  {
    id: 'integrations',
    name: 'Integrations',
    description: 'Composants d\'intégration',
    count: 5,
    icon: '🔌',
    components: [
      { name: 'IntegrationList', description: 'Liste des intégrations' },
      { name: 'WebhookManager', description: 'Gestionnaire de webhooks' },
      { name: 'APIDocumentation', description: 'Documentation API' },
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    description: 'Composants d\'optimisation',
    count: 7,
    icon: '⚡',
    components: [
      { name: 'PerformanceDashboard', description: 'Tableau de bord de performance' },
      { name: 'OptimisticUpdates', description: 'Mises à jour optimistes' },
      { name: 'OfflineSupport', description: 'Support hors ligne' },
    ],
  },
  {
    id: 'onboarding',
    name: 'Onboarding',
    description: 'Composants d\'onboarding',
    count: 7,
    icon: '🚀',
    components: [
      { name: 'OnboardingWizard', description: 'Assistant d\'onboarding' },
      { name: 'WelcomeScreen', description: 'Écran de bienvenue' },
      { name: 'ProfileSetup', description: 'Configuration du profil' },
    ],
  },
  {
    id: 'help',
    name: 'Help',
    description: 'Composants d\'aide',
    count: 8,
    icon: '❓',
    components: [
      { name: 'HelpCenter', description: 'Centre d\'aide' },
      { name: 'ContactSupport', description: 'Contact support' },
      { name: 'FAQ', description: 'FAQ' },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Composants avancés',
    count: 5,
    icon: '🔧',
    components: [
      { name: 'CodeEditor', description: 'Éditeur de code' },
      { name: 'MarkdownEditor', description: 'Éditeur Markdown' },
      { name: 'FileManager', description: 'Gestionnaire de fichiers' },
      { name: 'ImageEditor', description: 'Éditeur d\'images' },
    ],
  },
];

export default function ComponentsPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  // Select all categories
  const selectAll = () => {
    setSelectedCategories(componentCategories.map((cat) => cat.id));
  };

  // Deselect all categories
  const deselectAll = () => {
    setSelectedCategories([]);
  };

  // Filter components based on selected categories and search query
  const filteredComponents = useMemo(() => {
    let components: Array<{ category: string; categoryName: string; categoryIcon: string; name: string; description: string }> = [];

    // Get components from selected categories (or all if none selected)
    const categoriesToShow =
      selectedCategories.length > 0
        ? componentCategories.filter((cat) => selectedCategories.includes(cat.id))
        : componentCategories;

    categoriesToShow.forEach((category) => {
      category.components.forEach((component) => {
        components.push({
          category: category.id,
          categoryName: category.name,
          categoryIcon: category.icon,
          name: component.name,
          description: component.description,
        });
      });
    });

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      components = components.filter(
        (comp) =>
          comp.name.toLowerCase().includes(query) ||
          comp.description.toLowerCase().includes(query) ||
          comp.categoryName.toLowerCase().includes(query)
      );
    }

    return components;
  }, [selectedCategories, searchQuery]);

  return (
    <Container className="py-8">
      <div className="mb-8">
        <Heading level={1} className="mb-4">
          Composants
        </Heading>
        <Text className="text-muted-foreground">
          Explorez tous les composants disponibles dans la bibliothèque. Tous les composants sont
          liés au thème actif et s'adaptent automatiquement aux couleurs et styles configurés.
        </Text>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Link href="/theme">
          <Button variant="primary" size="sm">
            <span className="mr-2">🎨</span>
            Voir le thème actif
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={selectAll}>
            Tout sélectionner
          </Button>
          <Button variant="secondary" size="sm" onClick={deselectAll}>
            Tout désélectionner
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Rechercher un composant..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {/* Category Filters */}
      <Card className="mb-8 p-6">
        <Heading level={2} className="mb-4 text-lg">
          Filtrer par catégorie
        </Heading>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {componentCategories.map((category) => (
            <div key={category.id} className="flex items-center gap-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={selectedCategories.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              <label
                htmlFor={`category-${category.id}`}
                className="flex items-center gap-2 cursor-pointer flex-1"
              >
                <span className="text-xl">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
                <Badge variant="default" className="ml-auto">
                  {category.count}
                </Badge>
              </label>
            </div>
          ))}
        </div>
      </Card>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <Text className="text-muted-foreground">
          {filteredComponents.length} composant{filteredComponents.length > 1 ? 's' : ''} trouvé
          {selectedCategories.length > 0
            ? ` dans ${selectedCategories.length} catégorie${selectedCategories.length > 1 ? 's' : ''}`
            : ' (toutes catégories)'}
        </Text>
        {selectedCategories.length > 0 && (
          <Button variant="ghost" size="sm" onClick={deselectAll}>
            Réinitialiser les filtres
          </Button>
        )}
      </div>

      {/* Components Grid */}
      {filteredComponents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComponents.map((component, index) => (
            <Card key={`${component.category}-${component.name}-${index}`} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{component.categoryIcon}</span>
                  <Badge variant="default" className="text-xs">
                    {component.categoryName}
                  </Badge>
                </div>
              </div>
              <Heading level={3} className="mb-2 text-lg">
                {component.name}
              </Heading>
              <Text className="text-sm text-muted-foreground">{component.description}</Text>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Text className="text-muted-foreground">
            {searchQuery
              ? `Aucun composant trouvé pour "${searchQuery}"`
              : 'Sélectionnez au moins une catégorie pour afficher les composants'}
          </Text>
          {searchQuery && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setSearchQuery('')}>
              Effacer la recherche
            </Button>
          )}
        </Card>
      )}
    </Container>
  );
}
