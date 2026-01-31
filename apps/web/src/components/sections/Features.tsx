import Card from '../ui/Card';
interface Feature {
  icon: string;
  title: string;
  description: string;
}
const features: Feature[] = [
  {
    icon: '🚀',
    title: 'Next.js 16',
    description:
      'Framework React moderne avec App Router, Server Components et optimisations automatiques',
  },
  {
    icon: '⚡',
    title: 'FastAPI',
    description:
      'Framework Python haute performance avec support async et documentation automatique',
  },
  {
    icon: '🗄️',
    title: 'PostgreSQL',
    description: 'Base de données relationnelle puissante avec SQLAlchemy ORM et migrations',
  },
  {
    icon: '🔐',
    title: 'Authentification JWT',
    description: "Système d'authentification sécurisé avec tokens et refresh automatique",
  },
  {
    icon: '📦',
    title: 'Monorepo',
    description: 'Architecture monorepo avec Turborepo pour une gestion optimale des dépendances',
  },
  {
    icon: '🐳',
    title: 'Docker Ready',
    description: 'Configuration Docker complète pour un déploiement facile et reproductible',
  },
  {
    icon: '🎨',
    title: '30+ Composants UI',
    description:
      'Bibliothèque complète de composants réutilisables pour construire des SaaS modernes',
  },
];
export default function Features() {
  return (
    <section className="py-20 bg-background">
      {' '}
      <div className="container mx-auto px-4">
        {' '}
        <div className="text-center mb-16">
          {' '}
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {' '}
            Fonctionnalités{' '}
          </h2>{' '}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {' '}
            Tout ce dont vous avez besoin pour démarrer votre projet rapidement{' '}
          </p>{' '}
        </div>{' '}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {' '}
          {features.map((feature, index) => (
            <Card key={index} hover className="text-center">
              {' '}
              <div className="text-5xl mb-4">{feature.icon}</div>{' '}
              <h3 className="text-xl font-bold text-foreground mb-3"> {feature.title} </h3>{' '}
              <p className="text-muted-foreground leading-relaxed"> {feature.description} </p>{' '}
            </Card>
          ))}{' '}
        </div>{' '}
      </div>{' '}
    </section>
  );
}
