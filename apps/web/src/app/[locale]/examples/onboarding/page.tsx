'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';

export default function ExampleOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
  });

  const steps = [
    { number: 1, title: 'Bienvenue', description: 'Commençons par vous connaître' },
    { number: 2, title: 'Votre Organisation', description: 'Informations sur votre organisation' },
    { number: 3, title: 'Votre Rôle', description: 'Comment allez-vous utiliser la plateforme ?' },
    { number: 4, title: 'Terminé', description: 'Vous êtes prêt à commencer !' },
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Log onboarding completion (development only)
    if (process.env.NODE_ENV === 'development') {
      const { logger } = require('@/lib/logger');
      logger.info('Onboarding completed', { step: 3 });
    }
    setCurrentStep(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-muted dark:to-muted flex items-center justify-center px-4 py-12">
      <Container>
        <Card className="w-full max-w-2xl mx-auto">
          <div className="p-8">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                {steps.map((step, index) => (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                          currentStep >= step.number
                            ? 'bg-primary-600 text-background'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentStep > step.number ? '✓' : step.number}
                      </div>
                      <div className="mt-2 text-xs text-center text-muted-foreground hidden sm:block">
                        {step.title}
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          currentStep > step.number ? 'bg-primary' : 'bg-muted'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-8">
              {currentStep === 1 && (
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">
                    Bienvenue sur la plateforme !
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Nous sommes ravis de vous accueillir. Commençons par quelques informations de
                    base.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <Input
                        label="Votre nom *"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Jean Dupont"
                        fullWidth
                      />
                    </div>
                    <div>
                      <Input
                        label="Votre email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="jean@example.com"
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Votre Organisation</h2>
                  <p className="text-muted-foreground mb-6">Parlez-nous de votre organisation.</p>
                  <div>
                    <Input
                      label="Nom de l'organisation *"
                      type="text"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Mon Organisation"
                      fullWidth
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Votre Rôle</h2>
                  <p className="text-muted-foreground mb-6">
                    Comment allez-vous utiliser la plateforme ?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Manager', 'Fundraiser', 'Administrator', 'Analyst'].map((role) => (
                      <Button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        variant={formData.role === role ? 'primary' : 'outline'}
                        className="h-auto p-4 text-left"
                      >
                        <div className="font-semibold">{role}</div>
                        <div className="text-sm mt-1 opacity-80">
                          {role === 'Manager' && 'Gérer les équipes et les campagnes'}
                          {role === 'Fundraiser' && 'Gérer les projets et les ressources'}
                          {role === 'Administrator' && 'Administrer la plateforme'}
                          {role === 'Analyst' && 'Analyser les données et générer des rapports'}
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mb-6">
                    <svg
                      className="h-8 w-8 text-success-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-3xl font-bold text-foreground mb-4">Félicitations !</h2>
                  <p className="text-muted-foreground mb-6">
                    Votre profil est maintenant configuré. Vous êtes prêt à commencer à utiliser la
                    plateforme.
                  </p>
                  <Button>Commencer</Button>
                </div>
              )}
            </div>

            {/* Navigation */}
            {currentStep < 4 && (
              <div className="flex justify-between">
                <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
                  Précédent
                </Button>
                <Button
                  onClick={currentStep === 3 ? handleSubmit : handleNext}
                  disabled={
                    (currentStep === 1 && (!formData.name || !formData.email)) ||
                    (currentStep === 2 && !formData.organization) ||
                    (currentStep === 3 && !formData.role)
                  }
                >
                  {currentStep === 3 ? 'Terminer' : 'Suivant'}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </Container>
    </div>
  );
}
