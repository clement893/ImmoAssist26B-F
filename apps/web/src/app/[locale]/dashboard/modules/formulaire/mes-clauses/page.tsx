'use client';

import { useState } from 'react';
import Container from '@/components/ui/Container';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Loading from '@/components/ui/Loading';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { FileText, Plus, Edit, Trash2, Copy, Search, Save } from 'lucide-react';

interface Clause {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function MesClausesPage() {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClause, setEditingClause] = useState<Clause | null>(null);
  const [clauseTitle, setClauseTitle] = useState('');
  const [clauseContent, setClauseContent] = useState('');
  const [clauseCategory, setClauseCategory] = useState('');

  const [clauses, setClauses] = useState<Clause[]>([
    {
      id: '1',
      title: 'Clause d\'inspection pré-achat',
      content: 'L\'acheteur a le droit de faire inspecter le bien immobilier dans les 10 jours suivant l\'acceptation de l\'offre...',
      category: 'Inspection',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Clause de financement',
      content: 'L\'offre est conditionnelle à l\'obtention d\'un prêt hypothécaire d\'un montant minimum de...',
      category: 'Financement',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
    },
    {
      id: '3',
      title: 'Clause de vente de propriété actuelle',
      content: 'L\'offre est conditionnelle à la vente de la propriété actuelle de l\'acheteur...',
      category: 'Condition',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-05',
    },
  ]);

  const filteredClauses = clauses.filter(clause =>
    clause.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clause.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clause.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Inspection', 'Financement', 'Condition', 'Autre'];

  const handleCreate = () => {
    setEditingClause(null);
    setClauseTitle('');
    setClauseContent('');
    setClauseCategory('');
    setShowModal(true);
  };

  const handleEdit = (clause: Clause) => {
    setEditingClause(clause);
    setClauseTitle(clause.title);
    setClauseContent(clause.content);
    setClauseCategory(clause.category);
    setShowModal(true);
  };

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      if (editingClause) {
        // Update existing clause
        setClauses(clauses.map(c =>
          c.id === editingClause.id
            ? {
                ...c,
                title: clauseTitle,
                content: clauseContent,
                category: clauseCategory,
                updatedAt: new Date().toISOString().split('T')[0],
              }
            : c
        ));
      } else {
        // Create new clause
        const newClause: Clause = {
          id: Date.now().toString(),
          title: clauseTitle,
          content: clauseContent,
          category: clauseCategory,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        setClauses([...clauses, newClause]);
      }
      setLoading(false);
      setShowModal(false);
      setEditingClause(null);
      setClauseTitle('');
      setClauseContent('');
      setClauseCategory('');
    }, 500);
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette clause ?')) {
      setClauses(clauses.filter(c => c.id !== id));
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Clause copiée dans le presse-papiers');
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
      'Inspection': 'info',
      'Financement': 'success',
      'Condition': 'warning',
      'Autre': 'default',
    };
    return colors[category] || 'default';
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Mes Clauses</h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre bibliothèque de clauses réutilisables pour vos transactions immobilières
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle clause
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher une clause..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Clauses List */}
        {filteredClauses.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Aucune clause trouvée' : 'Aucune clause créée'}
              </p>
              {!searchQuery && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre première clause
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredClauses.map((clause) => (
              <Card key={clause.id} hover>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{clause.title}</h3>
                        <Badge variant={getCategoryColor(clause.category)}>
                          {clause.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                        {clause.content}
                      </p>
                      <div className="text-xs text-muted-foreground">
                        Créée le {clause.createdAt}
                        {clause.updatedAt !== clause.createdAt && ` • Modifiée le ${clause.updatedAt}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(clause.content)}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(clause)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(clause.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingClause(null);
            setClauseTitle('');
            setClauseContent('');
            setClauseCategory('');
          }}
          title={editingClause ? 'Modifier la clause' : 'Nouvelle clause'}
          size="lg"
        >
          <div className="space-y-4">
            <Input
              label="Titre de la clause"
              value={clauseTitle}
              onChange={(e) => setClauseTitle(e.target.value)}
              placeholder="Ex: Clause d'inspection pré-achat"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Catégorie</label>
              <select
                value={clauseCategory}
                onChange={(e) => setClauseCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-background"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contenu de la clause</label>
              <textarea
                value={clauseContent}
                onChange={(e) => setClauseContent(e.target.value)}
                placeholder="Saisissez le texte de votre clause..."
                rows={8}
                className="w-full px-3 py-2 border rounded-lg bg-background resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setShowModal(false);
                  setEditingClause(null);
                  setClauseTitle('');
                  setClauseContent('');
                  setClauseCategory('');
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading || !clauseTitle || !clauseContent || !clauseCategory}
              >
                {loading ? (
                  <>
                    <Loading />
                    <span className="ml-2">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
}
