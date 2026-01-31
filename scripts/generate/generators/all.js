/**
 * Générateur Complet
 * Génère model, schema, endpoint et page en une commande
 */

const generateModel = require("./model");
const generateSchema = require("./schema");
const generateEndpoint = require("./endpoint");
const generatePage = require("./page");

async function generateAll(name, options = {}) {
  console.log(`🚀 Génération complète pour ${name}...\n`);

  // Generate in order
  console.log("1️⃣  Génération du modèle SQLAlchemy...");
  await generateModel(name, options);

  console.log("\n2️⃣  Génération des schemas Pydantic...");
  await generateSchema(name, options);

  console.log("\n3️⃣  Génération des endpoints FastAPI...");
  await generateEndpoint(name, options);

  console.log("\n4️⃣  Génération de la page Next.js...");
  await generatePage(name, options);

  console.log(`\n✅ Génération complète terminée pour ${name}!`);
  console.log("\n📝 Prochaines étapes:");
  console.log("   1. Vérifiez les fichiers générés");
  console.log(
    "   2. Créez une migration: pnpm migrate create add_" + name.toLowerCase(),
  );
  console.log("   3. Testez les endpoints dans /docs");
  console.log("   4. Visitez la page: /" + name.toLowerCase());
}

module.exports = generateAll;
