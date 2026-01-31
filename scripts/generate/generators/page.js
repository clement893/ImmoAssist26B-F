/**
 * Générateur de Page Next.js avec DataTable
 */

const fs = require("fs");
const path = require("path");

function generatePage(name, options = {}) {
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);
  const modelLower = name.toLowerCase();
  const pagePath = options.pagePath || `/${modelLower}`;
  const apiPath = options.apiPath || `/api/v1/${modelLower}`;
  const fields = options.fields || [];

  // Generate columns for DataTable
  const columns = fields
    .map((field) => {
      const label =
        field.name.charAt(0).toUpperCase() +
        field.name.slice(1).replace(/_/g, " ");
      return `    { key: '${field.name}', label: '${label}', sortable: true, filterable: true },`;
    })
    .join("\n");

  const code = `'use client';

import { useState, useEffect } from 'react';
import { DataTableEnhanced } from '@/components/ui';
import { apiClient } from '@/lib/api/client';
import { PageHeader, PageContainer } from '@/components/layout';
import type { Column } from '@/components/ui';

interface ${modelName} {
  id: string;
${fields.map((f) => `  ${f.name}: ${f.type === "integer" ? "number" : f.type === "boolean" ? "boolean" : "string"};`).join("\n")}
  created_at: string;
  updated_at: string;
}

const columns: Column<${modelName}>[] = [
${columns}
  { key: 'created_at', label: 'Created At', sortable: true },
  { key: 'updated_at', label: 'Updated At', sortable: true },
];

export default function ${modelName}Page() {
  const [data, setData] = useState<${modelName}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<${modelName}[]>('${apiPath}');
      if (response.success && response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error('Error fetching ${modelLower}s:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async (selected: ${modelName}[]) => {
    try {
      await Promise.all(
        selected.map((item) => apiClient.delete(\`${apiPath}/\${item.id}\`))
      );
      await fetchData();
    } catch (error) {
      console.error('Error deleting ${modelLower}s:', error);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="${modelName}s"
        description="Manage ${modelLower}s"
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: '${modelName}s', href: '${pagePath}' },
        ]}
      />

      <div className="mt-6">
        <DataTableEnhanced<${modelName}>
          data={data}
          columns={columns}
          loading={loading}
          selectable
          bulkActions={[
            {
              label: 'Delete Selected',
              onClick: handleBulkDelete,
              variant: 'danger',
              requireConfirmation: true,
              confirmationMessage: 'Are you sure you want to delete selected ${modelLower}s?',
            },
          ]}
          exportOptions={[
            {
              label: 'Export CSV',
              format: 'csv',
              onClick: (data) => {
                // Implement CSV export
                console.log('Export CSV', data);
              },
            },
          ]}
        />
      </div>
    </PageContainer>
  );
}
`;

  // Write file
  const pageDir = path.join(
    __dirname,
    "../../apps/web/src/app",
    pagePath.split("/").filter(Boolean).join("/"),
  );
  const pageFile = path.join(pageDir, "page.tsx");

  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  if (fs.existsSync(pageFile) && !options.force) {
    throw new Error(
      `Le fichier ${pageFile} existe déjà. Utilisez --force pour l'écraser.`,
    );
  }

  fs.writeFileSync(pageFile, code);
  console.log(`✅ Page générée: ${pageFile}`);
}

module.exports = generatePage;
