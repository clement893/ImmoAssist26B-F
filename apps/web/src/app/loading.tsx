/**
 * Global Loading Component
 * Shown during route transitions for better UX
 */

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
