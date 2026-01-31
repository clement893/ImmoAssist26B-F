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
import ViewModeToggle from '@/components/reseau/ViewModeToggle';
import ContactActionLink from '@/components/reseau/ContactActionLink';
import SearchBar from '@/components/ui/SearchBar';
import MultiSelectFilter from '@/components/reseau/MultiSelectFilter';
import ContactDetailPopup from '@/components/reseau/ContactDetailPopup';
import {
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  MoreVertical,
  HelpCircle,
  Settings,
  Globe,
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
  const [showImportInstructions, setShowImportInstructions] = useState(false);
  const [showImportLogs, setShowImportLogs] = useState(false);
  const [currentImportId, setCurrentImportId] = useState<string | null>(null);
  const [hoveredContact, setHoveredContact] = useState<Contact | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

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

  // Handle delete all contacts with React Query mutation (unused but kept for future use)
  // @ts-ignore - unused variable
  const _handleDeleteAll = async () => {
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

  // Handle row hover for popup
  const handleRowHover = useCallback((contact: Contact, event: React.MouseEvent) => {
    setHoveredContact(contact);
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    setPopupPosition({
      x: rect.right + 20,
      y: rect.top + window.scrollY,
    });
  }, []);

  // Handle row leave (unused but kept for future use)
  // @ts-ignore - unused variable
  const _handleRowLeave = useCallback(() => {
    // Don't close immediately to allow moving to popup
  }, []);

  // Table columns with improved design
  const columns: Column<Contact>[] = [
    {
      key: 'person',
      label: 'Person',
      sortable: true,
      render: (_value, contact) => (
        <div className="flex items-center gap-3">
          <ContactAvatar contact={contact} size="md" />
          <div>
            <div className="font-medium text-foreground">
              {contact.first_name} {contact.last_name}
            </div>
            {contact.phone && (
              <div className="text-sm text-muted-foreground">{contact.phone}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'company_name',
      label: 'Company Name',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'position',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className="text-muted-foreground">{value ? String(value) : '-'}</span>
      ),
    },
    {
      key: 'circle',
      label: 'Status',
      sortable: true,
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;

        const circleColors: Record<string, string> = {
          client: 'bg-green-500 text-white',
          prospect: 'bg-orange-500 text-white',
          partenaire: 'bg-green-600 text-white',
          fournisseur: 'bg-blue-500 text-white',
          autre: 'bg-gray-500 text-white',
        };

        const circleLabel: Record<string, string> = {
          client: 'Customer',
          prospect: 'Prospect',
          partenaire: 'Partner',
          fournisseur: 'Supplier',
          autre: 'Other',
        };

        return (
          <Badge
            variant="default"
            className={`capitalize ${circleColors[String(value)] || 'bg-gray-500 text-white'}`}
          >
            {circleLabel[String(value)] || String(value)}
          </Badge>
        );
      },
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (value, contact) => (
        <ContactActionLink type="email" value={String(value)} contact={contact} />
      ),
    },
    {
      key: 'linkedin',
      label: 'Website',
      sortable: true,
      render: (value, contact) => {
        if (!value && !contact.linkedin) return <span className="text-muted-foreground">-</span>;
        const url = contact.linkedin || String(value);
        return (
          <a
            href={url.startsWith('http') ? url : `https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm">{url.replace(/^https?:\/\//, '')}</span>
          </a>
        );
      },
    },
    {
      key: 'access',
      label: 'Access',
      sortable: false,
      render: () => (
        <div className="flex items-center gap-2">
          <select
            className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => e.stopPropagation()}
          >
            <option>Everyone</option>
            <option>Only me</option>
          </select>
        </div>
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

      {/* Header Actions Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau contact
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowImportModal(true)}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-green-300 text-green-700 hover:bg-green-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Settings className="w-4 h-4 mr-2" />
            View settings
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="mb-4">
        <div className="space-y-3">
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

            {/* Bottom row: View toggle */}
            <div className="flex items-center justify-between">
              <ViewModeToggle value={viewMode} onChange={setViewMode} />
              <div className="text-sm text-muted-foreground">
                {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
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
          <div className="relative">
            <DataTable
              data={filteredContacts as unknown as Record<string, unknown>[]}
              columns={columns.map((col, colIndex) => {
                if (colIndex === 0) {
                  // Add hover handlers to first column
                  return {
                    ...col,
                    render: (_value: unknown, contact: unknown) => {
                      const contactData = contact as Contact;
                      return (
                        <div
                          className="flex items-center gap-2"
                          onMouseEnter={(e) => handleRowHover(contactData, e)}
                        >
                          <ContactAvatar contact={contactData} size="md" />
                          <div>
                            <div className="font-medium text-foreground">
                              {contactData.first_name} {contactData.last_name}
                            </div>
                            {contactData.phone && (
                              <div className="text-sm text-muted-foreground">{contactData.phone}</div>
                            )}
                          </div>
                        </div>
                      );
                    },
                  };
                }
                return col;
              }) as unknown as Column<Record<string, unknown>>[]}
              searchable={false}
              filterable={false}
              emptyMessage="Aucun contact trouvé"
              loading={loading}
              onRowClick={(row) => {
                const contact = row as unknown as Contact;
                openDetailPage(contact);
              }}
            />
          </div>
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

      {/* Import Modal with Template Download */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importer des contacts"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Télécharger le template</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Téléchargez le fichier Excel template pour préparer votre import. Le template contient
              toutes les colonnes nécessaires avec des exemples.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await reseauContactsAPI.downloadTemplate();
                    showToast({
                      message: 'Template Excel téléchargé avec succès',
                      type: 'success',
                    });
                  } catch (err) {
                    const appError = handleApiError(err);
                    showToast({
                      message: appError.message || 'Erreur lors du téléchargement du template',
                      type: 'error',
                    });
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Template Excel
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await reseauContactsAPI.downloadZipTemplate();
                    showToast({
                      message: 'Template ZIP téléchargé avec succès',
                      type: 'success',
                    });
                  } catch (err) {
                    const appError = handleApiError(err);
                    showToast({
                      message: appError.message || 'Erreur lors du téléchargement du template ZIP',
                      type: 'error',
                    });
                  }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Template ZIP (avec photos)
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Importer votre fichier</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Sélectionnez un fichier Excel (.xlsx, .xls) ou ZIP (.zip) contenant vos contacts.
            </p>
            <input
              type="file"
              accept=".xlsx,.xls,.zip"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImport(file);
                  setShowImportModal(false);
                }
              }}
              className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setShowImportModal(false)}>
              Annuler
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowImportInstructions(true);
                setShowImportModal(false);
              }}
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Instructions
            </Button>
          </div>
        </div>
      </Modal>

      {/* Contact Detail Popup */}
      {hoveredContact && popupPosition && (
        <div
          onMouseEnter={() => {
            // Keep popup open when hovering over it
          }}
          onMouseLeave={() => {
            setHoveredContact(null);
            setPopupPosition(null);
          }}
        >
          <ContactDetailPopup
            contact={hoveredContact}
            position={popupPosition}
            onEdit={() => {
              openEditModal(hoveredContact);
              setHoveredContact(null);
              setPopupPosition(null);
            }}
            onDelete={() => {
              handleDelete(hoveredContact.id);
              setHoveredContact(null);
              setPopupPosition(null);
            }}
            onClose={() => {
              setHoveredContact(null);
              setPopupPosition(null);
            }}
          />
        </div>
      )}
    </MotionDiv>
  );
}

export default function ContactsPage() {
  return <ContactsContent />;
}
