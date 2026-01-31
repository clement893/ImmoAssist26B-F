# Data Components

Components for data import and export functionality.

## 📦 Components

- **DataExporter** - Export data in various formats
- **DataImporter** - Import data from files

## 📖 Usage Examples

### Data Exporter

```tsx
import { DataExporter } from '@/components/data';

<DataExporter
  data={dataToExport}
  formats={['csv', 'excel', 'json']}
  onExport={async (format) => await exportData(format)}
/>;
```

### Data Importer

```tsx
import { DataImporter } from '@/components/data';

<DataImporter
  acceptedFormats={['csv', 'excel', 'json']}
  onImport={async (file) => await importData(file)}
/>;
```

## 🎨 Features

- **Multiple Formats**: Support for CSV, Excel, JSON
- **Bulk Operations**: Import/export large datasets
- **Validation**: Data validation before import
- **Progress Tracking**: Show import/export progress
- **Error Handling**: Detailed error reporting
- **Mapping**: Field mapping for imports

## 🔧 Configuration

### DataExporter

- `data`: Data to export
- `formats`: Available export formats
- `onExport`: Export callback

### DataImporter

- `acceptedFormats`: Accepted file formats
- `onImport`: Import callback
- `onValidate`: Validation callback

## 🔗 Related Components

- See `/components/backups` for backup management
- See `/components/ui` for base UI components
