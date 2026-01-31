'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Loading from '@/components/ui/Loading';
import { FileText, Download, Upload, Search } from 'lucide-react';

export default function OACIQPage() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForm, setSelectedForm] = useState<string>('');

  const oaciqForms = [
    { id: '1', name: 'Formulaire de déclaration de vente', type: 'Vente', version: '2024.1' },
    { id: '2', name: 'Formulaire d\'inspection', type: 'Inspection', version: '2024.1' },
    { id: '3', name: 'Formulaire de mandat de vente', type: 'Mandat', version: '2024.2' },
    { id: '4', name: 'Formulaire de promesse d\'achat', type: 'Achat', version: '2024.1' },
  ];

  const filteredForms = oaciqForms.filter(form =>
    form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    form.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = (formId: string) => {
    setLoading(true);
    // Simuler le téléchargement
    setTimeout(() => {
      setLoading(false);
      alert(`Téléchargement du formulaire ${formId}...`);
    }, 1000);
  };

  const handleUpload = () => {
    setLoading(true);
    // Simuler l'upload
    setTimeout(() => {
      setLoading(false);
      alert('Formulaire téléversé avec succès');
    }, 1000);
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Formulaires OACIQ</h1>
          <p className="text-muted-foreground mt-1">
            Accédez et gérez les formulaires officiels de l&apos;Organisme d&apos;autorégulation du courtage immobilier du Québec
          </p>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Rechercher un formulaire..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                label="Type de formulaire"
                options={[
                  { label: 'Tous les types', value: '' },
                  { label: 'Vente', value: 'Vente' },
                  { label: 'Achat', value: 'Achat' },
                  { label: 'Mandat', value: 'Mandat' },
                  { label: 'Inspection', value: 'Inspection' },
                ]}
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Forms List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => (
            <Card key={form.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{form.name}</h3>
                      <p className="text-sm text-muted-foreground">{form.type}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Version {form.version}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleDownload(form.id)}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedForm(form.id)}
                    className="flex-1"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Ouvrir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Upload Section */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Téléverser un formulaire complété</h2>
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                Glissez-déposez votre formulaire ici ou cliquez pour sélectionner
              </p>
              <Button variant="outline" onClick={handleUpload} disabled={loading}>
                {loading ? (
                  <>
                    <Loading />
                    <span className="ml-2">Téléversement...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Sélectionner un fichier
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {loading && (
          <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
            <Loading />
          </div>
        )}
      </div>
    </Container>
  );
}
