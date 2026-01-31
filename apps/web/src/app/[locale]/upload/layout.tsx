// Force dynamic rendering for upload page
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
