/**
 * Marketing Landing Page
 * Professional landing page for ImmoAssist targeting Quebec real estate brokers
 */

'use client';

import {
  HeroSection,
  LogosSection,
  ProblemSection,
  FeaturesSection,
  BenefitsSection,
  TestimonialsSection,
  PricingSection,
  CtaSection,
} from '@/components/marketing';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeroSection />
      <LogosSection />
      <ProblemSection />
      <FeaturesSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
    </div>
  );
}
