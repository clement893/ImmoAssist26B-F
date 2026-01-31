/**
 * Pricing Page - Masterclass ACT
 * Pricing options: Early Bird, Regular, Group
 */

'use client';

import { Container, Card } from '@/components/ui';
import { CheckCircle } from 'lucide-react';

export default function PricingPage() {
  const pricingOptions = [
    {
      id: 'early-bird',
      name: 'Early Bird',
      price: 450,
      currency: 'EUR',
      description: 'Tarif préférentiel pour réservations anticipées',
      popular: true,
      features: [
        'Accès complet à la masterclass (2 jours)',
        'Manuel de formation (PDF)',
        'Accès aux enregistrements vidéo (3 mois)',
        'Fiches pratiques et outils',
        'Certificat de participation',
        'Support et ressources en ligne',
      ],
      buttonText: 'Réserver maintenant',
    },
    {
      id: 'regular',
      name: 'Tarif Standard',
      price: 550,
      currency: 'EUR',
      description: 'Tarif standard pour réservations',
      popular: false,
      features: [
        'Accès complet à la masterclass (2 jours)',
        'Manuel de formation (PDF)',
        'Accès aux enregistrements vidéo (3 mois)',
        'Fiches pratiques et outils',
        'Certificat de participation',
        'Support et ressources en ligne',
      ],
      buttonText: 'Réserver maintenant',
    },
    {
      id: 'group',
      name: 'Tarif Groupe',
      price: 400,
      currency: 'EUR',
      description: 'Tarif réduit pour groupes de 3 personnes ou plus',
      popular: false,
      features: [
        'Accès complet à la masterclass (2 jours)',
        'Manuel de formation (PDF)',
        'Accès aux enregistrements vidéo (3 mois)',
        'Fiches pratiques et outils',
        'Certificat de participation',
        'Support et ressources en ligne',
        'Réduction de groupe appliquée',
      ],
      buttonText: 'Contacter pour groupe',
    },
  ];

  const faqItems = [
    {
      question: 'Quand se termine la période Early Bird ?',
      answer:
        'La période Early Bird se termine généralement 30 jours avant chaque événement. Les places sont limitées, nous vous recommandons de réserver tôt.',
    },
    {
      question: 'Comment fonctionne le tarif groupe ?',
      answer:
        "Le tarif groupe s'applique pour les réservations de 3 personnes ou plus. Contactez-nous pour obtenir un devis personnalisé et organiser votre réservation de groupe.",
    },
    {
      question: 'Puis-je annuler ma réservation ?',
      answer:
        "Oui, vous pouvez annuler votre réservation jusqu'à 14 jours avant l'événement pour un remboursement complet. Les annulations après cette date peuvent être soumises à des frais.",
    },
    {
      question: 'Que comprend le prix ?',
      answer:
        "Le prix comprend l'accès complet à la masterclass de 2 jours, le manuel de formation, l'accès aux enregistrements vidéo pendant 3 mois, toutes les ressources pratiques, le certificat de participation et le support en ligne.",
    },
    {
      question: 'Y a-t-il des frais supplémentaires ?',
      answer:
        "Non, le prix indiqué est tout compris. Les repas et l'hébergement ne sont pas inclus dans le prix.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="swiss-display text-6xl md:text-8xl mb-6 text-foreground">Tarifs</h1>
            <hr className="my-8 border-border mx-auto max-w-md" />
            <p className="text-xl text-muted-foreground mt-6 max-w-3xl mx-auto">
              Choisissez l'option qui vous convient pour participer à la masterclass ACT.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {pricingOptions.map((option) => (
              <Card
                key={option.id}
                className={`p-8 ${option.popular ? 'border-2 border-foreground' : ''}`}
              >
                {option.popular && (
                  <div className="mb-4">
                    <span className="inline-block px-4 py-1 bg-foreground text-background text-sm font-bold">
                      POPULAIRE
                    </span>
                  </div>
                )}
                <h2 className="text-3xl font-black text-foreground mb-2">{option.name}</h2>
                <p className="text-muted-foreground mb-6 text-sm">{option.description}</p>
                <div className="mb-6">
                  <span className="text-5xl font-black text-foreground">{option.price}</span>
                  <span className="text-xl text-muted-foreground ml-2">{option.currency}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle
                        className="w-5 h-5 text-foreground mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <span className="text-foreground text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={option.id === 'group' ? 'mailto:contact@contextpsy.fr' : '/cities'}
                  className="block w-full px-6 py-3 bg-foreground text-background font-bold text-center hover:bg-muted transition-colors"
                >
                  {option.buttonText}
                </a>
              </Card>
            ))}
          </div>

          <hr className="my-16 border-border" />

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-12 text-center">
              Questions Fréquentes
            </h2>
            <div className="space-y-6">
              {faqItems.map((item, index) => (
                <div key={index} className="border-b border-border pb-6">
                  <h3 className="text-xl font-bold text-foreground mb-3">{item.question}</h3>
                  <p className="text-foreground leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <p className="text-lg text-muted-foreground mb-6">
              Des questions ? Contactez-nous pour plus d'informations.
            </p>
            <a
              href="mailto:contact@contextpsy.fr"
              className="inline-block px-12 py-4 bg-foreground text-background font-bold text-lg hover:bg-muted transition-colors"
            >
              Nous contacter
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
}
