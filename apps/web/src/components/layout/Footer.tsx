'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder - to be implemented
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer
      className="bg-primary-900 dark:bg-primary-950 text-primary-50 dark:text-primary-100 py-12 md:py-16"
      role="contentinfo"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <h3 className="text-primary-50 font-bold text-xl mb-4">ContextPsy</h3>
            <p className="text-sm text-primary-200 mb-6 leading-relaxed max-w-md">
              Full-stack template built with Next.js and FastAPI. Production-ready and customizable.
            </p>
            <div className="text-sm text-primary-200 mb-4">
              <p>Email: contact@contextpsy.fr</p>
              <p>Téléphone: +33 (0)X XX XX XX XX</p>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-primary-200">Suivez-nous:</span>
              <div className="flex items-center gap-3" role="list" aria-label="Réseaux sociaux">
                {/* Placeholder social links - can be replaced with actual links */}
                <a
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-800 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-600 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900" // UI Revamp - Transition moderne
                  aria-label="Twitter (placeholder)"
                  role="listitem"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-800 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-600 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900" // UI Revamp - Transition moderne
                  aria-label="GitHub (placeholder)"
                  role="listitem"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-800 hover:bg-primary-600 dark:bg-primary-800 dark:hover:bg-primary-600 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900" // UI Revamp - Transition moderne
                  aria-label="LinkedIn (placeholder)"
                  role="listitem"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div>
              <h4 className="text-primary-50 font-semibold mb-3 text-sm">Newsletter</h4>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  className="flex-1 px-4 py-2 bg-primary-800 border border-primary-700 rounded-lg text-primary-50 placeholder-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent text-sm"
                  aria-label="Adresse email pour la newsletter"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="whitespace-nowrap"
                  disabled={!email || subscribed}
                >
                  {subscribed ? 'Inscrit!' : "S'abonner"}
                </Button>
              </form>
              {subscribed && (
                <p className="mt-2 text-xs text-primary-400" role="status" aria-live="polite">
                  Merci pour votre inscription!
                </p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-primary-50 font-semibold mb-4 text-base">Contact</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li className="text-primary-200">
                <a
                  href="mailto:contact@contextpsy.fr"
                  className="hover:text-primary-300 transition-modern" // UI Revamp - Transition moderne
                >
                  contact@contextpsy.fr
                </a>
              </li>
              <li className="text-primary-200">+33 (0)X XX XX XX XX</li>
              <li className="text-primary-200">France</li>
            </ul>
          </div>

          {/* Navigation */}
          <nav aria-label="Navigation">
            <h4 className="text-primary-50 font-semibold mb-4 text-base">Navigation</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li>
                <Link
                  href="/sitemap"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Plan du site
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/docs"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/components"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Composants
                </Link>
              </li>
              <li>
                <Link
                  href="/theme"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Thème
                </Link>
              </li>
            </ul>
          </nav>

          {/* Liens Utiles */}
          <nav aria-label="Liens utiles">
            <h4 className="text-primary-50 font-semibold mb-4 text-base">Liens Utiles</h4>
            <ul className="space-y-3 text-sm" role="list">
              <li>
                <a
                  href="https://github.com/your-username"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                  aria-label="GitHub du développeur (ouvre dans un nouvel onglet)"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/your-username/your-repo-name/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                  aria-label="Signaler un bug sur GitHub (ouvre dans un nouvel onglet)"
                >
                  Signaler un bug
                </a>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-primary-200 hover:text-primary-300 dark:hover:text-primary-300 transition-modern focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded inline-block" // UI Revamp - Transition moderne
                >
                  Conditions d'utilisation
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-800 dark:border-primary-700 mt-10 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-primary-200">
            <p>© {currentYear} Nukleo. Tous droits réservés.</p>
            <div className="flex items-center gap-6 flex-wrap">
              <Link
                href="/sitemap"
                className="hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded"
              >
                Plan du site
              </Link>
              <Link
                href="/privacy"
                className="hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded"
              >
                Confidentialité
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 focus:ring-offset-primary-900 rounded"
              >
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
