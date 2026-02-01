'use client';

import { motion } from 'framer-motion';
import { Container, Card } from '@/components/ui';
import {
  GanttChartSquare,
  ShieldCheck,
  MessageSquare,
  FolderOpen,
  TrendingUp,
  Plug,
  LayoutDashboard,
} from 'lucide-react';

const features = [
  {
    icon: GanttChartSquare,
    title: 'Orchestrateur de transactions',
    description: 'Suivez chaque étape de vos transactions, de l\'offre d\'achat à la signature chez le notaire. Aucun détail n\'est oublié.',
  },
  {
    icon: ShieldCheck,
    title: 'Expert réglementaire OACIQ',
    description: 'Validez vos formulaires en temps réel. Chaque champ est vérifié pour garantir la conformité totale.',
  },
  {
    icon: MessageSquare,
    title: 'Assistant relationnel client',
    description: 'Communiquez avec vos clients via un portail dédié. Messages, documents, tâches, tout est centralisé.',
  },
  {
    icon: FolderOpen,
    title: 'Gestionnaire documentaire',
    description: 'Centralisez tous vos documents. Retrouvez n\'importe quel formulaire en 3 secondes grâce à la recherche intelligente.',
  },
  {
    icon: TrendingUp,
    title: 'Analyste prédictif',
    description: 'Anticipez les risques et identifiez les opportunités grâce à l\'analyse de vos données historiques.',
  },
  {
    icon: Plug,
    title: 'Connecteur universel',
    description: 'Importez des propriétés depuis Centris en un clic avec notre extension Chrome. Fini le copier-coller.',
  },
  {
    icon: LayoutDashboard,
    title: 'Superviseur intelligent - Léa',
    description: 'Gardez une vue d\'ensemble sur votre business. Léa, votre assistante IA, vous guide à chaque étape.',
  },
];

export default function FeaturesSection() {
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
            ImmoAssist : Votre agence immobilière augmentée
          </h2>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Sept intelligences artificielles qui travaillent pour vous, 24/7.
          </p>
        </motion.div>

        {/* Grid 3x3 with 7 features + 2 empty spaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card
                  hover
                  className="h-full p-6 bg-gradient-to-br from-blue-50 to-violet-50 dark:from-gray-800 dark:to-gray-700 border border-blue-200 dark:border-gray-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex flex-col">
                    <div className="w-12 h-12 rounded-xl bg-blue-500 dark:bg-blue-600 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
          {/* Empty spaces for 3x3 grid */}
          <div className="hidden lg:block" />
          <div className="hidden lg:block" />
        </div>
      </Container>
    </section>
  );
}
