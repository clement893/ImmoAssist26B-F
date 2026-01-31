'use client';

// Force dynamic rendering to avoid static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState } from 'react';
import Container from '@/components/ui/Container';
import PricingCardSimple from '@/components/ui/PricingCardSimple';
import BillingPeriodToggle from '@/components/ui/BillingPeriodToggle';
import FAQItem from '@/components/ui/FAQItem';

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  buttonText: string;
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      period: billingPeriod,
      description: 'Parfait pour les petites organisations',
      features: [
        "Jusqu'à 100 utilisateurs",
        '1 projet actif',
        'Support email',
        'Rapports de base',
        'API limitée',
      ],
      buttonText: 'Commencer',
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      period: billingPeriod,
      description: 'Pour les organisations en croissance',
      features: [
        "Jusqu'à 1,000 utilisateurs",
        'Projets illimités',
        'Support prioritaire',
        'Rapports avancés',
        'API complète',
        'Intégrations tierces',
        'Formulaires personnalisés',
      ],
      popular: true,
      buttonText: 'Essayer gratuitement',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      period: billingPeriod,
      description: 'Pour les grandes organisations',
      features: [
        'Utilisateurs illimités',
        'Toutes les fonctionnalités',
        'Support dédié 24/7',
        'Rapports personnalisés',
        'API illimitée',
        'Intégrations personnalisées',
        'Formulaires avancés',
        'Multi-organisations',
        'RBAC avancé',
      ],
      buttonText: 'Nous contacter',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 dark:from-muted dark:to-muted">
      <Container className="py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">Tarifs</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Choisissez le plan qui correspond à vos besoins
          </p>

          <BillingPeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCardSimple
              key={plan.id}
              plan={plan}
              billingPeriod={billingPeriod}
              onSelect={(_planId, _period) => {
                // Navigation is handled by the PricingCardSimple component
              }}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            <FAQItem
              question="Puis-je changer de plan à tout moment ?"
              answer="Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les changements prendront effet immédiatement."
            />
            <FAQItem
              question="Y a-t-il un essai gratuit ?"
              answer="Oui, tous les plans incluent un essai gratuit de 14 jours. Aucune carte de crédit requise."
            />
            <FAQItem
              question="Quels modes de paiement acceptez-vous ?"
              answer="Nous acceptons les cartes de crédit (Visa, Mastercard, American Express) et les virements bancaires pour les plans Enterprise."
            />
          </div>
        </div>
      </Container>
    </div>
  );
}
