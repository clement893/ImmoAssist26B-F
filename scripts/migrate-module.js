#!/usr/bin/env node

/**
 * Script de migration de module externe
 *
 * Usage: node scripts/migrate-module.js <chemin-source> <nom-module> [options]
 *
 * Options:
 *   --type <type>     Type de module: 'frontend', 'backend', 'shared' (défaut: 'shared')
 *   --dry-run         Afficher ce qui sera fait sans modifier les fichiers
 *   --skip-adapt      Ne pas adapter les imports automatiquement
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipAdapt = args.includes("--skip-adapt");
const typeIndex = args.indexOf("--type");
const moduleType = typeIndex !== -1 ? args[typeIndex + 1] : "shared";

const [sourcePath, moduleName] = args.filter(
  (arg) => !arg.startsWith("--") && arg !== moduleType,
);

if (!sourcePath || !moduleName) {
  console.error(
    "❌ Usage: node scripts/migrate-module.js <chemin-source> <nom-module> [options]",
  );
  console.error("");
  console.error("Options:");
  console.error(
    "  --type <type>     Type de module: frontend, backend, shared (défaut: shared)",
  );
  console.error(
    "  --dry-run         Afficher ce qui sera fait sans modifier les fichiers",
  );
  console.error(
    "  --skip-adapt      Ne pas adapter les imports automatiquement",
  );
  process.exit(1);
}

// Déterminer le chemin de destination selon le type
let targetPath;
if (moduleType === "frontend") {
  targetPath = path.join(__dirname, "..", "packages", moduleName);
} else if (moduleType === "backend") {
  targetPath = path.join(
    __dirname,
    "..",
    "backend",
    "app",
    "modules",
    moduleName,
  );
} else {
  targetPath = path.join(__dirname, "..", "packages", moduleName);
}

console.log("📦 Migration de module");
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
);
console.log(`Source:      ${sourcePath}`);
console.log(`Destination: ${targetPath}`);
console.log(`Type:        ${moduleType}`);
console.log(
  `Mode:        ${dryRun ? "DRY RUN (aucune modification)" : "EXECUTION"}`,
);
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
);

// Vérifier que le chemin source existe
if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Le chemin source n'existe pas: ${sourcePath}`);
  process.exit(1);
}

// Fonction pour adapter les imports selon le type de module
function adaptImports(content, filePath, sourceDir, targetDir) {
  let adapted = content;

  if (moduleType === "frontend" || moduleType === "shared") {
    // Adapter les imports relatifs vers des imports de packages
    adapted = adapted.replace(
      /from ['"]@modele\/([^'"]+)['"]/g,
      (match, pkg) => {
        // Garder les imports de packages existants
        return match;
      },
    );

    // Adapter les imports relatifs vers @/ (alias Next.js)
    adapted = adapted.replace(
      /from ['"]\.\.\/\.\.\/lib\/([^'"]+)['"]/g,
      "from '@/lib/$1'",
    );
    adapted = adapted.replace(
      /from ['"]\.\.\/\.\.\/components\/([^'"]+)['"]/g,
      "from '@/components/$1'",
    );
    adapted = adapted.replace(
      /from ['"]\.\.\/\.\.\/app\/([^'"]+)['"]/g,
      "from '@/app/$1'",
    );

    // Adapter les imports de types
    adapted = adapted.replace(
      /from ['"]@modele\/types['"]/g,
      "from '@modele/types'",
    );
  } else if (moduleType === "backend") {
    // Adapter les imports Python
    adapted = adapted.replace(
      /from app\.modules\.([^.]+)\./g,
      `from app.modules.${moduleName}.`,
    );
    adapted = adapted.replace(
      /import app\.modules\.([^.]+)\./g,
      `import app.modules.${moduleName}.`,
    );
  }

  return adapted;
}

// Fonction pour copier et adapter les fichiers
function copyAndAdapt(src, dest, relativePath = "") {
  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    // Ignorer certains dossiers
    const ignoreDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      "__pycache__",
      ".pytest_cache",
    ];
    const dirName = path.basename(src);

    if (ignoreDirs.includes(dirName)) {
      if (!dryRun) {
        console.log(`⏭️  Ignoré: ${relativePath || dirName}`);
      }
      return;
    }

    if (!dryRun && !fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const files = fs.readdirSync(src);
    files.forEach((file) => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const relPath = path.join(relativePath, file);
      copyAndAdapt(srcPath, destPath, relPath);
    });
  } else {
    // Ignorer certains fichiers
    const ignoreFiles = [
      ".DS_Store",
      ".gitignore",
      "package-lock.json",
      "pnpm-lock.yaml",
    ];
    const fileName = path.basename(src);

    if (ignoreFiles.includes(fileName)) {
      if (!dryRun) {
        console.log(`⏭️  Ignoré: ${relativePath || fileName}`);
      }
      return;
    }

    let content = fs.readFileSync(src, "utf8");

    // Adapter le contenu selon le type de fichier
    if (!skipAdapt) {
      const ext = path.extname(src);
      if ([".ts", ".tsx", ".js", ".jsx", ".py"].includes(ext)) {
        content = adaptImports(content, src, sourcePath, targetPath);
      }
    }

    if (!dryRun) {
      fs.writeFileSync(dest, content);
      console.log(`✅ Copié: ${relativePath || fileName}`);
    } else {
      console.log(`📄 Sera copié: ${relativePath || fileName}`);
    }
  }
}

// Créer la structure de base
if (!dryRun) {
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

// Copier les fichiers
console.log("\n📋 Copie des fichiers...\n");
copyAndAdapt(sourcePath, targetPath);

// Créer les fichiers de configuration selon le type
if (!dryRun) {
  if (moduleType === "frontend" || moduleType === "shared") {
    // Créer package.json
    const packageJsonPath = path.join(targetPath, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
      const packageJson = {
        name: `@modele/${moduleName}`,
        version: "1.0.0",
        description: `Module ${moduleName} migrated from external project`,
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: {
          build: "tsc",
          dev: "tsc --watch",
          "type-check": "tsc --noEmit",
          clean: "rm -rf dist",
        },
        dependencies: {},
        peerDependencies: {
          react: "^18.0.0",
          "react-dom": "^18.0.0",
        },
        devDependencies: {
          typescript: "^5.3.3",
        },
      };
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`✅ Créé: package.json`);
    }

    // Créer tsconfig.json
    const tsconfigPath = path.join(targetPath, "tsconfig.json");
    if (!fs.existsSync(tsconfigPath)) {
      const baseTsconfig = path.join(
        __dirname,
        "..",
        "packages",
        "types",
        "tsconfig.json",
      );
      let tsconfig = {
        extends: "../../tsconfig.base.json",
        compilerOptions: {
          outDir: "./dist",
          rootDir: "./src",
          declaration: true,
          declarationMap: true,
          composite: true,
        },
        include: ["src/**/*"],
        exclude: ["node_modules", "dist"],
      };

      // Si tsconfig.base.json existe, l'utiliser
      const baseTsconfigPath = path.join(__dirname, "..", "tsconfig.base.json");
      if (fs.existsSync(baseTsconfigPath)) {
        tsconfig.extends = "../../tsconfig.base.json";
      }

      fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
      console.log(`✅ Créé: tsconfig.json`);
    }

    // Créer src/index.ts si nécessaire
    const srcDir = path.join(targetPath, "src");
    const indexPath = path.join(srcDir, "index.ts");
    if (!fs.existsSync(indexPath) && fs.existsSync(srcDir)) {
      // Chercher le fichier d'export principal
      const files = fs.readdirSync(srcDir);
      const mainFile = files.find(
        (f) => f === "index.ts" || f === "index.tsx" || f === "main.ts",
      );

      if (!mainFile) {
        // Créer un index.ts basique
        fs.writeFileSync(
          indexPath,
          `// Export all from ${moduleName} module\n`,
        );
        console.log(`✅ Créé: src/index.ts`);
      }
    }
  } else if (moduleType === "backend") {
    // Créer __init__.py si nécessaire
    const initPath = path.join(targetPath, "__init__.py");
    if (!fs.existsSync(initPath)) {
      fs.writeFileSync(initPath, `"""${moduleName} module"""\n`);
      console.log(`✅ Créé: __init__.py`);
    }
  }
}

console.log(
  "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
);
if (dryRun) {
  console.log("✅ DRY RUN terminé - Aucune modification effectuée");
  console.log("💡 Exécutez sans --dry-run pour appliquer les changements");
} else {
  console.log("✅ Migration terminée!");
  console.log(`\n📝 Prochaines étapes:`);
  console.log(`   1. Vérifiez le code dans: ${targetPath}`);
  console.log(`   2. Adaptez les imports si nécessaire`);

  if (moduleType === "frontend" || moduleType === "shared") {
    console.log(
      `   3. Installez les dépendances: cd ${targetPath} && pnpm install`,
    );
    console.log(`   4. Build: cd ${targetPath} && pnpm build`);
    console.log(
      `   5. Ajoutez au projet: "@modele/${moduleName}": "workspace:*" dans apps/web/package.json`,
    );
  } else if (moduleType === "backend") {
    console.log(
      `   3. Ajoutez les imports dans backend/app/models/__init__.py`,
    );
    console.log(
      `   4. Créez les migrations: cd backend && alembic revision --autogenerate -m "Add ${moduleName} module"`,
    );
    console.log(`   5. Appliquez les migrations: alembic upgrade head`);
  }

  console.log(`   6. Testez le module`);
}
console.log(
  "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n",
);
