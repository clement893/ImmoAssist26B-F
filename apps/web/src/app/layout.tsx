/**
 * Root Layout
 *
 * With next-intl, the root layout should NOT render <html> and <body>
 * Those are handled by the [locale] layout. This layout just passes children through.
 */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // With next-intl, the [locale] layout handles <html> and <body>
  // This root layout just passes children through
  return <>{children}</>;
}
