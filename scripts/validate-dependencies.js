#!/usr/bin/env node

/**
 * Script de validation des dépendances du monorepo
 * Vérifie que les règles d'isolation sont respectées
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const APPS_DIR = path.join(ROOT_DIR, "apps");
const PACKAGES_DIR = path.join(ROOT_DIR, "packages");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");

// Règles d'isolation
const RULES = {
  // Les apps peuvent dépendre de packages
  "apps/*": {
    canDependOn: ["packages/*"],
    cannotDependOn: ["apps/*", "backend/*"],
  },
  // Les packages peuvent dépendre d'autres packages (mais pas d'apps)
  "packages/*": {
    canDependOn: ["packages/*"],
    cannotDependOn: ["apps/*", "backend/*"],
  },
  // Le backend ne peut dépendre de rien du frontend
  backend: {
    canDependOn: [],
    cannotDependOn: ["apps/*", "packages/*"],
  },
};

// Packages interdits dans le backend
const BACKEND_FORBIDDEN_IMPORTS = [
  "@modele/types",
  "@modele/",
  "next",
  "react",
  "react-dom",
];

/**
 * Lit le package.json d'un répertoire
 */
function readPackageJson(dir) {
  const packageJsonPath = path.join(dir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  } catch (error) {
    console.error(
      `Erreur lors de la lecture de ${packageJsonPath}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Détermine le type d'un package (app, package, backend)
 */
function getPackageType(packagePath) {
  const relativePath = path.relative(ROOT_DIR, packagePath);

  if (relativePath.startsWith("apps/")) {
    return "apps/*";
  }
  if (relativePath.startsWith("packages/")) {
    return "packages/*";
  }
  if (relativePath.startsWith("backend")) {
    return "backend";
  }
  return null;
}

/**
 * Vérifie les dépendances d'un package
 */
function validatePackageDependencies(packagePath, packageJson) {
  const packageType = getPackageType(packagePath);
  if (!packageType) {
    return { valid: true, errors: [] };
  }

  const rules = RULES[packageType];
  if (!rules) {
    return { valid: true, errors: [] };
  }

  const errors = [];
  const allDependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
    ...packageJson.peerDependencies,
  };

  // Vérifier les dépendances interdites
  for (const [depName, depVersion] of Object.entries(allDependencies)) {
    // Vérifier les règles spécifiques au backend
    if (packageType === "backend") {
      if (
        BACKEND_FORBIDDEN_IMPORTS.some((forbidden) =>
          depName.startsWith(forbidden),
        )
      ) {
        errors.push({
          type: "forbidden_dependency",
          package: path.relative(ROOT_DIR, packagePath),
          dependency: depName,
          reason: `Le backend ne peut pas dépendre de packages frontend`,
        });
      }
    }

    // Vérifier les dépendances vers d'autres apps
    if (rules.cannotDependOn.includes("apps/*")) {
      // Chercher si cette dépendance correspond à une app
      const apps = fs.readdirSync(APPS_DIR).filter((dir) => {
        const appPath = path.join(APPS_DIR, dir);
        const appPackageJson = readPackageJson(appPath);
        return appPackageJson && appPackageJson.name === depName;
      });

      if (apps.length > 0) {
        errors.push({
          type: "forbidden_dependency",
          package: path.relative(ROOT_DIR, packagePath),
          dependency: depName,
          reason: `Les ${packageType} ne peuvent pas dépendre d'apps`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Vérifie les imports dans les fichiers source
 */
function validateSourceImports(packagePath, packageType) {
  const errors = [];

  // Pour le backend, vérifier qu'il n'y a pas d'imports frontend
  if (packageType === "backend") {
    const sourceFiles = findSourceFiles(packagePath, [".py"]);

    for (const file of sourceFiles) {
      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");

      lines.forEach((line, index) => {
        // Détecter les imports suspects (même si peu probable en Python)
        if (line.includes("from apps.") || line.includes("from packages.")) {
          errors.push({
            type: "forbidden_import",
            file: path.relative(ROOT_DIR, file),
            line: index + 1,
            content: line.trim(),
            reason: "Le backend ne peut pas importer du code frontend",
          });
        }
      });
    }
  }

  return errors;
}

/**
 * Trouve tous les fichiers source dans un répertoire
 */
function findSourceFiles(dir, extensions) {
  const files = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      // Ignorer node_modules, .next, dist, etc.
      if (entry.isDirectory()) {
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === ".next" ||
          entry.name === "dist" ||
          entry.name === "build" ||
          entry.name === "__pycache__"
        ) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return files;
}

/**
 * Fonction principale
 */
function main() {
  console.log("🔍 Validation des dépendances du monorepo...\n");

  const allErrors = [];
  const packages = [];

  // Vérifier les apps
  if (fs.existsSync(APPS_DIR)) {
    const apps = fs.readdirSync(APPS_DIR);
    for (const app of apps) {
      const appPath = path.join(APPS_DIR, app);
      const packageJson = readPackageJson(appPath);
      if (packageJson) {
        packages.push({ path: appPath, json: packageJson });
      }
    }
  }

  // Vérifier les packages
  if (fs.existsSync(PACKAGES_DIR)) {
    const packageDirs = fs.readdirSync(PACKAGES_DIR);
    for (const pkg of packageDirs) {
      const packagePath = path.join(PACKAGES_DIR, pkg);
      const packageJson = readPackageJson(packagePath);
      if (packageJson) {
        packages.push({ path: packagePath, json: packageJson });
      }
    }
  }

  // Vérifier le backend
  const backendPackageJson = readPackageJson(BACKEND_DIR);
  if (backendPackageJson) {
    packages.push({ path: BACKEND_DIR, json: backendPackageJson });
  }

  // Valider chaque package
  for (const { path: packagePath, json: packageJson } of packages) {
    const packageType = getPackageType(packagePath);
    const result = validatePackageDependencies(packagePath, packageJson);

    if (!result.valid) {
      allErrors.push(...result.errors);
    }

    // Valider les imports source (optionnel, peut être lent)
    if (process.env.VALIDATE_IMPORTS === "true") {
      const importErrors = validateSourceImports(packagePath, packageType);
      allErrors.push(...importErrors);
    }
  }

  // Afficher les résultats
  if (allErrors.length === 0) {
    console.log("✅ Toutes les dépendances sont valides!\n");
    console.log(`Vérifié ${packages.length} package(s):`);
    packages.forEach(({ path: pkgPath }) => {
      console.log(`  - ${path.relative(ROOT_DIR, pkgPath)}`);
    });
    return 0;
  } else {
    console.error(`❌ ${allErrors.length} erreur(s) trouvée(s):\n`);

    allErrors.forEach((error, index) => {
      console.error(`${index + 1}. ${error.type}`);
      console.error(`   Package: ${error.package}`);
      if (error.dependency) {
        console.error(`   Dépendance: ${error.dependency}`);
      }
      if (error.file) {
        console.error(`   Fichier: ${error.file}:${error.line}`);
        console.error(`   Ligne: ${error.content}`);
      }
      console.error(`   Raison: ${error.reason}\n`);
    });

    console.error("\n💡 Pour valider aussi les imports source, utilisez:");
    console.error("   VALIDATE_IMPORTS=true pnpm validate:dependencies\n");

    return 1;
  }
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { validatePackageDependencies, validateSourceImports };
