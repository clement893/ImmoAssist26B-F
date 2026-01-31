#!/usr/bin/env node

/**
 * CLI Générateur de Code
 * Génère automatiquement modèles, schemas, endpoints et pages
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const commands = {
  model: require("./generators/model"),
  schema: require("./generators/schema"),
  endpoint: require("./generators/endpoint"),
  page: require("./generators/page"),
  types: require("./generators/types"),
  all: require("./generators/all"),
};

function showHelp() {
  console.log(`
Usage: node scripts/generate/cli.js <command> [options]

Commands:
  model <name>              Génère un modèle SQLAlchemy
  schema <name>             Génère des schemas Pydantic (Create/Update/Response)
  endpoint <name>           Génère des endpoints FastAPI CRUD
  page <name>               Génère une page Next.js avec DataTable
  types                     Synchronise les types TypeScript depuis le backend
  all <name>                Génère tout (model, schema, endpoint, page)

Options:
  --fields <fields>         Champs du modèle (format: name:type:required)
                            Ex: --fields "name:string:true,email:string:true,age:integer:false"
  --relations <relations>   Relations (format: name:type:model)
                            Ex: --relations "user:many-to-one:User,posts:one-to-many:Post"
  --api-path <path>         Chemin API (défaut: /api/v1/<name>)
  --page-path <path>        Chemin de la page (défaut: /<name>)
  --force                   Écrase les fichiers existants

Examples:
  node scripts/generate/cli.js model User --fields "name:string:true,email:string:true"
  node scripts/generate/cli.js all Product --fields "name:string:true,price:float:true"
  node scripts/generate/cli.js types
`);
}

function parseFields(fieldsStr) {
  if (!fieldsStr) return [];
  return fieldsStr.split(",").map((field) => {
    const [name, type, required] = field.trim().split(":");
    return {
      name: name.trim(),
      type: type?.trim() || "string",
      required: required === "true",
    };
  });
}

function parseRelations(relationsStr) {
  if (!relationsStr) return [];
  return relationsStr.split(",").map((rel) => {
    const [name, type, model] = rel.trim().split(":");
    return {
      name: name.trim(),
      type: type?.trim() || "many-to-one",
      model: model?.trim(),
    };
  });
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  const name = args[1];
  const options = {};

  // Parse options
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--fields") {
      options.fields = parseFields(args[++i]);
    } else if (arg === "--relations") {
      options.relations = parseRelations(args[++i]);
    } else if (arg === "--api-path") {
      options.apiPath = args[++i];
    } else if (arg === "--page-path") {
      options.pagePath = args[++i];
    } else if (arg === "--force") {
      options.force = true;
    }
  }

  if (!commands[command]) {
    console.error(`❌ Commande inconnue: ${command}`);
    showHelp();
    process.exit(1);
  }

  if (command !== "types" && !name) {
    console.error(`❌ Nom requis pour la commande: ${command}`);
    showHelp();
    process.exit(1);
  }

  try {
    console.log(`🚀 Génération ${command}${name ? `: ${name}` : ""}...`);
    await commands[command](name, options);
    console.log(`✅ Génération terminée avec succès!`);
  } catch (error) {
    console.error(`❌ Erreur: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
