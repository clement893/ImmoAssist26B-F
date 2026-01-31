'use client';

// This layout doesn't need to wrap with DashboardLayout again
// as it's already applied by the parent /dashboard/layout.tsx
// This prevents double sidebars/menus
export default function FormulaireModuleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
