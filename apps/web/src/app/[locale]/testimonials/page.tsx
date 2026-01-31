/**
 * Testimonials Page
 * Carousel of testimonials from previous participants
 */

'use client';

import { useState } from 'react';
import { Container } from '@/components/ui';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  location: string;
  rating: number;
  text: string;
  photo?: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Marie Dubois',
    role: 'Psychologue clinicienne',
    location: 'Paris, France',
    rating: 5,
    text: "Une formation exceptionnelle ! Une façon unique de rendre l'ACT accessible et applicable. J'ai pu immédiatement intégrer les techniques dans ma pratique. Les deux jours ont été intenses mais extrêmement enrichissants.",
  },
  {
    id: 2,
    name: 'Jean Martin',
    role: 'Thérapeute',
    location: 'Lyon, France',
    rating: 5,
    text: "La meilleure formation en ACT que j'ai suivie. Russ est un formateur remarquable, clair et passionné. Les démonstrations pratiques et les exercices m'ont permis de vraiment comprendre et maîtriser les concepts.",
  },
  {
    id: 3,
    name: 'Sophie Laurent',
    role: 'Psychothérapeute',
    location: 'Marseille, France',
    rating: 5,
    text: "Cette masterclass a transformé ma pratique professionnelle. Les outils et techniques partagés sont directement applicables. L'accès aux enregistrements vidéo est un vrai plus pour réviser les concepts clés.",
  },
  {
    id: 4,
    name: 'Pierre Moreau',
    role: 'Psychologue',
    location: 'Toulouse, France',
    rating: 5,
    text: 'Formation de très haute qualité. Les formateurs sont des experts qui savent transmettre leur savoir avec passion. Les cas cliniques et les exercices pratiques ont été particulièrement utiles. Je recommande vivement !',
  },
  {
    id: 5,
    name: 'Isabelle Bernard',
    role: 'Thérapeute ACT',
    location: 'Bordeaux, France',
    rating: 5,
    text: 'Une expérience inoubliable ! La structure de la formation est parfaite, avec un bon équilibre entre théorie et pratique. Les ressources fournies sont complètes et très utiles. Merci pour cette formation exceptionnelle.',
  },
];

export default function TestimonialsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <Container className="py-20 md:py-32">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="swiss-display text-6xl md:text-8xl mb-6 text-foreground">Témoignages</h1>
            <hr className="my-8 border-border mx-auto max-w-md" />
            <p className="text-xl text-muted-foreground mt-6 max-w-3xl mx-auto">
              Découvrez ce que disent les participants de la masterclass ACT.
            </p>
          </div>

          {/* Testimonial Carousel */}
          <div className="mb-12">
            {currentTestimonial && (
              <div className="bg-muted border border-border p-8 md:p-12 relative">
                {/* Stars */}
                <div className="flex items-center gap-1 mb-6">
                  {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-foreground text-foreground"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Testimonial Text */}
                <blockquote className="text-xl md:text-2xl text-foreground mb-8 leading-relaxed">
                  "{currentTestimonial.text}"
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-muted-foreground font-bold text-lg">
                      {currentTestimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-foreground text-lg">{currentTestimonial.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {currentTestimonial.role} • {currentTestimonial.location}
                    </div>
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevTestimonial}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-background border border-border hover:border-foreground transition-colors"
                  aria-label="Témoignage précédent"
                >
                  <ChevronLeft className="w-6 h-6 text-foreground" aria-hidden="true" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-background border border-border hover:border-foreground transition-colors"
                  aria-label="Témoignage suivant"
                >
                  <ChevronRight className="w-6 h-6 text-foreground" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToTestimonial(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-foreground' : 'bg-muted'
                }`}
                aria-label={`Aller au témoignage ${index + 1}`}
              />
            ))}
          </div>

          {/* All Testimonials Grid */}
          <hr className="my-16 border-border" />

          <div>
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-12 text-center">
              Tous les Témoignages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="border border-border p-6 hover:border-foreground transition-colors"
                >
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-foreground text-foreground"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="text-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-muted-foreground font-bold">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-foreground">{testimonial.name}</div>
                      <div className="text-muted-foreground text-sm">
                        {testimonial.role} • {testimonial.location}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-6">Rejoignez-les</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Découvrez pourquoi tant de professionnels recommandent cette masterclass.
            </p>
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
