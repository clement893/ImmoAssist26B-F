/**
 * Centralized Icon Imports
 * Optimized icon imports from lucide-react
 *
 * Performance: Tree-shaking friendly, reduces bundle size
 * Only import icons that are actually used
 */

// Common icons - import only what you need
export {
  // Navigation
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Home,

  // Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  MoreVertical,
  MoreHorizontal,

  // Status
  Check,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader,
  RefreshCw,

  // Files
  File,
  FileText,
  Image,
  Folder,
  FolderOpen,

  // UI
  Eye,
  EyeOff,
  Lock,
  Unlock,
  User,
  Users,
  Bell,
  Mail,
  Calendar,
  Clock,
  Star,
  Heart,
  Globe,
  Database,
  Zap,
  Workflow,
  CreditCard,
  DollarSign,

  // Charts & Data
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,

  // Media
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipBack,
  SkipForward,
} from 'lucide-react';

// Type exports for TypeScript
export type { LucideIcon } from 'lucide-react';

/**
 * Usage:
 *
 * Instead of:
 * import { Menu, X, Home } from 'lucide-react';
 *
 * Use:
 * import { Menu, X, Home } from '@/lib/icons';
 *
 * This ensures tree-shaking works correctly and reduces bundle size.
 */
