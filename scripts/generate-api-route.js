#!/usr/bin/env node

/**
 * Script de génération de routes API Next.js
 * Usage: node scripts/generate-api-route.js route-name [--method=GET]
 */

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const routeName = args[0];
const methodArg = args.find((arg) => arg.startsWith("--method="));
const httpMethod = methodArg ? methodArg.split("=")[1].toUpperCase() : "GET";

const validMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
if (!validMethods.includes(httpMethod)) {
  console.error(
    `❌ Erreur: Méthode HTTP invalide. Utilisez: ${validMethods.join(", ")}`,
  );
  process.exit(1);
}

if (!routeName) {
  console.error("❌ Erreur: Nom de la route requis");
  console.log(
    "Usage: node scripts/generate-api-route.js route-name [--method=GET]",
  );
  process.exit(1);
}

// Validation du nom (kebab-case)
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(routeName)) {
  console.error(
    "❌ Erreur: Le nom de la route doit être en kebab-case (ex: ma-route)",
  );
  process.exit(1);
}

const apiDir = "apps/web/src/app/api";
const routePath = path.join(process.cwd(), apiDir, routeName);

// Créer le dossier
if (!fs.existsSync(routePath)) {
  fs.mkdirSync(routePath, { recursive: true });
  console.log(`✅ Dossier créé: ${routePath}`);
} else {
  console.error(`❌ Erreur: Le dossier ${routePath} existe déjà`);
  process.exit(1);
}

const routeFile = path.join(routePath, "route.ts");

const routeTemplate = `import { NextRequest, NextResponse } from 'next/server';

export async function ${httpMethod}(request: NextRequest) {
  try {
    // TODO: Implémenter la logique de la route
    
    return NextResponse.json(
      { 
        success: true,
        message: '${routeName} ${httpMethod} endpoint',
        data: null 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in ${routeName}:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

${validMethods
  .filter((m) => m !== httpMethod)
  .map(
    (m) => `export async function ${m}(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method ${m} not allowed' },
    { status: 405 }
  );
}`,
  )
  .join("\n\n")}
`;

fs.writeFileSync(routeFile, routeTemplate);

console.log(`✅ Route API ${routeName} créée avec succès!`);
console.log(`📁 Fichier créé:`);
console.log(`   - ${routeFile}`);
console.log(`\n🌐 Endpoint: /api/${routeName}`);
console.log(`📡 Méthode: ${httpMethod}`);
