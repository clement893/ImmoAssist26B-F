# ERP Components

Enterprise Resource Planning portal components for employee dashboards and navigation.

## 📦 Components

- **ERPNavigation** - Navigation sidebar for ERP portal
- **ERPDashboard** - Main dashboard for ERP portal

## 📖 Usage Examples

### ERP Navigation

```tsx
import { ERPNavigation } from '@/components/erp';

<ERPNavigation />;
```

### ERP Dashboard

```tsx
import { ERPDashboard } from '@/components/erp';

<ERPDashboard />;
```

## 🎨 Features

- **Role-Based Access**: Navigation items based on user roles
- **Dashboard Stats**: Comprehensive statistics overview
- **Quick Actions**: Quick access to common tasks
- **Department Views**: Department-specific dashboards
- **Responsive Design**: Mobile-friendly navigation

## 🔧 Configuration

### ERPNavigation

- `className`: Additional CSS classes

### ERPDashboard

- Automatically fetches dashboard statistics
- Displays order, invoice, client, and inventory stats

## 🔗 Related Components

- See `/components/client` for client portal components
- See `/components/ui` for base UI components
