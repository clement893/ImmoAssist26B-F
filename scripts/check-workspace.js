#!/usr/bin/env node

/**
 * Script de vérification des dépendances workspace
 * Vérifie que toutes les dépendances workspace sont correctement configurées
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

function findWorkspacePackages() {
  const packages = [];
  const rootDir = process.cwd();

  // Apps
  const appsDir = path.join(rootDir, "apps");
  if (fs.existsSync(appsDir)) {
    const apps = fs.readdirSync(appsDir);
    apps.forEach((app) => {
      const appPath = path.join(appsDir, app);
      if (fs.statSync(appPath).isDirectory()) {
        const pkgPath = path.join(appPath, "package.json");
        if (fs.existsSync(pkgPath)) {
          packages.push({ path: appPath, pkgPath, type: "app", name: app });
        }
      }
    });
  }

  // Packages
  const packagesDir = path.join(rootDir, "packages");
  if (fs.existsSync(packagesDir)) {
    const pkgs = fs.readdirSync(packagesDir);
    pkgs.forEach((pkg) => {
      const pkgPath = path.join(packagesDir, pkg);
      if (fs.statSync(pkgPath).isDirectory()) {
        const pkgJsonPath = path.join(pkgPath, "package.json");
        if (fs.existsSync(pkgJsonPath)) {
          packages.push({
            path: pkgPath,
            pkgPath: pkgJsonPath,
            type: "package",
            name: pkg,
          });
        }
      }
    });
  }

  return packages;
}

function checkWorkspaceDependencies() {
  log("\n🔍 Vérification des dépendances workspace...\n", "cyan");

  const packages = findWorkspacePackages();
  const packageNames = new Map();

  // Collecter tous les noms de packages
  packages.forEach((pkg) => {
    const pkgJson = readPackageJson(pkg.pkgPath);
    if (pkgJson && pkgJson.name) {
      packageNames.set(pkgJson.name, pkg);
    }
  });

  let hasErrors = false;
  const issues = [];

  // Vérifier chaque package
  packages.forEach((pkg) => {
    const pkgJson = readPackageJson(pkg.pkgPath);
    if (!pkgJson) return;

    const deps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    };

    Object.entries(deps).forEach(([depName, depVersion]) => {
      // Vérifier si c'est une dépendance workspace
      if (
        depVersion.startsWith("workspace:") ||
        depVersion === "*" ||
        depVersion === "^" ||
        depVersion === "~"
      ) {
        if (packageNames.has(depName)) {
          log(`✅ ${pkgJson.name} → ${depName}`, "green");
        } else {
          log(`❌ ${pkgJson.name} → ${depName} (package introuvable)`, "red");
          issues.push(
            `${pkgJson.name} référence ${depName} mais le package n'existe pas`,
          );
          hasErrors = true;
        }
      } else if (packageNames.has(depName)) {
        // Dépendance workspace mais pas avec le protocol workspace
        log(
          `⚠️  ${pkgJson.name} → ${depName} (devrait utiliser workspace:*)`,
          "yellow",
        );
        issues.push(
          `${pkgJson.name} référence ${depName} mais n'utilise pas le protocol workspace`,
        );
      }
    });
  });

  // Vérifier les packages qui devraient être buildés avant d'autres
  log("\n📦 Vérification de l'ordre de build...\n", "cyan");
  packages.forEach((pkg) => {
    const pkgJson = readPackageJson(pkg.pkgPath);
    if (!pkgJson) return;

    const deps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {}),
    };

    const workspaceDeps = Object.keys(deps).filter((dep) =>
      packageNames.has(dep),
    );
    if (workspaceDeps.length > 0 && pkg.type === "app") {
      log(`✅ ${pkgJson.name} dépend de: ${workspaceDeps.join(", ")}`, "blue");
    }
  });

  if (hasErrors) {
    log("\n❌ Problèmes détectés:", "red");
    issues.forEach((issue) => log(`  - ${issue}`, "red"));
    process.exit(1);
  }

  log(
    "\n✅ Toutes les dépendances workspace sont correctement configurées!",
    "green",
  );
}

checkWorkspaceDependencies();
