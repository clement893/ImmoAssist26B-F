'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';
import Alert from '@/components/ui/Alert';
import { useToast } from '@/components/ui';
import { handleApiError } from '@/lib/errors';

export default function ExampleAuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot'>('login');
  const { showToast } = useToast();

  // Login state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});
  const [isRegistering, setIsRegistering] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (loginData.email === 'demo@example.com' && loginData.password === 'password123') {
        showToast({
          message: 'Connexion réussie !',
          type: 'success',
        });
      } else {
        throw new Error('Email ou mot de passe incorrect');
      }
    } catch (error) {
      const appError = handleApiError(error);
      setLoginError(appError.message);
      showToast({
        message: appError.message,
        type: 'error',
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!registerData.email) errors.email = 'Email requis';
    if (!registerData.password) errors.password = 'Mot de passe requis';
    if (registerData.password.length < 8) {
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    }
    if (registerData.password !== registerData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }
    if (!registerData.name) errors.name = 'Nom requis';

    if (Object.keys(errors).length > 0) {
      setRegisterErrors(errors);
      return;
    }

    setIsRegistering(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast({
        message: 'Inscription réussie ! Vérifiez votre email.',
        type: 'success',
      });
      setRegisterData({ email: '', password: '', confirmPassword: '', name: '' });
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message,
        type: 'error',
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingReset(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast({
        message: 'Email de réinitialisation envoyé !',
        type: 'success',
      });
      setForgotEmail('');
      setActiveTab('login');
    } catch (error) {
      const appError = handleApiError(error);
      showToast({
        message: appError.message,
        type: 'error',
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Authentification</h1>
        <p className="text-muted-foreground">
          Exemples de formulaires d'authentification avec validation et gestion d'erreurs
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'login' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('login')}
            className="flex-1"
          >
            Connexion
          </Button>
          <Button
            variant={activeTab === 'register' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('register')}
            className="flex-1"
          >
            Inscription
          </Button>
          <Button
            variant={activeTab === 'forgot' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('forgot')}
            className="flex-1"
          >
            Mot de passe oublié
          </Button>
        </div>

        {/* Login Form */}
        {activeTab === 'login' && (
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Connexion</h2>

              {loginError && (
                <Alert variant="error" className="mb-4">
                  {loginError}
                </Alert>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  placeholder="demo@example.com"
                  required
                  fullWidth
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="password123"
                  required
                  fullWidth
                />
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Compte de démonstration :</p>
                  <p>Email: demo@example.com</p>
                  <p>Mot de passe: password123</p>
                </div>
                <Button type="submit" variant="primary" fullWidth disabled={isLoggingIn}>
                  {isLoggingIn ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('forgot')}
                  className="text-sm text-info-600 hover:text-info-700 dark:text-info-400"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Inscription</h2>

              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Nom complet"
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  error={registerErrors.name}
                  required
                  fullWidth
                />
                <Input
                  label="Email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  placeholder="jean@example.com"
                  error={registerErrors.email}
                  required
                  fullWidth
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  placeholder="Minimum 8 caractères"
                  error={registerErrors.password}
                  required
                  fullWidth
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) =>
                    setRegisterData({ ...registerData, confirmPassword: e.target.value })
                  }
                  error={registerErrors.confirmPassword}
                  required
                  fullWidth
                />
                <Button type="submit" variant="primary" fullWidth disabled={isRegistering}>
                  {isRegistering ? 'Inscription...' : "S'inscrire"}
                </Button>
              </form>
            </div>
          </Card>
        )}

        {/* Forgot Password Form */}
        {activeTab === 'forgot' && (
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Réinitialiser le mot de passe
              </h2>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  fullWidth
                />
                <Button type="submit" variant="primary" fullWidth disabled={isSendingReset}>
                  {isSendingReset ? 'Envoi...' : 'Envoyer le lien de réinitialisation'}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setActiveTab('login')}
                  className="text-sm text-info-600 hover:text-info-700 dark:text-info-400"
                >
                  Retour à la connexion
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Code Example */}
        <Card className="mt-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Points clés de cet exemple :
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ Validation des formulaires côté client</li>
              <li>✅ Gestion des erreurs avec handleApiError</li>
              <li>✅ États de chargement (loading states)</li>
              <li>✅ Messages d'erreur contextuels</li>
              <li>✅ Notifications toast pour le feedback</li>
              <li>✅ Navigation entre formulaires</li>
            </ul>
          </div>
        </Card>
      </div>
    </Container>
  );
}
