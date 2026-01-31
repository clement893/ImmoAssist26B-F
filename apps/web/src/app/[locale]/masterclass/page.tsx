/**
 * Masterclass Programme Page
 * Detailed description of the 2-day masterclass program
 */

'use client';

import { Container } from '@/components/ui';
import { Clock, Target, BookOpen, CheckCircle } from 'lucide-react';

export default function MasterclassPage() {
  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16">
            <h1 className="swiss-display text-6xl md:text-8xl mb-6 text-foreground">
              Le Programme
            </h1>
            <hr className="my-8 border-border" />
          </div>

          {/* Description */}
          <div className="mb-16">
            <p className="text-xl text-foreground leading-relaxed mb-6">
              Cette masterclass intensive de 2 jours vous plongera au cœur de la Thérapie
              d'Acceptation et d'Engagement (ACT). Vous découvrirez les fondements théoriques, les
              techniques pratiques et les applications cliniques de cette approche thérapeutique
              révolutionnaire.
            </p>
            <p className="text-xl text-foreground leading-relaxed">
              À travers des démonstrations en direct, des exercices pratiques et des études de cas,
              vous découvrirez l'ACT pour transformer votre pratique professionnelle.
            </p>
          </div>

          <hr className="my-16 border-border" />

          {/* Day 1 */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center text-2xl font-black">
                1
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground">
                Jour 1 : Fondements de l'ACT
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Clock
                  className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Matin (9h-12h30)</h3>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Introduction à l'ACT : historique et philosophie</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Le modèle hexaflex : les 6 processus fondamentaux</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Démonstrations pratiques et exercices</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock
                  className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Après-midi (14h-17h30)</h3>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>L'acceptation psychologique et la défusion cognitive</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Le contact avec le moment présent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Exercices pratiques et études de cas</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-16 border-border" />

          {/* Day 2 */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center text-2xl font-black">
                2
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-foreground">
                Jour 2 : Applications Avancées
              </h2>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Clock
                  className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Matin (9h-12h30)</h3>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Le soi comme contexte et les valeurs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>L'engagement dans l'action</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Intégration des processus ACT dans la pratique</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Clock
                  className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Après-midi (14h-17h30)</h3>
                  <ul className="space-y-2 text-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Applications spécifiques : anxiété, dépression, douleur chronique</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Défis courants et pièges à éviter</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 text-foreground mt-1 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span>Questions-réponses et cas cliniques</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-16 border-border" />

          {/* Learning Objectives */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <Target className="w-8 h-8 text-foreground" aria-hidden="true" />
              <h2 className="text-4xl md:text-5xl font-black text-foreground">
                Objectifs Pédagogiques
              </h2>
            </div>
            <ul className="space-y-4 text-lg text-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Comprendre les fondements théoriques et philosophiques de l'ACT</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Maîtriser les 6 processus fondamentaux du modèle hexaflex</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Apprendre des techniques pratiques applicables immédiatement</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Développer des compétences pour intégrer l'ACT dans votre pratique</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Gérer les défis courants et éviter les pièges thérapeutiques</span>
              </li>
            </ul>
          </div>

          <hr className="my-16 border-border" />

          {/* Included Resources */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <BookOpen className="w-8 h-8 text-foreground" aria-hidden="true" />
              <h2 className="text-4xl md:text-5xl font-black text-foreground">
                Ressources Incluses
              </h2>
            </div>
            <ul className="space-y-4 text-lg text-foreground">
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Manuel de formation complet (format PDF)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Accès aux enregistrements vidéo de la formation (3 mois)</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Fiches pratiques et outils thérapeutiques</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Certificat de participation</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle
                  className="w-6 h-6 text-foreground mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>Support et ressources complémentaires en ligne</span>
              </li>
            </ul>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <a
              href="/cities"
              className="inline-block px-12 py-4 bg-foreground text-background font-bold text-lg hover:bg-muted transition-colors"
            >
              Réserver ma place
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
