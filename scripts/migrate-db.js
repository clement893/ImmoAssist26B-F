#!/usr/bin/env node

/**
 * Script de migration de base de données automatisé
 * Usage:
 *   node scripts/migrate-db.js create MigrationName
 *   node scripts/migrate-db.js upgrade [revision]
 *   node scripts/migrate-db.js downgrade [revision]
 *   node scripts/migrate-db.js current
 *   node scripts/migrate-db.js history
 */

const { execSync } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const command = args[0];
const migrationName = args[1];

const backendPath = path.join(process.cwd(), "backend");

function runCommand(cmd, options = {}) {
  try {
    const output = execSync(cmd, {
      cwd: backendPath,
      stdio: "inherit",
      ...options,
    });
    return output;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution: ${cmd}`);
    process.exit(1);
  }
}

switch (command) {
  case "create":
    if (!migrationName) {
      console.error("❌ Erreur: Nom de migration requis");
      console.log("Usage: node scripts/migrate-db.js create MigrationName");
      process.exit(1);
    }
    console.log(`📝 Création de la migration: ${migrationName}`);
    runCommand(`alembic revision --autogenerate -m "${migrationName}"`);
    console.log(`✅ Migration créée avec succès!`);
    break;

  case "upgrade":
    const revision = migrationName || "head";
    console.log(`⬆️  Application de la migration vers: ${revision}`);
    runCommand(`alembic upgrade ${revision}`);
    console.log(`✅ Migration appliquée avec succès!`);
    break;

  case "downgrade":
    const targetRevision = migrationName || "-1";
    console.log(`⬇️  Rétrogradation de la migration vers: ${targetRevision}`);
    runCommand(`alembic downgrade ${targetRevision}`);
    console.log(`✅ Migration rétrogradée avec succès!`);
    break;

  case "current":
    console.log("📊 Révision actuelle:");
    runCommand("alembic current");
    break;

  case "history":
    console.log("📜 Historique des migrations:");
    runCommand("alembic history");
    break;

  case "stamp":
    if (!migrationName) {
      console.error("❌ Erreur: Révision requise");
      console.log("Usage: node scripts/migrate-db.js stamp revision");
      process.exit(1);
    }
    console.log(
      `🏷️  Marquage de la base de données à la révision: ${migrationName}`,
    );
    runCommand(`alembic stamp ${migrationName}`);
    console.log(`✅ Base de données marquée avec succès!`);
    break;

  default:
    console.error("❌ Commande inconnue:", command);
    console.log("\nCommandes disponibles:");
    console.log("  create <name>     - Créer une nouvelle migration");
    console.log(
      "  upgrade [rev]     - Appliquer les migrations (vers head par défaut)",
    );
    console.log(
      "  downgrade [rev]    - Rétrograder les migrations (1 révision par défaut)",
    );
    console.log("  current           - Afficher la révision actuelle");
    console.log("  history           - Afficher l'historique des migrations");
    console.log(
      "  stamp <rev>       - Marquer la base de données à une révision",
    );
    process.exit(1);
}
