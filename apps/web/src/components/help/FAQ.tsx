/** * FAQ Component * * Displays frequently asked questions in an accordion format. * * @component */ 'use client';
import { Accordion } from '@/components/ui';
import type { AccordionItem } from '@/components/ui';
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}
export interface FAQProps {
  faqs?: FAQItem[];
  className?: string;
}
const defaultFAQs: FAQItem[] = [
  {
    id: '1',
    question: 'How do I get started?',
    answer:
      'To get started, simply create an account and follow the onboarding wizard. You can access it from the dashboard after logging in.',
    category: 'Getting Started',
  },
  {
    id: '2',
    question: 'How do I reset my password?',
    answer:
      'You can reset your password by clicking on"Forgot Password" on the login page. You will receive an email with instructions to reset your password.',
    category: 'Account',
  },
  {
    id: '3',
    question: 'How do I contact support?',
    answer:
      'You can contact support by visiting the Contact Support page or by creating a support ticket from your dashboard.',
    category: 'Support',
  },
  {
    id: '4',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit cards, PayPal, and bank transfers. You can manage your payment methods in the Billing settings.',
    category: 'Billing',
  },
  {
    id: '5',
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time from the Billing settings page. Your access will continue until the end of your current billing period.',
    category: 'Billing',
  },
];
/** * FAQ Component * * Displays FAQ items in an accordion format. */ export default function FAQ({
  faqs = defaultFAQs,
  className,
}: FAQProps) {
  const accordionItems: AccordionItem[] = faqs.map((faq) => ({
    id: faq.id,
    title: faq.question,
    content: faq.answer,
  }));
  return (
    <div className={className}>
      {' '}
      <Accordion items={accordionItems} />{' '}
    </div>
  );
}
