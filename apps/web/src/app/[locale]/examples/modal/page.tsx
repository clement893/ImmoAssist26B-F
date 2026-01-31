'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui';
import { Info } from 'lucide-react';

export default function ExampleModalPage() {
  const { showToast } = useToast();
  const [isSimpleModalOpen, setIsSimpleModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleFormSubmit = () => {
    if (!formData.name || !formData.email) {
      showToast({
        message: 'Veuillez remplir tous les champs',
        type: 'error',
      });
      return;
    }

    showToast({
      message: 'Formulaire soumis avec succès',
      type: 'success',
    });
    setIsFormModalOpen(false);
    setFormData({ name: '', email: '' });
  };

  const handleConfirm = () => {
    showToast({
      message: 'Action confirmée',
      type: 'success',
    });
    setIsConfirmModalOpen(false);
  };

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Modal / Dialog</h1>
        <p className="text-muted-foreground">
          Modals simples, confirmations et formulaires dans modals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple Modal */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Modal Simple</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Modal basique avec titre et contenu
            </p>
            <Button onClick={() => setIsSimpleModalOpen(true)} variant="primary">
              Ouvrir Modal Simple
            </Button>
          </div>
        </Card>

        {/* Form Modal */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Modal avec Formulaire</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Modal contenant un formulaire avec validation
            </p>
            <Button onClick={() => setIsFormModalOpen(true)} variant="primary">
              Ouvrir Modal Formulaire
            </Button>
          </div>
        </Card>

        {/* Confirm Modal */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Modal de Confirmation</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Modal de confirmation pour actions critiques
            </p>
            <Button onClick={() => setIsConfirmModalOpen(true)} variant="danger">
              Ouvrir Confirmation
            </Button>
          </div>
        </Card>

        {/* Info Modal */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Modal d'Information</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Modal pour afficher des informations
            </p>
            <Button onClick={() => setIsInfoModalOpen(true)} variant="outline">
              Ouvrir Info Modal
            </Button>
          </div>
        </Card>
      </div>

      {/* Simple Modal */}
      <Modal
        isOpen={isSimpleModalOpen}
        onClose={() => setIsSimpleModalOpen(false)}
        title="Modal Simple"
        size="md"
        footer={
          <Button onClick={() => setIsSimpleModalOpen(false)} variant="primary">
            Fermer
          </Button>
        }
      >
        <p className="text-muted-foreground">
          Ceci est un exemple de modal simple. Vous pouvez ajouter n'importe quel contenu ici.
        </p>
      </Modal>

      {/* Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Formulaire dans Modal"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsFormModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleFormSubmit} variant="primary">
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Votre nom"
            required
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="votre@email.com"
            required
            fullWidth
          />
        </div>
      </Modal>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirm}
        title="Confirmer l'action"
        message="Êtes-vous sûr de vouloir effectuer cette action ? Cette action est irréversible."
        confirmText="Confirmer"
        cancelText="Annuler"
        variant="danger"
      />

      {/* Info Modal */}
      <Modal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Information"
        size="md"
        footer={
          <Button onClick={() => setIsInfoModalOpen(false)} variant="primary">
            Compris
          </Button>
        }
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-info-600 dark:text-info-400 mt-0.5" />
          <div>
            <p className="text-muted-foreground">
              Ceci est une modal d'information. Elle peut être utilisée pour afficher des messages
              importants ou des instructions à l'utilisateur.
            </p>
          </div>
        </div>
      </Modal>

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Modal simple avec contenu personnalisé</li>
            <li>✅ Modal avec formulaire et validation</li>
            <li>✅ Modal de confirmation pour actions critiques</li>
            <li>✅ Gestion du focus et accessibilité</li>
            <li>✅ Fermeture par overlay ou ESC</li>
            <li>✅ Tailles personnalisables (sm, md, lg, xl, full)</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
