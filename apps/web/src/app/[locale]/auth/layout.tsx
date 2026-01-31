// Force dynamic rendering for all auth pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
