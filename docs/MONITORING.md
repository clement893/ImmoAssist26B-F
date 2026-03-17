# 📊 Monitoring & Observabilité

Système complet de monitoring et observabilité pour l'application.

## 🎯 Fonctionnalités

### 1. Dashboard de Santé de l'Application ✅

- **Composant** : `HealthStatus`
- **Fonctionnalités** :
  - Vérification de santé des services (API, Database)
  - Statut en temps réel (healthy/degraded/down)
  - Temps de réponse des services
  - Refresh automatique toutes les 30 secondes

**Usage** :

```tsx
import HealthStatus from "@/components/monitoring/HealthStatus";

<HealthStatus />;
```

### 2. Métriques de Performance ✅

- **Composants** : `MetricsChart`, `SystemMetrics`
- **Fonctionnalités** :
  - Tracking des Web Vitals (LCP, FID, CLS, FCP, TTFB)
  - Graphiques en temps réel
  - Seuils d'alerte (warning/critical)
  - Métriques système (CPU, Memory, Disk, Network)

**Usage** :

```tsx
import MetricsChart from "@/components/monitoring/MetricsChart";

<MetricsChart metricName="LCP" title="Largest Contentful Paint" />;
```

### 3. Logs Centralisés ✅

- **Composant** : `LogsViewer`
- **Fonctionnalités** :
  - Stockage centralisé des logs
  - Filtres par niveau (debug, info, warn, error)
  - Recherche dans les logs
  - Affichage du contexte structuré
  - Compteurs par niveau

**Usage** :

```tsx
import { createLog } from "@/lib/monitoring/logs";

createLog("info", "User action", { userId: "123" }, "frontend");
```

### 4. Alertes Automatiques ✅

- **Composant** : `AlertsPanel`
- **Fonctionnalités** :
  - Génération automatique d'alertes basées sur les seuils
  - Niveaux de sévérité (info, warning, error, critical)
  - Acknowledgment et résolution
  - Intégration Sentry pour les alertes critiques

**Usage** :

```tsx
import { alertManager } from "@/lib/monitoring/alerts";

alertManager.createAlert("warning", "High CPU Usage", "CPU usage is above 80%");
```

### 5. Profiling de Performance ✅

- **Composant** : `PerformanceProfiler`
- **Fonctionnalités** :
  - Profiling des opérations
  - Identification des bottlenecks
  - Métriques de durée
  - Détection automatique des opérations lentes

**Usage** :

```tsx
import { profiler } from "@/lib/monitoring/profiler";

profiler.start("operation-name");
// ... votre code ...
profiler.end("operation-name");
```

## 📄 Page de Monitoring

**Route** : `/monitoring`

**Fichier** : `apps/web/src/app/monitoring/page.tsx`

La page inclut :

- ✅ Dashboard de santé
- ✅ Graphiques de métriques (LCP, FID, CLS, FCP, TTFB)
- ✅ Métriques système
- ✅ Panel d'alertes
- ✅ Viewer de logs
- ✅ Profiler de performance

## 🔧 Configuration

### Variables d'Environnement

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### Intégration

Le système de monitoring s'intègre automatiquement avec :

- **Sentry** : Pour le tracking d'erreurs et alertes critiques
- **Web Vitals** : Tracking automatique des Core Web Vitals
- **Logger** : Logs structurés

## 📚 API

### Health Check

```typescript
import { checkApplicationHealth } from "@/lib/monitoring/health";

const health = await checkApplicationHealth();
```

### Metrics

```typescript
import { metricsCollector, trackWebVital } from "@/lib/monitoring/metrics";

trackWebVital("LCP", 1200, "ms");
const metrics = metricsCollector.getMetrics("LCP");
```

### Alerts

```typescript
import { alertManager } from "@/lib/monitoring/alerts";

const alerts = alertManager.getUnresolvedAlerts();
alertManager.acknowledgeAlert(alertId);
```

### Logs

```typescript
import { logStore, createLog } from "@/lib/monitoring/logs";

createLog("error", "API error", { endpoint: "/api/users" });
const logs = logStore.getLogs({ level: "error" });
```

### Profiler

```typescript
import { profiler } from "@/lib/monitoring/profiler";

const { result, profile } = await profiler.profile("operation", async () => {
  // votre code
});
```

## 🎨 Composants Disponibles

- `HealthStatus` - Statut de santé des services
- `MetricsChart` - Graphique de métriques
- `SystemMetrics` - Métriques système
- `AlertsPanel` - Panel d'alertes
- `LogsViewer` - Viewer de logs
- `PerformanceProfiler` - Profiler de performance

## 🚀 Utilisation

1. **Accéder au dashboard** :

   ```
   http://localhost:3000/monitoring
   ```

2. **Intégrer dans votre code** :

   ```tsx
   import { trackWebVital, createLog, profiler } from "@/lib/monitoring";

   // Track métriques
   trackWebVital("CustomMetric", 123, "ms");

   // Créer des logs
   createLog("info", "Operation completed", { duration: 123 });

   // Profiler
   profiler.start("my-operation");
   // ... code ...
   profiler.end("my-operation");
   ```

## 📊 Métriques Trackées

- **LCP** (Largest Contentful Paint) - < 2.5s
- **FID** (First Input Delay) - < 100ms
- **CLS** (Cumulative Layout Shift) - < 0.1
- **FCP** (First Contentful Paint) - < 1.8s
- **TTFB** (Time to First Byte) - < 800ms

## 🔔 Alertes Automatiques

Les alertes sont générées automatiquement quand :

- Les métriques dépassent les seuils warning/critical
- Les services sont down ou dégradés
- Des erreurs critiques surviennent

## 📈 Performance

- Refresh automatique des métriques
- Stockage en mémoire (limite configurable)
- Optimisé pour ne pas impacter les performances
