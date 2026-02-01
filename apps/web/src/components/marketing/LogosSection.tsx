'use client';

import { motion } from 'framer-motion';
import { Container } from '@/components/ui';

const logos = [
  { name: 'Royal LePage', src: '/marketing/logos/royal-lepage.svg' },
  { name: 'RE/MAX', src: '/marketing/logos/remax.svg' },
  { name: 'Sutton', src: '/marketing/logos/sutton.svg' },
  { name: 'Century 21', src: '/marketing/logos/century21.svg' },
  { name: 'Proprio Direct', src: '/marketing/logos/proprio-direct.svg' },
  { name: 'Engel & Völkers', src: '/marketing/logos/engel-volkers.svg' },
];

export default function LogosSection() {
  return (
    <section className="py-16 sm:py-20 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
      <Container maxWidth="7xl">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Ils nous font confiance pour automatiser leur succès
          </h2>
        </motion.div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {logos.map((logo, index) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="w-full max-w-[150px] h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <div className="text-gray-400 dark:text-gray-500 font-semibold text-sm">
                {logo.name}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: Horizontal scroll */}
        <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-8 min-w-max">
            {logos.map((logo, index) => (
              <motion.div
                key={logo.name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex-shrink-0 w-32 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
              >
                <div className="text-gray-400 dark:text-gray-500 font-semibold text-xs text-center">
                  {logo.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
