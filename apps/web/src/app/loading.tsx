/**
 * Global Loading Screen
 * Affiché pendant les transitions de route (Next.js)
 */

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {/* Subtle background gradient */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--color-primary-100),transparent_50%)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,var(--color-primary-950),transparent_50%)] pointer-events-none"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo / brand mark */}
        <span className="text-primary-600 dark:text-primary-400 font-semibold tracking-widest uppercase text-sm opacity-90">
          ImmoAssist
        </span>
        {/* Spinner: double ring */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute w-14 h-14 rounded-full border-2 border-primary-200 dark:border-primary-800"
            aria-hidden
          />
          <div
            className="w-14 h-14 rounded-full border-2 border-primary-600 dark:border-primary-400 border-t-transparent animate-spin"
            aria-hidden
          />
          <div
            className="absolute w-8 h-8 rounded-full border-2 border-primary-400 dark:border-primary-500 border-b-transparent animate-spin [animation-duration:0.8s] [animation-direction:reverse]"
            aria-hidden
          />
        </div>
        {/* Label */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-foreground/90">Chargement</p>
          <div className="flex gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:0ms]"
              aria-hidden
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:150ms]"
              aria-hidden
            />
            <span
              className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-bounce [animation-delay:300ms]"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
