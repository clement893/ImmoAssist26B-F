'use client';

import { motion } from 'framer-motion';
import { Container, Button } from '@/components/ui';
import { Link } from '@/i18n/routing';

export default function CtaSection() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-blue-600 to-violet-600 dark:from-blue-800 dark:to-violet-800">
      <Container maxWidth="7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-white">
            Prêt à transformer votre carrière ?
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Rejoignez les courtiers qui automatisent leur succès.
          </p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link href="/auth/register">
              <Button
                variant="white"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Démarrer mon essai gratuit
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-6 text-blue-100"
          >
            <Link
              href="/faq"
              className="hover:text-white transition-colors duration-200 underline"
            >
              Voir la FAQ
            </Link>
            <Link
              href="/contact"
              className="hover:text-white transition-colors duration-200 underline"
            >
              Nous contacter
            </Link>
            <Link
              href="/demo"
              className="hover:text-white transition-colors duration-200 underline"
            >
              Planifier une démo
            </Link>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
