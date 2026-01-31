#!/usr/bin/env node

/**
 * Script de génération de composants React
 * Usage: node scripts/generate-component.js ComponentName [--path=src/components]
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const componentName = args[0];
const pathArg = args.find((arg) => arg.startsWith("--path="));
const componentPath = pathArg
  ? pathArg.split("=")[1]
  : "apps/web/src/components";

if (!componentName) {
  console.error("❌ Erreur: Nom du composant requis");
  console.log(
    "Usage: node scripts/generate-component.js ComponentName [--path=src/components]",
  );
  process.exit(1);
}

// Validation du nom
if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
  console.error(
    "❌ Erreur: Le nom du composant doit commencer par une majuscule et contenir uniquement des lettres et chiffres",
  );
  process.exit(1);
}

const fullPath = path.join(process.cwd(), componentPath, componentName);
const componentFile = path.join(fullPath, `${componentName}.tsx`);
const indexFile = path.join(fullPath, "index.ts");
const stylesFile = path.join(fullPath, `${componentName}.module.css`);

// Créer le dossier
if (!fs.existsSync(fullPath)) {
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`✅ Dossier créé: ${fullPath}`);
} else {
  console.error(`❌ Erreur: Le dossier ${fullPath} existe déjà`);
  process.exit(1);
}

// Template du composant
const componentTemplate = `'use client';

import type { ReactNode } from 'react';
import styles from './${componentName}.module.css';

export interface ${componentName}Props {
  children?: ReactNode;
  className?: string;
}

export default function ${componentName}({
  children,
  className,
}: ${componentName}Props) {
  return (
    <div className={\`\${styles.${componentName.toLowerCase()} \${className || ''}\`}>
      {children}
    </div>
  );
}
`;

// Template du fichier index
const indexTemplate = `export { default } from './${componentName}';
export type { ${componentName}Props } from './${componentName}';
`;

// Template CSS
const cssTemplate = `.${componentName.toLowerCase()} {
  /* Styles pour ${componentName} */
}
`;

// Créer les fichiers
fs.writeFileSync(componentFile, componentTemplate);
fs.writeFileSync(indexFile, indexTemplate);
fs.writeFileSync(stylesFile, cssTemplate);

console.log(`✅ Composant ${componentName} créé avec succès!`);
console.log(`📁 Fichiers créés:`);
console.log(`   - ${componentFile}`);
console.log(`   - ${indexFile}`);
console.log(`   - ${stylesFile}`);
console.log(
  `\n💡 Import: import ${componentName} from '${componentPath}/${componentName}';`,
);
