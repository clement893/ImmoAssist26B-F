// Force dynamic rendering for all AI pages
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function AILayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
