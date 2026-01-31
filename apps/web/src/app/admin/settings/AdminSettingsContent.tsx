'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Alert from '@/components/ui/Alert';
import Container from '@/components/ui/Container';
import Input from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';

export default function AdminSettingsContent() {
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { apiClient } = await import('@/lib/api');
      const response = await apiClient.put('/v1/users/me', formData);
      const updatedUser = response.data;
      setUser(updatedUser);
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Paramètres Administrateur</h1>
        <p className="text-muted-foreground">Gérez les paramètres de votre compte administrateur</p>
      </div>

      {error && (
        <Alert variant="error" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          Paramètres mis à jour avec succès
        </Alert>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div className="flex gap-4">
            <Button type="submit" variant="primary" loading={loading}>
              Enregistrer
            </Button>
          </div>
        </form>
      </Card>
    </Container>
  );
}
