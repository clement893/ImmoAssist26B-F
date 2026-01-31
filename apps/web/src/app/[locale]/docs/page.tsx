'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Container, Badge } from '@/components/ui';

// Force dynamic rendering to avoid CSS file issues during build
export const dynamic = 'force-dynamic';

function DocsContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Handle hash navigation on page load and when hash changes
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash) {
        const element = document.querySelector(hash);
        if (element) {
          // Small delay to ensure page is rendered
          setTimeout(() => {
            const yOffset = -80; // Offset for fixed header if any
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }, 150);
        }
      }
    };

    // Handle initial load
    handleHash();

    // Handle hash changes (when clicking links on the same page)
    window.addEventListener('hashchange', handleHash);

    return () => {
      window.removeEventListener('hashchange', handleHash);
    };
  }, [searchParams]);
  const sections = [
    {
      title: 'Démarrage Rapide',
      description: 'Commencer avec la plateforme',
      links: [
        { title: 'Installation', href: '#installation' },
        { title: 'Configuration', href: '#configuration' },
        { title: 'Premiers pas', href: '#premiers-pas' },
      ],
    },
    {
      title: 'API',
      description: "Documentation de l'API REST",
      links: [
        { title: 'Authentification', href: '#api-auth' },
        { title: 'Endpoints', href: '#api-endpoints' },
        { title: 'Exemples', href: '#api-examples' },
      ],
    },
    {
      title: 'Composants',
      description: 'Composants UI disponibles',
      links: [
        { title: 'Boutons', href: '#components-buttons' },
        { title: 'Formulaires', href: '#components-forms' },
        { title: 'Cartes', href: '#components-cards' },
      ],
    },
    {
      title: 'Guides',
      description: 'Guides et tutoriels',
      links: [
        { title: 'Gestion des utilisateurs', href: '#guides-utilisateurs' },
        { title: 'Création de campagnes', href: '#guides-campagnes' },
        { title: 'Rapports', href: '#guides-rapports' },
      ],
    },
  ];

  return (
    <Container className="py-12">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-foreground mb-4">Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Tout ce dont vous avez besoin pour utiliser la plateforme
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {sections.map((section, index) => (
          <Card key={index} hover className="h-full">
            <h2 className="text-xl font-bold text-foreground mb-2">{section.title}</h2>
            <p className="text-muted-foreground mb-4 text-sm">{section.description}</p>
            <ul className="space-y-2">
              {section.links.map((link, linkIndex) => (
                <li key={linkIndex}>
                  <a
                    href={link.href}
                    className="text-info-600 dark:text-info-400 hover:underline text-sm"
                  >
                    {link.title}
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* API Documentation */}
      <Card id="api-auth" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Documentation API</h2>
        <p className="text-muted-foreground mb-6">
          La documentation complète de l'API est disponible via Swagger UI. Vous pouvez explorer
          tous les endpoints, tester les requêtes et voir les schémas de données.
        </p>
        <div className="flex gap-4 flex-wrap">
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="primary">Ouvrir Swagger UI</Button>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline">Ouvrir ReDoc</Button>
          </a>
        </div>
      </Card>

      {/* API Endpoints */}
      <Card id="api-endpoints" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Endpoints API</h2>
        <p className="text-muted-foreground mb-4">
          L'API REST fournit des endpoints pour l'authentification, la gestion des utilisateurs, des
          projets et bien plus encore.
        </p>
        <p className="text-muted-foreground">
          Consultez la documentation Swagger pour la liste complète des endpoints disponibles.
        </p>
      </Card>

      {/* API Examples */}
      <Card id="api-examples" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Exemples API</h2>
        <p className="text-muted-foreground mb-4">
          Exemples d'utilisation de l'API REST avec différents langages de programmation.
        </p>
        <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm overflow-x-auto border border-border">
          <code>
            {`// Exemple avec fetch
const response = await fetch('/api/v1/users', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();`}
          </code>
        </div>
      </Card>

      {/* Components Section */}
      <Card id="components-buttons" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Composants UI</h2>
        <p className="text-muted-foreground mb-4">
          La bibliothèque de composants inclut des boutons, formulaires, cartes et bien plus encore.
        </p>
        <Link href="/components">
          <Button variant="primary">Explorer les composants</Button>
        </Link>
      </Card>

      <Card id="components-forms" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Formulaires</h2>
        <p className="text-muted-foreground mb-4">
          Composants de formulaire réutilisables avec validation intégrée.
        </p>
        <Link href="/components/forms">
          <Button variant="primary">Voir les formulaires</Button>
        </Link>
      </Card>

      <Card id="components-cards" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Cartes</h2>
        <p className="text-muted-foreground mb-4">
          Composants de carte pour afficher du contenu de manière structurée.
        </p>
        <Link href="/components/layout">
          <Button variant="primary">Voir les cartes</Button>
        </Link>
      </Card>

      {/* Guides Section */}
      <Card id="guides-utilisateurs" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Gestion des utilisateurs</h2>
        <p className="text-muted-foreground mb-4">
          Guide pour gérer les utilisateurs, les rôles et les permissions dans l'application.
        </p>
        <p className="text-muted-foreground">
          Accédez au tableau de bord d'administration pour gérer les utilisateurs.
        </p>
      </Card>

      <Card id="guides-campagnes" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Création de projets</h2>
        <p className="text-muted-foreground mb-4">
          Guide pour créer et gérer des projets dans l'application.
        </p>
        <p className="text-muted-foreground">
          Utilisez le tableau de bord pour créer et organiser vos projets.
        </p>
      </Card>

      <Card id="guides-rapports" className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Rapports</h2>
        <p className="text-muted-foreground mb-4">
          Guide pour générer et consulter les rapports dans l'application.
        </p>
        <p className="text-muted-foreground">
          Les rapports sont disponibles dans le tableau de bord et peuvent être exportés.
        </p>
      </Card>

      {/* Getting Started */}
      <Card className="mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-6">Démarrage Rapide</h2>
        <div className="space-y-6">
          <div id="installation">
            <h3 className="text-xl font-semibold text-foreground mb-3">1. Installation</h3>
            <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm overflow-x-auto border border-border">
              <code>npm install</code>
            </div>
          </div>
          <div id="configuration">
            <h3 className="text-xl font-semibold text-foreground mb-3">2. Configuration</h3>
            <p className="text-muted-foreground mb-3">
              Créez un fichier{' '}
              <Badge variant="default" className="mx-1">
                .env.local
              </Badge>{' '}
              avec vos variables d'environnement :
            </p>
            <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm overflow-x-auto border border-border">
              <code>
                NEXT_PUBLIC_API_URL=http://localhost:8000
                <br />
                NEXTAUTH_URL=http://localhost:3000
                <br />
                NEXTAUTH_SECRET=your-secret-key
              </code>
            </div>
          </div>
          <div id="premiers-pas">
            <h3 className="text-xl font-semibold text-foreground mb-3">3. Lancer le serveur</h3>
            <div className="bg-foreground text-background p-4 rounded-lg font-mono text-sm overflow-x-auto border border-border">
              <code>npm run dev</code>
            </div>
          </div>
        </div>
      </Card>

      {/* Resources */}
      <Card>
        <h2 className="text-3xl font-bold text-foreground mb-6">Ressources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Liens Utiles</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={
                    process.env.NEXT_PUBLIC_GITHUB_URL ||
                    'https://github.com/your-username/your-repo'
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-600 dark:text-info-400 hover:underline"
                >
                  Repository GitHub
                </a>
              </li>
              <li>
                <a href="/examples" className="text-info-600 dark:text-info-400 hover:underline">
                  Exemples de pages
                </a>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-info-600 dark:text-info-400 hover:underline"
                >
                  Tableau de bord
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/your-username/your-repo'}/issues`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-600 dark:text-info-400 hover:underline"
                >
                  Signaler un problème
                </a>
              </li>
              <li>
                <a
                  href={`${process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/your-username/your-repo'}/discussions`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-info-600 dark:text-info-400 hover:underline"
                >
                  Discussions
                </a>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </Container>
  );
}

export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-foreground mb-4">Documentation</h1>
            <p className="text-xl text-muted-foreground">Chargement...</p>
          </div>
        </Container>
      }
    >
      <DocsContent />
    </Suspense>
  );
}
