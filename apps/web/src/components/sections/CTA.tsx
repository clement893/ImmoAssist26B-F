import ButtonLink from '../ui/ButtonLink';
export default function CTA() {
  return (
    <section
      className="py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-muted dark:to-muted"
      aria-labelledby="cta-heading"
    >
      {' '}
      <div className="container mx-auto px-4">
        {' '}
        <div className="max-w-4xl mx-auto text-center">
          {' '}
          <h2 id="cta-heading" className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            {' '}
            Prêt à démarrer votre projet ?{' '}
          </h2>{' '}
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            {' '}
            Rejoignez des milliers de développeurs qui utilisent ce template pour créer des
            applications modernes et performantes.{' '}
          </p>{' '}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            role="group"
            aria-label="Actions d'appel à l'action"
          >
            {' '}
            <ButtonLink
              href="/components"
              size="lg"
              variant="primary"
              aria-label="Explorer les composants disponibles"
            >
              {' '}
              Explorer les composants{' '}
            </ButtonLink>{' '}
            <ButtonLink
              href="/auth/register"
              size="lg"
              variant="secondary"
              aria-label="Créer un compte gratuit pour commencer"
            >
              {' '}
              Créer un compte gratuit{' '}
            </ButtonLink>{' '}
            <ButtonLink
              href="https://github.com/your-username/your-repo-name"
              target="_blank"
              size="lg"
              variant="outline"
              aria-label="Voir le projet sur GitHub (ouvre dans un nouvel onglet)"
            >
              {' '}
              Voir sur GitHub{' '}
            </ButtonLink>{' '}
          </div>{' '}
        </div>{' '}
      </div>{' '}
    </section>
  );
}
