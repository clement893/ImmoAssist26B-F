#!/usr/bin/env node

/**
 * Script de génération de pages Next.js
 * Usage: node scripts/generate-page.js page-name [--app]
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const pageName = args[0];
const useAppRouter = args.includes("--app") || args.includes("-a");

if (!pageName) {
  console.error("❌ Erreur: Nom de la page requis");
  console.log("Usage: node scripts/generate-page.js page-name [--app]");
  process.exit(1);
}

// Validation du nom (kebab-case)
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pageName)) {
  console.error(
    "❌ Erreur: Le nom de la page doit être en kebab-case (ex: ma-page)",
  );
  process.exit(1);
}

const pagesDir = useAppRouter ? "apps/web/src/app" : "apps/web/src/pages";
const pagePath = path.join(process.cwd(), pagesDir, pageName);

// Créer le dossier
if (!fs.existsSync(pagePath)) {
  fs.mkdirSync(pagePath, { recursive: true });
  console.log(`✅ Dossier créé: ${pagePath}`);
} else {
  console.error(`❌ Erreur: Le dossier ${pagePath} existe déjà`);
  process.exit(1);
}

if (useAppRouter) {
  // App Router: créer page.tsx et layout.tsx
  const pageFile = path.join(pagePath, "page.tsx");
  const layoutFile = path.join(pagePath, "layout.tsx");

  const pageTemplate = `import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '${pageName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")}',
  description: 'Page ${pageName}',
};

export default function ${pageName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">
        ${pageName
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")}
      </h1>
      <p>Contenu de la page ${pageName}</p>
    </div>
  );
}
`;

  const layoutTemplate = `import type { ReactNode } from 'react';

export default function ${pageName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}Layout({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}
`;

  fs.writeFileSync(pageFile, pageTemplate);
  fs.writeFileSync(layoutFile, layoutTemplate);

  console.log(`✅ Page ${pageName} créée avec succès (App Router)!`);
  console.log(`📁 Fichiers créés:`);
  console.log(`   - ${pageFile}`);
  console.log(`   - ${layoutFile}`);
  console.log(`\n🌐 URL: /${pageName}`);
} else {
  // Pages Router: créer index.tsx
  const pageFile = path.join(pagePath, "index.tsx");

  const pageTemplate = `import type { NextPage } from 'next';
import Head from 'next/head';

const ${pageName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}Page: NextPage = () => {
  return (
    <>
      <Head>
        <title>${pageName
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")}</title>
        <meta name="description" content="Page ${pageName}" />
      </Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">
          ${pageName
            .split("-")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </h1>
        <p>Contenu de la page ${pageName}</p>
      </div>
    </>
  );
};

export default ${pageName
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")}Page;
`;

  fs.writeFileSync(pageFile, pageTemplate);

  console.log(`✅ Page ${pageName} créée avec succès (Pages Router)!`);
  console.log(`📁 Fichier créé:`);
  console.log(`   - ${pageFile}`);
  console.log(`\n🌐 URL: /${pageName}`);
}
