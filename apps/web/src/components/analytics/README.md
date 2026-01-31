# Analytics Components

Components for analytics dashboards, report generation, and data export.

## 📦 Components

- **AnalyticsDashboard** - Analytics dashboard with metrics and charts
- **ReportBuilder** - Report builder interface
- **ReportViewer** - Report viewer component
- **DataExport** - Data export functionality

## 📖 Usage Examples

### Analytics Dashboard

```tsx
import { AnalyticsDashboard } from '@/components/analytics';

<AnalyticsDashboard
  onDateRangeChange={(range) => handleDateRangeChange(range)}
  onExport={() => handleExport()}
/>;
```

### Report Builder

```tsx
import { ReportBuilder } from '@/components/analytics';

<ReportBuilder fields={reportFields} onSave={(config) => handleSaveReport(config)} />;
```

## 🔗 Related

- [Analytics Components Showcase](/components/analytics)
