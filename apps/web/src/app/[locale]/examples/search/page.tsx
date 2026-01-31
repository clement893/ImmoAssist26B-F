'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Container from '@/components/ui/Container';
import { SearchBar } from '@/components/search/SearchBar';
import { useToast } from '@/components/ui';
import { Search, Filter } from 'lucide-react';

interface SearchResult {
  id: number;
  title: string;
  description: string;
  type: 'user' | 'project' | 'document';
}

export default function ExampleSearchPage() {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    type: '' as 'user' | 'project' | 'document' | '',
    dateRange: '',
  });

  // Mock data
  const mockData: SearchResult[] = [
    {
      id: 1,
      title: 'Jean Dupont',
      description: 'Développeur Full-Stack',
      type: 'user',
    },
    {
      id: 2,
      title: 'Projet E-commerce',
      description: 'Plateforme de vente en ligne',
      type: 'project',
    },
    {
      id: 3,
      title: 'Documentation API',
      description: "Guide complet de l'API REST",
      type: 'document',
    },
    {
      id: 4,
      title: 'Marie Martin',
      description: 'Designer UI/UX',
      type: 'user',
    },
    {
      id: 5,
      title: 'Projet Dashboard',
      description: 'Tableau de bord analytique',
      type: 'project',
    },
  ];

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      const filtered = mockData
        .filter(
          (item) =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase())
        )
        .filter((item) => !filters.type || item.type === filters.type);

      setResults(filtered);
      setSearchQuery(query);
    } catch (error) {
      showToast({
        message: 'Erreur lors de la recherche',
        type: 'error',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (searchQuery) {
      handleSearch(searchQuery);
    }
  }, [filters]);

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Exemple Recherche Avancée</h1>
        <p className="text-muted-foreground">
          Barre de recherche avec autocomplete, filtres avancés et résultats en temps réel
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Bar */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Recherche avec Autocomplete</h2>
            <SearchBar
              entityType="users"
              placeholder="Rechercher des utilisateurs, projets..."
              onResults={(results) => {
                setResults(results as SearchResult[]);
              }}
              showAutocomplete
            />
          </div>
        </Card>

        {/* Advanced Filters */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres Avancés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="">Tous les types</option>
                  <option value="user">Utilisateurs</option>
                  <option value="project">Projets</option>
                  <option value="document">Documents</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Plage de dates
                </label>
                <Input
                  type="date"
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  fullWidth
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Search Results */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Résultats de Recherche</h2>
              {isSearching && (
                <div className="text-sm text-muted-foreground">Recherche en cours...</div>
              )}
            </div>

            {results.length === 0 && searchQuery && !isSearching ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucun résultat trouvé pour "{searchQuery}"</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Entrez une recherche pour voir les résultats
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-4 border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{result.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{result.description}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200">
                        {result.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Recherche avec autocomplete</li>
            <li>✅ Filtres avancés</li>
            <li>✅ Résultats en temps réel</li>
            <li>✅ Gestion des états de chargement</li>
            <li>✅ Messages d'état (aucun résultat, recherche...)</li>
            <li>✅ Highlight des résultats</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
