'use client';

import { motion } from 'framer-motion';
import { Container, Card } from '@/components/ui';

const benefits = [
  {
    number: '+10 heures/semaine',
    title: 'Récupérez une journée de travail complète chaque semaine',
    description: 'Automatisez la paperasse et concentrez-vous sur ce qui compte : vendre et servir vos clients.',
  },
  {
    number: '100% conformité',
    title: 'Dormez sur vos deux oreilles. Chaque formulaire est validé.',
    description: 'Notre moteur de conformité OACIQ vérifie chaque champ en temps réel. Zéro risque d\'amende.',
  },
  {
    number: 'x2 satisfaction client',
    title: 'Offrez une expérience numérique qui impressionne',
    description: 'Vos clients accèdent à un portail moderne où ils suivent leur transaction en temps réel.',
  },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-violet-600 dark:from-blue-800 dark:to-violet-800">
      <Container maxWidth="7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Passez de débordé à dominant
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto">
            Des résultats mesurables dès la première semaine.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <Card className="h-full p-8 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-0 shadow-xl">
                <div className="text-center">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                    {benefit.number}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
