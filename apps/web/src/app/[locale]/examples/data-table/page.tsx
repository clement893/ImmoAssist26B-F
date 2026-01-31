'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Container from '@/components/ui/Container';
import DataTableEnhanced from '@/components/ui/DataTableEnhanced';
import type { BulkAction, ExportOption } from '@/components/ui/DataTableEnhanced';
import type { Column } from '@/components/ui/DataTable';
import { useToast } from '@/components/ui';
import { Trash2, Edit } from 'lucide-react';
// Simple export functions
const exportToCSV = (data: User[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map((row) => [row.name, row.email, row.role, row.status, row.createdAt].join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const exportToExcel = (data: User[], filename: string, headers: string[]) => {
  // For Excel, we'll use CSV format (real Excel export would require a library)
  exportToCSV(data, filename.replace('.xlsx', '.csv'), headers);
};

interface User extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export default function ExampleDataTablePage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Jean Dupont',
      email: 'jean@example.com',
      role: 'Admin',
      status: 'active',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Marie Martin',
      email: 'marie@example.com',
      role: 'User',
      status: 'active',
      createdAt: '2024-01-20',
    },
    {
      id: 3,
      name: 'Pierre Durand',
      email: 'pierre@example.com',
      role: 'User',
      status: 'inactive',
      createdAt: '2024-01-25',
    },
    {
      id: 4,
      name: 'Sophie Bernard',
      email: 'sophie@example.com',
      role: 'Moderator',
      status: 'active',
      createdAt: '2024-02-01',
    },
    {
      id: 5,
      name: 'Luc Petit',
      email: 'luc@example.com',
      role: 'User',
      status: 'active',
      createdAt: '2024-02-05',
    },
  ]);

  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Nom',
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
    },
    {
      key: 'role',
      label: 'Rôle',
      sortable: true,
      filterable: true,
      render: (value: unknown) => (
        <span className="px-2 py-1 text-xs rounded bg-info-100 text-info-800 dark:bg-info-900 dark:text-info-200">
          {value as string}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      filterable: true,
      render: (value: unknown) => (
        <span
          className={`px-2 py-1 text-xs rounded ${
            value === 'active'
              ? 'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200'
              : 'bg-muted text-foreground'
          }`}
        >
          {value as string}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Créé le',
      sortable: true,
    },
  ];

  const bulkActions: BulkAction<User>[] = [
    {
      label: 'Supprimer',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'danger',
      requireConfirmation: true,
      confirmationMessage: 'Êtes-vous sûr de vouloir supprimer les éléments sélectionnés ?',
      onClick: async (selectedRows) => {
        const ids = selectedRows.map((row) => row.id);
        setUsers(users.filter((user) => !ids.includes(user.id)));
        showToast({
          message: `${selectedRows.length} utilisateur(s) supprimé(s)`,
          type: 'success',
        });
      },
    },
  ];

  const exportOptions: ExportOption[] = [
    {
      label: 'Exporter en CSV',
      format: 'csv',
      onClick: (data) => {
        exportToCSV(data as User[], 'users.csv', ['Nom', 'Email', 'Rôle', 'Statut', 'Créé le']);
        showToast({
          message: 'Export CSV réussi',
          type: 'success',
        });
      },
    },
    {
      label: 'Exporter en Excel',
      format: 'xlsx',
      onClick: (data) => {
        exportToExcel(data as User[], 'users.xlsx', ['Nom', 'Email', 'Rôle', 'Statut', 'Créé le']);
        showToast({
          message: 'Export Excel réussi',
          type: 'success',
        });
      },
    },
  ];

  const rowActions = (row: User) => [
    {
      label: 'Modifier',
      icon: <Edit className="w-4 h-4" />,
      onClick: () => {
        showToast({
          message: `Modification de ${row.name}`,
          type: 'info',
        });
      },
    },
    {
      label: 'Supprimer',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => {
        setUsers(users.filter((user) => user.id !== row.id));
        showToast({
          message: `${row.name} supprimé`,
          type: 'success',
        });
      },
      variant: 'danger' as const,
    },
  ];

  return (
    <Container className="py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Exemple Tableau de Données Avancé
        </h1>
        <p className="text-muted-foreground">
          Tableau avec tri, filtres, recherche, export et actions batch
        </p>
      </div>

      <Card>
        <div className="p-6">
          <DataTableEnhanced
            data={users}
            columns={columns}
            searchable
            filterable
            sortable
            selectable
            bulkActions={bulkActions}
            exportOptions={exportOptions}
            actions={rowActions}
            pageSize={10}
            searchPlaceholder="Rechercher des utilisateurs..."
            emptyMessage="Aucun utilisateur trouvé"
          />
        </div>
      </Card>

      {/* Code Example */}
      <Card className="mt-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Points clés de cet exemple :
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>✅ Tri par colonnes</li>
            <li>✅ Filtres avancés</li>
            <li>✅ Recherche en temps réel</li>
            <li>✅ Pagination</li>
            <li>✅ Sélection multiple</li>
            <li>✅ Actions batch (suppression multiple)</li>
            <li>✅ Export CSV/Excel</li>
            <li>✅ Actions par ligne</li>
          </ul>
        </div>
      </Card>
    </Container>
  );
}
