import Card from '../ui/Card';
import Badge from '../ui/Badge';
interface Tech {
  name: string;
  description: string;
  category: 'frontend' | 'backend' | 'database' | 'devops';
}
const technologies: Tech[] = [
  {
    name: 'Next.js 16',
    description: 'Framework React avec App Router et Server Components',
    category: 'frontend',
  },
  {
    name: 'React 19',
    description: 'Bibliothèque UI moderne avec hooks et composants',
    category: 'frontend',
  },
  {
    name: 'TypeScript',
    description: 'Typage statique pour un code plus sûr',
    category: 'frontend',
  },
  {
    name: 'Tailwind CSS 4',
    description: 'Framework CSS utility-first moderne',
    category: 'frontend',
  },
  { name: 'FastAPI', description: 'Framework Python rapide et moderne', category: 'backend' },
  { name: 'SQLAlchemy', description: 'ORM Python avec support async', category: 'backend' },
  {
    name: 'PostgreSQL',
    description: 'Base de données relationnelle robuste',
    category: 'database',
  },
  { name: 'Redis', description: 'Cache et stockage en mémoire', category: 'database' },
  { name: 'Docker', description: 'Conteneurisation pour le déploiement', category: 'devops' },
  { name: 'Railway', description: 'Plateforme de déploiement cloud', category: 'devops' },
];
const categoryColors = {
  frontend: 'info',
  backend: 'success',
  database: 'warning',
  devops: 'error',
} as const;
export default function TechStack() {
  return (
    <section className="py-20 bg-muted" aria-labelledby="tech-stack-heading">
      {' '}
      <div className="container mx-auto px-4">
        {' '}
        <div className="text-center mb-16">
          {' '}
          <h2
            id="tech-stack-heading"
            className="text-4xl md:text-5xl font-bold text-foreground mb-4"
          >
            {' '}
            Stack Technologique{' '}
          </h2>{' '}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {' '}
            Une stack moderne et performante pour vos applications{' '}
          </p>{' '}
        </div>{' '}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          role="list"
          aria-label="Technologies utilisées"
        >
          {' '}
          {technologies.map((tech, index) => (
            <Card key={index} hover className="flex flex-col" role="listitem">
              {' '}
              <div className="flex items-start justify-between mb-3">
                {' '}
                <h3 className="text-lg font-bold text-foreground">{tech.name}</h3>{' '}
                <Badge
                  variant={categoryColors[tech.category]}
                  aria-label={`Catégorie: ${tech.category}`}
                >
                  {' '}
                  {tech.category}{' '}
                </Badge>{' '}
              </div>{' '}
              <p className="text-muted-foreground text-sm flex-grow">{tech.description}</p>{' '}
            </Card>
          ))}{' '}
        </div>{' '}
      </div>{' '}
    </section>
  );
}
