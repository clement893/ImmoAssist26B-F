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
import { type Contact, type ContactCreate, type ContactUpdate } from '@/lib/api/reseau-contacts';
import { handleApiError } from '@/lib/errors/api';
import { useToast } from '@/components/ui';
import ContactsGallery from '@/components/reseau/ContactsGallery';
import ContactForm from '@/components/reseau/ContactForm';
import ContactAvatar from '@/components/reseau/ContactAvatar';
import ContactFilterBadges from '@/components/reseau/ContactFilterBadges';
import ContactCounter from '@/components/reseau/ContactCounter';
import ViewModeToggle from '@/components/reseau/ViewModeToggle';
import ContactActionLink from '@/components/reseau/ContactActionLink';
import ContactRowActions from '@/components/reseau/ContactRowActions';
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
import ImportContactsInstructions from '@/components/reseau/ImportContactsInstructions';
import ImportLogsViewer from '@/components/reseau/ImportLogsViewer';
import MotionDiv from '@/components/motion/MotionDiv';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useInfiniteReseauContacts,
  useCreateReseauContact,
  useUpdateReseauContact,
  useDeleteReseauContact,
  useDeleteAllReseauContacts,
  reseauContactsAPI,
} from '@/lib/query/reseau-contacts';

import type { ViewMode } from '@/components/reseau/ViewModeToggle';

function ContactsContent() {
  const router = useRouter();
  const { showToast } = useToast();

  // React Query hooks for contacts
  const {
    data: contactsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error: queryError,
  } = useInfiniteReseauContacts();

  // Mutations
  const createContactMutation = useCreateReseauContact();
  const updateContactMutation = useUpdateReseauContact();
  const deleteContactMutation = useDeleteReseauContact();
  const deleteAllContactsMutation = useDeleteAllReseauContacts();

  // Flatten pages into single array
  const contacts = useMemo(() => {
    return contactsData?.pages.flat() || [];
  }, [contactsData]);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filterCity, setFilterCity] = useState<string[]>([]);
  const [filterPhone, setFilterPhone] = useState<string[]>([]);
  const [filterCircle, setFilterCircle] = useState<string[]>([]);
  const [filterCompany, setFilterCompany] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [showImportLogs, setShowImportLogs] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);

  // Debounce search query to avoid excessive re-renders (300ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Derived state from React Query
  const loading = isLoading;
  const loadingMore = isFetchingNextPage;
  const hasMore = hasNextPage ?? false;
  const error = queryError ? handleApiError(queryError).message : null;

  // Mock data pour les entreprises et employés (à remplacer par des appels API réels)
  const [companies] = useState<Array<{ id: number; name: string }>>([]);
  const [employees] = useState<Array<{ id: number; name: string }>>([]);
  const circles = ['client', 'prospect', 'partenaire', 'fournisseur', 'autre'];

  // Load more contacts for infinite scroll
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNextPage();
    }
  }, [loadingMore, hasMore, fetchNextPage]);

  // Extract unique values for dropdowns
  const uniqueValues = useMemo(() => {
    const cities = new Set<string>();
    const phones = new Set<string>();
    const companyNames = new Set<string>();

    contacts.forEach((contact) => {
      if (contact.city) cities.add(contact.city);
      if (contact.phone) phones.add(contact.phone);
      if (contact.company_name) companyNames.add(contact.company_name);
    });

    return {
      cities: Array.from(cities).sort(),
      phones: Array.from(phones).sort(),
      companyNames: Array.from(companyNames).sort(),
    };
  }, [contacts]);

  // Filtered contacts with debounced search
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // City filter: match if no filter or contact city is in filter array
      const matchesCity =
        filterCity.length === 0 || (contact.city && filterCity.includes(contact.city));

      // Phone filter: match if no filter or contact phone is in filter array
      const matchesPhone =
        filterPhone.length === 0 || (contact.phone && filterPhone.includes(contact.phone));

      // Circle filter: match if no filter or contact circle is in filter array
      const matchesCircle =
        filterCircle.length === 0 || (contact.circle && filterCircle.includes(contact.circle));

      // Company filter: match if no filter or contact company_id is in filter array
      const matchesCompany =
        filterCompany.length === 0 ||
        (contact.company_id && filterCompany.includes(contact.company_id.toString()));

      // Search filter: search in name, email, phone, company (using debounced query)
      const matchesSearch =
        !debouncedSearchQuery ||
        `${contact.first_name} ${contact.last_name}`
          .toLowerCase()
          .includes(debouncedSearchQuery.toLowerCase()) ||
        contact.email?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        contact.phone?.includes(debouncedSearchQuery) ||
        contact.company_name?.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      return matchesCity && matchesPhone && matchesCircle && matchesCompany && matchesSearch;
    });
  }, [contacts, filterCity, filterPhone, filterCircle, filterCompany, debouncedSearchQuery]);

  // Check if any filters are active (use debounced search for display)
  const hasActiveFilters = !!(
    filterCity.length > 0 ||
    filterPhone.length > 0 ||
    filterCircle.length > 0 ||
    filterCompany.length > 0 ||
    debouncedSearchQuery
  );

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setFilterCity([]);
    setFilterPhone([]);
    setFilterCircle([]);
    setFilterCompany([]);
    setSearchQuery('');
  }, []);

  // Handle create with React Query mutation
  const handleCreate = async (data: ContactCreate | ContactUpdate) => {
    try {
      await createContactMutation.mutateAsync(data as ContactCreate);
      setShowCreateModal(false);
      showToast({
        message: 'Contact créé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la création du contact',
        type: 'error',
      });
    }
  };

  // Handle update with React Query mutation
  const handleUpdate = async (data: ContactCreate | ContactUpdate) => {
    if (!selectedContact) return;

    try {
      await updateContactMutation.mutateAsync({
        id: selectedContact.id,
        data: data as ContactUpdate,
      });
      setShowEditModal(false);
      setSelectedContact(null);
      showToast({
        message: 'Contact modifié avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la modification du contact',
        type: 'error',
      });
    }
  };

  // Handle delete with React Query mutation
  const handleDelete = async (contactId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contact ?')) {
      return;
    }

    try {
      await deleteContactMutation.mutateAsync(contactId);
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      showToast({
        message: 'Contact supprimé avec succès',
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression du contact',
        type: 'error',
      });
    }
  };

  // Handle delete all contacts with React Query mutation
  const handleDeleteAll = async () => {
    const count = contacts.length;
    if (count === 0) {
      showToast({
        message: 'Aucun contact à supprimer',
        type: 'info',
      });
      return;
    }

    const confirmed = confirm(
      `⚠️ ATTENTION: Vous êtes sur le point de supprimer TOUS les ${count} contact(s) de la base de données.\n\nCette action est irréversible. Êtes-vous sûr de vouloir continuer ?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirmed = confirm(
      '⚠️ DERNIÈRE CONFIRMATION: Tous les contacts seront définitivement supprimés. Tapez OK pour confirmer.'
    );

    if (!doubleConfirmed) {
      return;
    }

    try {
      const result = await deleteAllContactsMutation.mutateAsync();
      setSelectedContact(null);
      showToast({
        message: result.message || `${result.deleted_count} contact(s) supprimé(s) avec succès`,
        type: 'success',
      });
    } catch (err) {
      const appError = handleApiError(err);
      showToast({
        message: appError.message || 'Erreur lors de la suppression des contacts',
        type: 'error',
      });
    }
  };

  // Get query client for cache invalidation
  const queryClient = useQueryClient();

  // Handle import
  const handleImport = async (file: File) => {
    try {
      // Show logs viewer
      setShowImportLogs(true);

      const result = await reseauContactsAPI.import(file);

      // Set import_id for log tracking
      if (result.import_id) {
        setCurrentImportId(result.import_id);
      }

      if (result.valid_rows > 0) {
        // Invalidate contacts query to refetch after import
        queryClient.refetchQueries({ queryKey: ['contacts'] });

        const photosMsg =
          result.photos_uploaded && result.photos_uploaded > 0
            ? ` (${result.photos_uploaded} photo(s) uploadée(s))`
            : '';
        showToast({
          message: `${result.valid_rows} contact(s) importé(s) avec succès${photosMsg}`,
          type: 'success',
        });
      }

      // Display warnings, especially for companies not found
      if (result.warnings && result.warnings.length > 0) {
        const companyWarnings = result.warnings.filter(
          (w) => w.type === 'company_not_found' || w.type === 'company_partial_match'
        );

        if (companyWarnings.length > 0) {
          const uniqueCompanies = new Set(
            companyWarnings.map((w) => w.data?.company_name as string).filter(Boolean)
          );

          const warningMsg =
            companyWarnings.length === 1 && companyWarnings[0]
              ? `⚠️ ${companyWarnings[0].message}`
              : `⚠️ ${companyWarnings.length} entreprise(s) nécessitent une révision (${Array.from(uniqueCompanies).join(', ')})`;

          showToast({
            message: warningMsg,
            type: 'warning',
            duration: 8000, // Longer duration for important warnings
          });
        }
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
      setShowImportLogs(false);
      setCurrentImportId(null);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const blob = await reseauContactsAPI.export();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const openDetailPage = (contact: Contact) => {
    const locale = window.location.pathname.split('/')[1] || 'fr';
    router.push(`/${locale}/dashboard/reseau/contacts/${contact.id}`);
  };

  // Open edit modal
  const openEditModal = (contact: Contact) => {
    setSelectedContact(contact);
    setShowEditModal(true);
  };

  // Table columns
  const columns: Column<Contact>[] = [
    {
      key: 'photo_url',
      label: '',
      sortable: false,
      render: (_value, contact) => (
        <div className="flex items-center">
          <ContactAvatar contact={contact} size="md" />
        </div>
      ),
    },
    {
      key: 'first_name',
      label: 'Prénom',
      sortable: true,
      render: (_value, contact) => (
        <div className="flex items-center justify-between group">
          <div>
            <div className="font-medium">
              {contact.first_name} {contact.last_name}
            </div>
            {contact.position && (
              <div className="text-sm text-muted-foreground">{contact.position}</div>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ContactRowActions
              contact={contact}
              onView={() => openDetailPage(contact)}
              onEdit={() => openEditModal(contact)}
              onDelete={() => handleDelete(contact.id)}
            />
          </div>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Entreprise',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'circle',
      label: 'Cercle',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;

        const circleColors: Record<string, string> = {
          client: 'bg-success-500 hover:bg-success-600',
          prospect: 'bg-primary-500 hover:bg-primary-600',
          partenaire: 'bg-secondary-500 hover:bg-secondary-600',
          fournisseur: 'bg-warning-500 hover:bg-warning-600',
          autre: 'bg-muted hover:bg-muted/80',
        };

        return (
          <Badge
            variant="default"
            className={`capitalize text-background ${circleColors[String(value)] || 'bg-muted'}`}
          >
            {String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'email',
      label: 'Courriel',
      sortable: true,
      render: (value, contact) => (
        <ContactActionLink type="email" value={String(value)} contact={contact} />
      ),
    },
    {
      key: 'phone',
      label: 'Téléphone',
      sortable: true,
      render: (value, contact) => (
        <ContactActionLink type="phone" value={String(value)} contact={contact} />
      ),
    },
    {
      key: 'city',
      label: 'Ville',
      sortable: true,
      render: (_value, contact) => (
        <span className="text-muted-foreground">
          {[contact.city, contact.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
    },
  ];

  return (
    <MotionDiv variant="slideUp" duration="normal" className="space-y-2xl">
      <PageHeader
        title="Contacts"
        description={`Gérez vos contacts commerciaux${contacts.length > 0 ? ` - ${contacts.length} contact${contacts.length > 1 ? 's' : ''} au total` : ''}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Module Réseau', href: '/dashboard/reseau' },
          { label: 'Contacts' },
        ]}
      />

      {/* Toolbar */}
      <Card>
        <div className="space-y-3">
          {/* Contact count with improved visual */}
          <div className="flex items-center justify-between">
            <ContactCounter
              filtered={filteredContacts.length}
              total={contacts.length}
              showFilteredBadge={hasActiveFilters}
            />
          </div>

          {/* Search bar */}
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, entreprise..."
            className="w-full pl-10 pr-10 py-2 text-sm border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          {/* Active filters badges */}
          <ContactFilterBadges
            filters={{
              city: filterCity,
              phone: filterPhone,
              circle: filterCircle,
              company: filterCompany,
              search: searchQuery,
            }}
            onRemoveFilter={(key: string, value?: string) => {
              if (key === 'city' && value) {
                setFilterCity(filterCity.filter((v) => v !== value));
              } else if (key === 'phone' && value) {
                setFilterPhone(filterPhone.filter((v) => v !== value));
              } else if (key === 'circle' && value) {
                setFilterCircle(filterCircle.filter((v) => v !== value));
              } else if (key === 'company' && value) {
                setFilterCompany(filterCompany.filter((v) => v !== value));
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
              {/* Entreprise */}
              {companies.length > 0 && (
                <MultiSelectFilter
                  label="Entreprise"
                  options={companies.map((company) => ({
                    value: company.id.toString(),
                    label: company.name,
                  }))}
                  selectedValues={filterCompany}
                  onSelectionChange={setFilterCompany}
                  className="min-w-[150px]"
                />
              )}

              {/* Ville */}
              <MultiSelectFilter
                label="Ville"
                options={uniqueValues.cities.map((city) => ({
                  value: city,
                  label: city,
                }))}
                selectedValues={filterCity}
                onSelectionChange={setFilterCity}
                className="min-w-[120px]"
              />

              {/* Téléphone */}
              <MultiSelectFilter
                label="Téléphone"
                options={uniqueValues.phones.map((phone) => ({
                  value: phone,
                  label: phone,
                }))}
                selectedValues={filterPhone}
                onSelectionChange={setFilterPhone}
                className="min-w-[140px]"
              />

              {/* Cercle */}
              <MultiSelectFilter
                label="Cercle"
                options={circles.map((circle) => ({
                  value: circle,
                  label: circle.charAt(0).toUpperCase() + circle.slice(1),
                }))}
                selectedValues={filterCircle}
                onSelectionChange={setFilterCircle}
                className="min-w-[120px]"
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
                    Nouveau contact
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
                                  await reseauContactsAPI.downloadTemplate();
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
                                  await reseauContactsAPI.downloadZipTemplate();
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
                              Modèle ZIP (avec photos)
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
                              id="import-contacts"
                            />
                            <label
                              htmlFor="import-contacts"
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
                              disabled={loading || contacts.length === 0}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer tous les contacts
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
      {loading && contacts.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <Loading />
          </div>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <DataTable
            data={filteredContacts as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            searchable={false}
            filterable={false}
            emptyMessage="Aucun contact trouvé"
            loading={loading}
            onRowClick={(row) => openDetailPage(row as unknown as Contact)}
          />
        </Card>
      ) : (
        <ContactsGallery
          contacts={filteredContacts}
          onContactClick={openDetailPage}
          hasMore={
            hasMore &&
            filterCity.length === 0 &&
            filterPhone.length === 0 &&
            filterCircle.length === 0 &&
            filterCompany.length === 0
          }
          loadingMore={loadingMore}
          onLoadMore={loadMore}
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer un nouveau contact"
        size="lg"
      >
        <ContactForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
          loading={loading}
          companies={companies}
          employees={employees}
          circles={circles}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal && selectedContact !== null}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContact(null);
        }}
        title="Modifier le contact"
        size="lg"
      >
        {selectedContact && (
          <ContactForm
            contact={selectedContact}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedContact(null);
            }}
            loading={loading}
            companies={companies}
            employees={employees}
            circles={circles}
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
        <ImportContactsInstructions />
      </Modal>

      {/* Import Logs Modal */}
      {showImportLogs && currentImportId && (
        <Modal
          isOpen={showImportLogs}
          onClose={() => {
            setShowImportLogs(false);
            setCurrentImportId(null);
          }}
          title="Logs d'import en temps réel"
          size="xl"
        >
          <ImportLogsViewer
            importId={currentImportId}
            onComplete={() => {
              // Optionally close modal after completion
              setTimeout(() => {
                setShowImportLogs(false);
                setCurrentImportId(null);
              }, 3000);
            }}
          />
        </Modal>
      )}
    </MotionDiv>
  );
}

export default function ContactsPage() {
  return <ContactsContent />;
}
