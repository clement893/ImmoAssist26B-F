'use client';

import { motion } from 'framer-motion';
import { Container, Card } from '@/components/ui';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Sophie Martin',
    title: 'Courtière immobilière résidentiel',
    agency: 'Royal LePage',
    quote: 'ImmoAssist a changé ma vie. Je passe moins de temps sur l\'admin et plus de temps à closer des deals. Un must-have pour tout courtier sérieux.',
    rating: 5,
  },
  {
    name: 'Jean Tremblay',
    title: 'Courtier immobilier commercial',
    agency: 'RE/MAX',
    quote: 'La conformité OACIQ me stressait énormément. Avec ImmoAssist, je sais que chaque formulaire est parfait. Je dors mieux la nuit.',
    rating: 5,
  },
  {
    name: 'Marie Dubois',
    title: 'Propriétaire d\'agence',
    agency: 'Sutton',
    quote: 'Mes courtiers sont plus productifs et mes clients sont plus satisfaits. Le ROI est évident dès le premier mois.',
    rating: 5,
  },
];

export default function TestimonialsSection() {
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
            Ce que les courtiers les plus performants en disent
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
            >
              <Card className="h-full p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col h-full">
                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-5 h-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow leading-relaxed italic">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {testimonial.agency}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
