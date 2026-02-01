'use client';

import { motion } from 'framer-motion';
import { Container, Card } from '@/components/ui';
import { Clock, AlertTriangle, Frown } from 'lucide-react';

const problems = [
  {
    icon: Clock,
    title: 'Passez-vous plus de temps sur les formulaires que sur les visites ?',
    description: 'Les courtiers passent en moyenne 15 heures par semaine sur la paperasse. C\'est presque deux jours de travail perdus.',
  },
  {
    icon: AlertTriangle,
    title: 'Une seule erreur OACIQ peut coûter des milliers de dollars',
    description: 'Les amendes pour non-conformité peuvent atteindre 50 000 $. Sans parler de la réputation perdue.',
  },
  {
    icon: Frown,
    title: 'Les clients attendent des réponses instantanées, pas des délais administratifs',
    description: 'Dans un marché compétitif, une réponse tardive peut faire perdre une vente.',
  },
];

export default function ProblemSection() {
  return (
    <section className="py-20 sm:py-32 bg-gray-50 dark:bg-gray-800">
      <Container maxWidth="7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            La paperasse vous coûte plus cher que vous ne le pensez
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Chaque minute passée sur l'administratif est une minute perdue pour vos clients.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.6 }}
              >
                <Card
                  hover
                  className="h-full p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                      {problem.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
