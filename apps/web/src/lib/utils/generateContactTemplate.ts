/**
 * Generate Excel template for contact import
 * Creates a template file with all supported columns and example data
 */

import * as XLSX from 'xlsx';

export interface ContactTemplateColumn {
  key: string;
  label: string;
  description?: string;
  example?: string;
  required?: boolean;
}

export const CONTACT_TEMPLATE_COLUMNS: ContactTemplateColumn[] = [
  {
    key: 'first_name',
    label: 'Prénom',
    description: 'Prénom du contact',
    example: 'Jean',
    required: true,
  },
  {
    key: 'last_name',
    label: 'Nom',
    description: 'Nom de famille du contact',
    example: 'Dupont',
    required: true,
  },
  {
    key: 'email',
    label: 'Courriel',
    description: 'Adresse email du contact',
    example: 'jean.dupont@example.com',
    required: false,
  },
  {
    key: 'phone',
    label: 'Téléphone',
    description: 'Numéro de téléphone',
    example: '+33 6 12 34 56 78',
    required: false,
  },
  {
    key: 'company_id',
    label: 'ID Entreprise',
    description: "Identifiant de l'entreprise (optionnel)",
    example: '1',
    required: false,
  },
  {
    key: 'position',
    label: 'Poste',
    description: 'Poste occupé',
    example: 'Directeur Commercial',
    required: false,
  },
  {
    key: 'circle',
    label: 'Cercle',
    description: 'Cercle du contact (client, prospect, partenaire, fournisseur, autre)',
    example: 'client',
    required: false,
  },
  {
    key: 'city',
    label: 'Ville',
    description: 'Ville du contact',
    example: 'Paris',
    required: false,
  },
  {
    key: 'country',
    label: 'Pays',
    description: 'Pays du contact',
    example: 'France',
    required: false,
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'URL du profil LinkedIn',
    example: 'https://linkedin.com/in/jeandupont',
    required: false,
  },
  {
    key: 'birthday',
    label: 'Anniversaire',
    description: "Date d'anniversaire (format: YYYY-MM-DD)",
    example: '1980-05-15',
    required: false,
  },
  {
    key: 'language',
    label: 'Langue',
    description: 'Code langue (fr, en, es, etc.)',
    example: 'fr',
    required: false,
  },
  {
    key: 'employee_id',
    label: 'ID Employé',
    description: "Identifiant de l'employé assigné (optionnel)",
    example: '1',
    required: false,
  },
];

/**
 * Generate Excel template file for contact import
 * @returns Blob containing the Excel file
 */
export function generateContactTemplate(): Blob {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create header row with labels
  const headers = CONTACT_TEMPLATE_COLUMNS.map((col) => col.label);

  // Create example data row
  const exampleRow = CONTACT_TEMPLATE_COLUMNS.map((col) => col.example || '');

  // Create worksheet data
  const wsData = [headers, exampleRow];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for better readability
  const colWidths = CONTACT_TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));
  ws['!cols'] = colWidths;

  // Style header row (bold)
  const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[cellAddress]) continue;
    ws[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E0E0E0' } },
    };
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Contacts');

  // Create instructions sheet
  const instructionsData = [
    ["Instructions pour l'import de contacts"],
    [''],
    ['Colonnes supportées:'],
    ...CONTACT_TEMPLATE_COLUMNS.map((col) => [
      `- ${col.label} (${col.key})${col.required ? ' *REQUIS*' : ''}`,
      col.description || '',
      col.example ? `Exemple: ${col.example}` : '',
    ]),
    [''],
    ['Notes importantes:'],
    ['- Les colonnes marquées *REQUIS* doivent être remplies'],
    ["- Le format de date pour l'anniversaire est YYYY-MM-DD (ex: 1980-05-15)"],
    ['- Les cercles acceptés sont: client, prospect, partenaire, fournisseur, autre'],
    ['- Les IDs (company_id, employee_id) doivent correspondre à des enregistrements existants'],
    ['- Vous pouvez utiliser les noms de colonnes en français ou en anglais'],
  ];

  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instructions');

  // Convert to blob
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download the contact template Excel file
 */
export function downloadContactTemplate(): void {
  const blob = generateContactTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-contacts-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate ZIP template with Excel file and instructions for importing contacts with photos
 * @returns Blob containing the ZIP file
 */
export async function generateContactZipTemplate(): Promise<Blob> {
  // Import JSZip dynamically to avoid SSR issues
  const JSZipModule = await import('jszip');
  // JSZip can be exported as default or named export
  type JSZipInstance = {
    file: (name: string, data: BlobPart) => JSZipInstance;
    folder: (name: string) => JSZipInstance | null;
    generateAsync: (options: { type: 'blob' }) => Promise<Blob>;
  };
  type JSZipConstructor = new () => JSZipInstance;
  const JSZip = (JSZipModule.default || JSZipModule) as JSZipConstructor;
  const zip = new JSZip();

  // Generate Excel template
  const excelBlob = generateContactTemplate();
  const excelArrayBuffer = await excelBlob.arrayBuffer();
  zip.file('contacts.xlsx', excelArrayBuffer);

  // Create README with instructions
  const readmeContent = `# Instructions pour l'import de contacts avec photos

## Structure du fichier ZIP

Votre fichier ZIP doit contenir :
- \`contacts.xlsx\` : Fichier Excel avec les données des contacts
- \`photos/\` : Dossier contenant les photos des contacts (optionnel)

## Format du fichier Excel

Le fichier Excel doit contenir les colonnes suivantes :

### Colonnes requises
- **Prénom** (ou \`first_name\`) : Prénom du contact *REQUIS*
- **Nom** (ou \`last_name\`) : Nom de famille du contact *REQUIS*

### Colonnes optionnelles
- **Courriel** (ou \`email\`) : Adresse email
- **Téléphone** (ou \`phone\`) : Numéro de téléphone
- **Poste** (ou \`position\`) : Poste occupé
- **Cercle** (ou \`circle\`) : client, prospect, partenaire, fournisseur, autre
- **Ville** (ou \`city\`) : Ville du contact
- **Pays** (ou \`country\`) : Pays du contact
- **LinkedIn** (ou \`linkedin\`) : URL du profil LinkedIn
- **Anniversaire** (ou \`birthday\`) : Date au format YYYY-MM-DD (ex: 1980-05-15)
- **Langue** (ou \`language\`) : Code langue (fr, en, es, etc.)
- **ID Entreprise** (ou \`company_id\`) : Identifiant de l'entreprise
- **ID Employé** (ou \`employee_id\`) : Identifiant de l'employé assigné

## Nommage des photos

Les photos doivent être nommées selon l'un de ces formats :
- \`prénom_nom.jpg\` (ex: \`jean_dupont.jpg\`)
- \`prénom_nom.png\`
- \`prénom_nom.jpeg\`

**Exemples :**
- Contact : Jean Dupont → Photo : \`jean_dupont.jpg\`
- Contact : Marie Martin → Photo : \`marie_martin.png\`
`;

  zip.file('README.txt', readmeContent);

  // Create photos folder with a placeholder/instructions file
  const photosInstructions = `# Dossier Photos

Placez ici les photos de vos contacts.

## Format de nommage

Nommez vos photos selon le format : \`prénom_nom.extension\`

Exemples :
- jean_dupont.jpg
- marie_martin.png
- pierre_durand.jpeg

## Formats acceptés

- .jpg / .jpeg
- .png
- .gif
- .webp
`;

  zip.folder('photos')?.file('INSTRUCTIONS.txt', photosInstructions);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}

/**
 * Download the contact ZIP template (Excel + instructions)
 */
export async function downloadContactZipTemplate(): Promise<void> {
  const blob = await generateContactZipTemplate();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `modele-import-contacts-avec-photos-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
