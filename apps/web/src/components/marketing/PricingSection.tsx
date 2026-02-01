'use client';

import { motion } from 'framer-motion';
import { Container, Card, Button } from '@/components/ui';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/routing';

const plans = [
  {
    name: 'Essentiel',
    price: '49 $/mois',
    description: 'Pour les courtiers indépendants',
    features: [
      'Gestion de 10 transactions/mois',
      'Tous les formulaires OACIQ',
      'Validation de conformité',
      'Portail client de base',
      'Support par email',
    ],
    cta: 'Choisir Essentiel',
    ctaLink: '/pricing?plan=essentiel',
    popular: false,
  },
  {
    name: 'Pro',
    price: '99 $/mois',
    description: 'Pour les courtiers performants',
    features: [
      'Transactions illimitées',
      'Tous les formulaires OACIQ',
      'Validation de conformité avancée',
      'Portail client premium',
      'Extension Chrome Centris',
      'Léa - Assistante IA',
      'Support prioritaire',
    ],
    cta: 'Choisir Pro',
    ctaLink: '/pricing?plan=pro',
    popular: true,
  },
  {
    name: 'Agence',
    price: 'Sur mesure',
    description: 'Pour les agences et équipes',
    features: [
      'Tout du plan Pro',
      'Gestion multi-courtiers',
      'Tableau de bord agence',
      'API et intégrations',
      'Formation personnalisée',
      'Gestionnaire de compte dédié',
    ],
    cta: 'Nous contacter',
    ctaLink: '/contact',
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-gray-900">
      <Container maxWidth="7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            Un investissement, pas une dépense
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choisissez le plan qui correspond à votre ambition.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Le plus populaire
                  </span>
                </div>
              )}
              <Card
                className={`h-full p-8 ${
                  plan.popular
                    ? 'border-2 border-blue-500 shadow-xl bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-800 dark:to-gray-700'
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                }`}
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <div className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                      {plan.price}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {plan.description}
                    </p>
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.ctaLink} className="mt-auto">
                    <Button
                      variant={plan.popular ? 'primary' : 'outline'}
                      fullWidth
                      size="lg"
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-12 text-gray-600 dark:text-gray-400"
        >
          <p className="text-lg">
            Essai gratuit de 14 jours. Aucune carte de crédit requise. Annulez à tout moment.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
