'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout';
import { Card, Button, Alert, Loading, Badge } from '@/components/ui';
import DataTable, { type Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import { type Company, type CompanyCreate, type CompanyUpdate } from '@/lib/api/companies';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import CompaniesGallery from '@/components/reseau/CompaniesGallery';
import CompanyForm from '@/components/reseau/CompanyForm';
import CompanyAvatar from '@/components/reseau/CompanyAvatar';
import CompanyFilterBadges from '@/components/reseau/CompanyFilterBadges';
import CompanyCounter from '@/components/reseau/CompanyCounter';
import ViewModeToggle from '@/components/reseau/ViewModeToggle';
import CompanyActionLink from '@/components/reseau/CompanyActionLink';
import CompanyRowActions from '@/components/reseau/CompanyRowActions';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelectFilter from '@/components/reseau/MultiSelectFilter';
import {
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  MoreVertical,
  Trash2,
  HelpCircle,
} from 'lucide-react';
import ImportCompaniesInstructions from '@/components/reseau/ImportCompaniesInstructions';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useInfiniteCompanies,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useDeleteAllCompanies,
  companiesAPI,
} from '@/lib/query/companies';

import type { ViewMode } from '@/components/reseau/ViewModeToggle';

function CompaniesContent() {
  const router = useRouter();
  const { showToast } = useToast();

  // React Query hooks for companies
  const { data: companiesData, isLoading, error: queryError } = useInfiniteCompanies();

  // Mutations
  const createCompanyMutation = useCreateCompany();
  const updateCompanyMutation = useUpdateCompany();
  const deleteCompanyMutation = useDeleteCompany();
  const deleteAllCompaniesMutation = useDeleteAllCompanies();

  // Flatten pages into single array
  const companies = useMemo(() => {
    return companiesData?.pages.flat() || [];
  }, [companiesData]);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filterCountry, setFilterCountry] = useState<string[]>([]);
  const [filterIsClient, setFilterIsClient] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);

  // Debounce search query to avoid excessive re-renders (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Derived state from React Query
  const loading = isLoading;
  const error = queryError ? handleApiError(queryError).message : null;

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const countries = new Set<string>();

    companies.forEach((company) => {
      if (company.country) countries.add(company.country);
    });

    return {
      countries: Array.from(countries).sort(),
    };
  }, [companies]);

  // Filtered companies with debounced search
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      // Country filter: match if no filter or company country is in filter array
      const matchesCountry =
        filterCountry.length === 0 || (company.country && filterCountry.includes(company.country));

      // Client filter: match if no filter or company is_client matches filter
      const matchesClient =
        filterIsClient.length === 0 ||
        filterIsClient.some((filter) => {
          if (filter === 'yes') return company.is_client === true;
          if (filter === 'no') return company.is_client === false;
          return false;
        });

      // Search filter: search in name, website, email (using debounced query)
      const matchesSearch =
        !debouncedSearchQuery ||
        company.name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        company.website?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        company.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesCountry && matchesClient && matchesSearch;
    });
  }, [companies, filterCountry, filterIsClient, debouncedSearchQuery]);

  // Check if any filters are active (use debounced search for display)
  const hasActiveFilters = !!(
    filterCountry.length > 0 ||
    filterIsClient.length > 0 ||
    debouncedSearchQuery
  );

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterCountry([]);
    setFilterIsClient([]);
    setSearchQuery('');
  }, []);

  // Handle create with React Query mutation
  const handleCreate = async (data: CompanyCreate | CompanyUpdate) => {
    try {
      await createCompanyMutation.mutateAsync(data as CompanyCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Entreprise créée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || "Erreur lors de la création de l'entreprise",
        type: 'error',
      });
    }
  };

  // Handle update with React Query mutation
  const handleUpdate = async (data: CompanyCreate | CompanyUpdate) => {
    if (!selectedCompany) return;

    try {
      await updateCompanyMutation.mutateAsync({
        id: selectedCompany.id,
        data: data as CompanyUpdate,
      });
      setShowEditModal(false);
      setSelectedCompany(null);
      showToast({
        message: 'Entreprise modifiée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || "Erreur lors de la modification de l'entreprise",
        type: 'error',
      });
    }
  };

  // Handle delete with React Query mutation
  const handleDelete = async (companyId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      return;
    }

    try {
      await deleteCompanyMutation.mutateAsync(companyId);
      if (selectedCompany?.id === companyId) {
        setSelectedCompany(null);
      }
      showToast({
        message: 'Entreprise supprimée avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || "Erreur lors de la suppression de l'entreprise",
        type: 'error',
      });
    }
  };

  // Handle delete all companies with React Query mutation
  const handleDeleteAll = async () => {
    const count = companies.length;
    if (count === 0) {
      showToast({
        message: 'Aucune entreprise à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUTES les ${count} entreprise(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Toutes les entreprises seront définitivement supprimées. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      const result = await deleteAllCompaniesMutation.mutateAsync();
      setSelectedCompany(null);
      showToast({
        message: result.message || `${result.deleted_count} entreprise(s) supprimée(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des entreprises',
        type: 'error',
      });
    }
  };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Handle import
  const handleImport = async (file: File) => {
    try {
      const result = await companiesAPI.import(file);

      if (result.valid_rows > 0) {
        // Invalidate companies query to refetch after import
        queryClient.invalidateQueries({ queryKey: ['companies'] });

        const logosMsg =
          result.logos_uploaded && result.logos_uploaded > 0
            ? ` (${result.logos_uploaded} logo(s) uploadé(s))`
            : '';
        showToast({
          message: `${result.valid_rows} entreprise(s) importée(s) avec succès${logosMsg}`,
          type: 'success',
        });
      }

      if (result.warnings && result.warnings.length > 0) {
        const warningsText = result.warnings
          .map((w: { row: number; message: string }) => `Ligne ${w.row}: ${w.message}`)
          .join('\n');
        showToast({
          message: `Avertissements d'import:\n${warningsText}`,
          type: 'warning',
          duration: 8000,
        });
      }

      if (result.invalid_rows > 0) {
        showToast({
          message: `${result.invalid_rows} ligne(s) avec erreur(s)`,
          type: 'warning',
        });
      }
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || "Erreur lors de l'import",
        type: 'error',
      });
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await companiesAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entreprises-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast({
        message: 'Export réussi',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || "Erreur lors de l'export",
        type: 'error',
      });
    }
  };

  // Navigate to detail page
  const openDetailPage = (company: Company) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/reseau/entreprises/${company.id}`);
  };

  // Open edit modal
  const openEditModal = (company: Company) => {
    setSelectedCompany(company);
    setShowEditModal(true);
  };

  // Get parent companies for form (exclude self)
  const parentCompanies = useMemo(() => {
    return companies
      .filter((c) => !selectedCompany || c.id !== selectedCompany.id)
      .map((c) => ({ id: c.id, name: c.name }));
  }, [companies, selectedCompany]);

  // Table columns
  const columns: Column<Company>[] = [
    {
      key: 'logo_url',
      label: '',
      sortable: false,
      render: (_value, company) => (
        <div className="flex items-center w-10 h-10">
          <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
            <CompanyAvatar company={company} size="md" className="w-full h-full object-cover" />
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      label: "Nom de l'entreprise",
      sortable: true,
      render: (_value, company) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">{company.name}</div>
            {company.parent_company_name && (
              <div className="text-sm text-muted-foreground">
                Filiale de {company.parent_company_name}
              </div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <CompanyRowActions
              company={company}
              onView={() => openDetailPage(company)}
              onEdit={() => openEditModal(company)}
              onDelete={() => handleDelete(company.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'website',
      label: 'Site web',
      sortable: true,
      render: (value, company) => (
        <CompanyActionLink type="website" value={value ? String(value) : ''} company={company} />
      ),
    },
    {
      key: 'country',
      label: 'Pays',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'is_client',
      label: 'Client',
      sortable: true,
      render: (value) => {
        if (value === undefined || value === null) {
          return <span className="text-muted-foreground">-</span>;
        }
        return value ? (
          <Badge variant="default" className="bg-success-500 text-background">
            Oui
          </Badge>
        ) : (
          <Badge variant="default" className="border border-border">
            Non
          </Badge>
        );
      },
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value, company) => (
        <CompanyActionLink type="email" value={value ? String(value) : ''} company={company} />
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value, company) => (
        <CompanyActionLink type="phone" value={value ? String(value) : ''} company={company} />
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Entreprises"
        description={`Gérez vos entreprises et organisations${companies.length > 0 ? ` - ${companies.length} entreprise${companies.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Entreprises' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Company count with improved visual */}
          <div className="flex items-center justify-between">
            <CompanyCounter
              filtered={filteredCompanies.length}
              total={companies.length}
              showFilteredBadge={hasActiveFilters}
            />
          </div>

          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, site web, email..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          {/* Active filters badges */}
          <CompanyFilterBadges
            filters={{
              country: filterCountry,
              is_client: filterIsClient,
              search: searchQuery,
            }}
            onRemoveFilter={(key: string, value?: string) => {
              if (key === 'country' && value) {
                setFilterCountry(filterCountry.filter((v) => v !== value));
              } else if (key === 'is_client' && value) {
                setFilterIsClient(filterIsClient.filter((v) => v !== value));
              } else if (key === 'search') {
                setSearchQuery('');
              }
            }}
            onClearAll={clearAllFilters}
          />

          {/* Top row: Filters, View toggle, Actions */}
          <div className="flex flex-col gap-3">
            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Pays */}
              <MultiSelectFilter
                label="Pays"
                options={uniqueValues.countries.map((country) => ({
                  value: country,
                  label: country,
                }))}
                selectedValues={filterCountry}
                onSelectionChange={setFilterCountry}
                className="min-w-[120px]"
              />

              {/* Client */}
              <MultiSelectFilter
                label="Client"
                options={[
                  { value: 'yes', label: 'Oui' },
                  { value: 'no', label: 'Non' },
                ]}
                selectedValues={filterIsClient}
                onSelectionChange={setFilterIsClient}
                className="min-w-[100px]"
              />
            </div>

            {/* Bottom row: View toggle, Actions */}
            <div className="flex items-center justify-between">
              {/* View mode toggle */}
              <ViewModeToggle value={viewMode} onChange={setViewMode} />

              {/* Actions menu */}
              <div className="relative ml-auto">
                <div className="flex items-center gap-2">
                  {/* Primary action */}
                  <Button
                    size="sm"
                    onClick={() => setShowCreateModal(true)}
                    className="text-xs px-3 py-1.5 h-auto"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Nouvelle entreprise
                  </Button>

                  {/* Secondary actions dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowActionsMenu(!showActionsMenu)}
                      className="text-xs px-2 py-1.5 h-auto"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </Button>
                    {showActionsMenu && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowActionsMenu(false)}
                        />
                        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-md shadow-lg z-20">
                          <div className="py-1">
                            <button
                              onClick={() => {
                                setShowImportInstructions(true);
                                setShowActionsMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              Instructions d'import
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await companiesAPI.downloadTemplate();
                                  setShowActionsMenu(false);
                                } catch (err) {
                                  const appError = handleApiError(err);
                                  showToast({
                                    message:
                                      appError.message || 'Erreur lors du téléchargement du modèle',
                                    type: 'error',
                                  });
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Modèle Excel
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await companiesAPI.downloadZipTemplate();
                                  setShowActionsMenu(false);
                                  showToast({
                                    message: 'Modèle ZIP téléchargé avec succès',
                                    type: 'success',
                                  });
                                } catch (err) {
                                  const appError = handleApiError(err);
                                  showToast({
                                    message:
                                      appError.message ||
                                      'Erreur lors du téléchargement du modèle ZIP',
                                    type: 'error',
                                  });
                                }
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted border-t border-border"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                              Modèle ZIP (avec logos)
                            </button>
                            <input
                              type="file"
                              accept=".xlsx,.xls,.zip"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImport(file);
                                  setShowActionsMenu(false);
                                }
                              }}
                              className="hidden"
                              id="import-companies"
                            />
                            <label
                              htmlFor="import-companies"
                              className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Importer
                            </label>
                            <button
                              onClick={() => {
                                handleExport();
                                setShowActionsMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Exporter
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteAll();
                                setShowActionsMenu(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 border-t border-border"
                              disabled={loading || companies.length === 0}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer toutes les entreprises
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Content */}
      {loading && companies.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredCompanies as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            searchable={false}
            filterable={false}
            emptyMessage="Aucune entreprise trouvée"
            loading={loading}
            onRowClick={(row) => openDetailPage(row as unknown as Company)}
          />
        </Card>
      ) : (
        <CompaniesGallery companies={filteredCompanies} onCompanyClick={openDetailPage} />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une nouvelle entreprise"
        size="lg"
      >
        <CompanyForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          parentCompanies={parentCompanies}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedCompany !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCompany(null);
        }}
        title="Modifier l'entreprise"
        size="lg"
      >
        {selectedCompany && (
          <CompanyForm
            company={selectedCompany}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedCompany(null);
            }}
            loading={loading}
            parentCompanies={parentCompanies}
          />
        )}
      </Modal>

      {/* Import Instructions Modal */}
      <Modal
        isOpen={showImportInstructions}
        onClose={() => setShowImportInstructions(false)}
        title="Instructions d'import"
        size="lg"
      >
        <ImportCompaniesInstructions />
      </Modal>
    </MotionDiv>
  );
}

export default function CompaniesPage() {
  return <CompaniesContent />;
}
