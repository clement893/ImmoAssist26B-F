/**
 * Below-the-fold marketing sections (lazy loaded for better LCP)
 */
'use client';

import {
  LogosSection,
  ProblemSection,
  FeaturesSection,
  BenefitsSection,
  TestimonialsSection,
  PricingSection,
  CtaSection,
} from '@/components/marketing';

export default function BelowFoldSections() {
  return (
    <>
      <LogosSection />
      <ProblemSection />
      <FeaturesSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
    </>
  );
}
