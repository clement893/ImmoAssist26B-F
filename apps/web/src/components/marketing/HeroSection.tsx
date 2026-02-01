'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Video background or gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 animate-pulse" />
        {/* Video would go here if available */}
        {/* <video
          autoPlay
          loop
          muted
          className="w-full h-full object-cover opacity-20"
        >
          <source src="/marketing/hero-video.mp4" type="video/mp4" />
        </video> */}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>100% TypeScript</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Conforme OACIQ</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm">
              <Check className="w-4 h-4 text-green-500" />
              <span>Données au Canada</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 dark:text-white leading-tight">
            L'intelligence artificielle pour les courtiers qui voient grand
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl md:text-3xl text-gray-600 dark:text-gray-300 mb-10 max-w-4xl mx-auto leading-relaxed">
            Gagnez 10+ heures par semaine, garantissez votre conformité OACIQ et offrez une expérience client inégalée. Le tout, automatiquement.
          </p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/auth/register">
              <Button
                variant="primary"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              >
                Démarrer mon essai gratuit de 14 jours
              </Button>
            </Link>
            <Link href="/demo">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 rounded-xl border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
              >
                Voir la démo (2 min)
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
