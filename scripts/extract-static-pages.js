/**
 * Script pour extraire la liste complète des pages statiques
 * depuis les logs du build Next.js
 */

const fs = require("fs");
const path = require("path");

// Routes statiques extraites des logs du build
const staticRoutes = [
  // Pages sans locale
  "/",
  "/_not-found",
  "/admin/invitations",
  "/admin/rbac",
  "/admin/settings",
  "/admin/teams",
  "/dashboard",
  "/dashboard/become-superadmin",
  "/dashboard/projects",
  "/db/test",
  "/docs",
  "/examples",
  "/examples/dashboard",
  "/examples/onboarding",
  "/examples/settings",
  "/icon.svg",
  "/monitoring",
  "/monitoring/errors",
  "/monitoring/performance",
  "/pricing",
  "/robots.txt",
  "/sentry/test",
  "/sitemap",
  "/sitemap.xml",
  "/stripe/test",
  "/subscriptions",
  "/subscriptions/success",
  "/test-sentry",
];

// Routes avec locale (× 4 locales: en, fr, ar, he)
const localeRoutes = [
  // Blog (8 routes × 4 = 32 pages)
  "/blog",
  "/blog/[slug]",
  "/blog/archive/[year]",
  "/blog/author/[author]",
  "/blog/category/[category]",
  "/blog/rss",
  "/blog/sitemap",
  "/blog/tag/[tag]",

  // Publiques (3 routes × 4 = 12 pages)
  "/docs",
  "/pricing",
  "/sitemap",

  // Auth (4 routes × 4 = 16 pages)
  "/auth/login",
  "/auth/register",
  "/auth/signin",
  "/auth/callback",

  // Test (3 routes × 4 = 12 pages)
  "/db/test",
  "/email/test",
  "/stripe/test",

  // Exemples (11 routes × 4 = 44 pages)
  "/examples",
  "/examples/api-fetching",
  "/examples/auth",
  "/examples/crud",
  "/examples/dashboard",
  "/examples/data-table",
  "/examples/file-upload",
  "/examples/modal",
  "/examples/onboarding",
  "/examples/search",
  "/examples/settings",

  // Components (~70 routes × 4 = ~280 pages)
  "/components",
  "/components/activity",
  "/components/admin",
  "/components/advanced",
  "/components/ai",
  "/components/analytics",
  "/components/auth",
  "/components/billing",
  "/components/blog",
  "/components/charts",
  "/components/client",
  "/components/cms",
  "/components/collaboration",
  "/components/content",
  "/components/data",
  "/components/erp",
  "/components/errors",
  "/components/favorites",
  "/components/feedback",
  "/components/forms",
  "/components/help",
  "/components/i18n",
  "/components/integrations",
  "/components/layout",
  "/components/marketing",
  "/components/media",
  "/components/monitoring",
  "/components/navigation",
  "/components/notifications",
  "/components/page-builder",
  "/components/performance",
  "/components/profile",
  "/components/providers",
  "/components/rbac",
  "/components/search",
  "/components/sections",
  "/components/seo",
  "/components/settings",
  "/components/sharing",
  "/components/subscriptions",
  "/components/surveys",
  "/components/tags",
  "/components/templates",
  "/components/theme",
  "/components/utils",
  "/components/versions",
  "/components/workflow",

  // Help publiques (4 routes × 4 = 16 pages)
  "/help",
  "/help/faq",
  "/help/guides",
  "/help/videos",

  // Menus (1 route × 4 = 4 pages)
  "/menus",

  // Monitoring publiques (3 routes × 4 = 12 pages)
  "/monitoring",
  "/monitoring/errors",
  "/monitoring/performance",

  // Test (3 routes × 4 = 12 pages)
  "/sentry/test",
  "/test-sentry",
  "/check-my-superadmin-status",

  // Content publiques (1 route × 4 = 4 pages)
  "/content",

  // Surveys publiques (1 route × 4 = 4 pages)
  "/surveys",

  // Onboarding publiques (1 route × 4 = 4 pages)
  "/onboarding",

  // Subscriptions publiques (2 routes × 4 = 8 pages)
  "/subscriptions",
  "/subscriptions/success",

  // Upload publiques (1 route × 4 = 4 pages)
  "/upload",

  // SEO publiques (1 route × 4 = 4 pages)
  "/seo",
];

const locales = ["en", "fr", "ar", "he"];

// Générer toutes les combinaisons
const allStaticPages = [];

// Pages sans locale
staticRoutes.forEach((route) => {
  allStaticPages.push(route);
});

// Pages avec locale
localeRoutes.forEach((route) => {
  locales.forEach((locale) => {
    const fullRoute = `/${locale}${route}`;
    // Remplacer les paramètres dynamiques par des exemples
    const staticRoute = fullRoute
      .replace("/[slug]", "/example-slug")
      .replace("/[year]", "/2024")
      .replace("/[author]", "/example-author")
      .replace("/[category]", "/example-category")
      .replace("/[tag]", "/example-tag");
    allStaticPages.push(staticRoute);
  });
});

// Trier et dédupliquer
const uniquePages = [...new Set(allStaticPages)].sort();

// Générer le rapport
const report = `# Liste Complète des ${uniquePages.length} Pages Statiques

**Date** : 2025-12-27  
**Source** : Analyse des logs de build Next.js  
**Total** : ${uniquePages.length} pages statiques

## Pages Statiques (○)

${uniquePages.map((page, index) => `${index + 1}. \`${page}\``).join("\n")}

## Répartition par Catégorie

### Pages Sans Locale
- **Total** : ${staticRoutes.length} pages
- Routes : ${staticRoutes.map((r) => `\`${r}\``).join(", ")}

### Pages Avec Locale (× 4 locales)
- **Total** : ${localeRoutes.length} routes × 4 locales = ${localeRoutes.length * 4} pages
- Routes : ${localeRoutes.map((r) => `\`${r}\``).join(", ")}

## Notes

1. Les routes avec paramètres dynamiques (ex: \`/[slug]\`) sont listées avec des valeurs d'exemple
2. Les pages components sont des pages de démonstration
3. Les pages publiques restent statiques pour le SEO
4. Les pages auth sont statiques pour performance

`;

fs.writeFileSync(
  path.join(__dirname, "../STATIC_PAGES_COMPLETE_LIST.md"),
  report,
);
console.log(`✅ Liste générée : ${uniquePages.length} pages statiques`);
console.log(`📄 Fichier créé : STATIC_PAGES_COMPLETE_LIST.md`);
