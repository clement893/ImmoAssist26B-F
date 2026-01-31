/**
 * FAQ Page
 * Frequently asked questions with accordion interface
 */

'use client';

import { useState } from 'react';
import { Container } from '@/components/ui';
import { ChevronDown, Search } from 'lucide-react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqItems: FAQItem[] = [
  {
    id: 1,
    category: 'Général',
    question: "Qu'est-ce que l'ACT (Thérapie d'Acceptation et d'Engagement) ?",
    answer:
      "L'ACT est une approche thérapeutique basée sur la pleine conscience qui aide les personnes à accepter leurs pensées et émotions difficiles tout en s'engageant dans des actions alignées avec leurs valeurs. Elle combine des techniques de pleine conscience, d'acceptation et de changement comportemental.",
  },
  {
    id: 3,
    category: 'Réservation',
    question: 'Comment puis-je réserver ma place ?',
    answer:
      'Vous pouvez réserver votre place directement en ligne en sélectionnant une ville et une date sur la page "Villes & Dates". Le processus de réservation est simple et sécurisé. Vous recevrez une confirmation par email.',
  },
  {
    id: 4,
    category: 'Réservation',
    question: 'Puis-je annuler ma réservation ?',
    answer:
      "Oui, vous pouvez annuler votre réservation jusqu'à 14 jours avant l'événement pour un remboursement complet. Les annulations après cette date peuvent être soumises à des frais d'annulation. Contactez-nous pour plus d'informations.",
  },
  {
    id: 5,
    category: 'Réservation',
    question: 'Y a-t-il un tarif réduit pour les groupes ?',
    answer:
      'Oui, nous offrons un tarif groupe pour les réservations de 3 personnes ou plus. Contactez-nous à contact@contextpsy.fr pour obtenir un devis personnalisé et organiser votre réservation de groupe.',
  },
  {
    id: 6,
    category: 'Programme',
    question: 'Quel est le format de la masterclass ?',
    answer:
      'La masterclass se déroule sur 2 jours intensifs, de 9h à 17h30 avec une pause déjeuner. Elle combine des présentations théoriques, des démonstrations pratiques, des exercices en groupe et des études de cas.',
  },
  {
    id: 7,
    category: 'Programme',
    question: 'Quels sont les prérequis pour participer ?',
    answer:
      "La masterclass est ouverte à tous les professionnels de la santé mentale (psychologues, psychothérapeutes, médecins, etc.). Aucun prérequis spécifique n'est nécessaire, bien qu'une connaissance de base en psychothérapie soit recommandée.",
  },
  {
    id: 8,
    category: 'Programme',
    question: 'Recevrai-je un certificat de participation ?',
    answer:
      'Oui, tous les participants recevront un certificat de participation à la fin de la masterclass. Ce certificat atteste de votre participation à la formation.',
  },
  {
    id: 9,
    category: 'Ressources',
    question: 'Quelles ressources sont incluses dans le prix ?',
    answer:
      "Le prix comprend l'accès complet à la masterclass de 2 jours, le manuel de formation en PDF, l'accès aux enregistrements vidéo pendant 3 mois, toutes les fiches pratiques et outils, le certificat de participation et le support en ligne.",
  },
  {
    id: 10,
    category: 'Ressources',
    question: "Puis-je accéder aux enregistrements après l'événement ?",
    answer:
      "Oui, vous aurez accès aux enregistrements vidéo de la formation pendant 3 mois après l'événement. Cela vous permet de réviser les concepts et techniques à votre rythme.",
  },
  {
    id: 11,
    category: 'Pratique',
    question: 'Où se déroulent les événements ?',
    answer:
      'Les événements se déroulent dans différentes villes. Consultez la page "Villes & Dates" pour voir toutes les villes disponibles et leurs lieux spécifiques. Les adresses complètes sont indiquées pour chaque événement.',
  },
  {
    id: 12,
    category: 'Pratique',
    question: 'Les repas sont-ils inclus ?',
    answer:
      "Non, les repas ne sont pas inclus dans le prix. Nous vous fournirons une liste de restaurants à proximité du lieu de l'événement. Des pauses café sont prévues pendant la journée.",
  },
  {
    id: 13,
    category: 'Pratique',
    question: 'Y a-t-il un parking disponible ?',
    answer:
      'La disponibilité du parking varie selon les lieux. Les informations détaillées sur le parking et les transports en commun sont fournies dans la confirmation de réservation et sur la page de chaque événement.',
  },
];

const categories = ['Tous', ...Array.from(new Set(faqItems.map((item) => item.category)))];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (id: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id);
    } else {
      newOpenItems.add(id);
    }
    setOpenItems(newOpenItems);
  };

  const filteredItems = faqItems.filter((item) => {
    const matchesCategory = selectedCategory === 'Tous' || item.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="swiss-display text-6xl md:text-8xl mb-6 text-foreground">
              Questions Fréquentes
            </h1>
            <hr className="my-8 border-border mx-auto max-w-md" />
            <p className="text-xl text-muted-foreground mt-6 max-w-3xl mx-auto">
              Trouvez les réponses aux questions les plus courantes sur la masterclass ACT.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-12">
            <div className="relative mb-6">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Rechercher une question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-border focus:border-foreground focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 border font-bold transition-colors ${
                    selectedCategory === category
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-foreground hover:bg-muted'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Aucune question trouvée pour cette recherche.
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="border border-border">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex items-center justify-between p-6 text-left hover:bg-muted transition-colors"
                    aria-expanded={openItems.has(item.id)}
                  >
                    <div className="flex-1 pr-4">
                      <div className="text-xs font-bold text-muted-foreground mb-2">
                        {item.category}
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{item.question}</h3>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground transition-transform flex-shrink-0 ${
                        openItems.has(item.id) ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {openItems.has(item.id) && (
                    <div className="px-6 pb-6">
                      <div className="pt-4 border-t border-border">
                        <p className="text-foreground leading-relaxed">{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <p className="text-lg text-muted-foreground mb-6">
              Vous avez d'autres questions ? N'hésitez pas à nous contacter.
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
