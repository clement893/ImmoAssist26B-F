#!/usr/bin/env node

/**
 * Version fallback du générateur de types
 * Utilise une approche regex basique si Python n'est pas disponible
 */

const fs = require("fs");
const path = require("path");

const TYPE_MAPPING = {
  str: "string",
  int: "number",
  float: "number",
  bool: "boolean",
  datetime: "string",
  date: "string",
  UUID: "string",
  EmailStr: "string",
  "Optional[str]": "string | null",
  "Optional[int]": "number | null",
  "Optional[bool]": "boolean | null",
};

function parsePythonType(typeStr) {
  typeStr = typeStr.trim();

  // Optional[Type] -> Type | null
  if (typeStr.startsWith("Optional[")) {
    const inner = typeStr.slice(9, -1);
    const innerType = parsePythonType(inner);
    return `${innerType} | null`;
  }

  // List[Type] -> Type[]
  if (typeStr.startsWith("List[") || typeStr.startsWith("list[")) {
    const inner = typeStr.slice(5, -1);
    const innerType = parsePythonType(inner);
    return `${innerType}[]`;
  }

  return TYPE_MAPPING[typeStr] || typeStr;
}

function extractSchemas(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const schemas = {};

  // Trouver toutes les classes BaseModel
  const classRegex = /class\s+(\w+)(?:\([^)]*BaseModel[^)]*\))?:/g;
  let match;

  while ((match = classRegex.exec(content)) !== null) {
    const className = match[1];
    const classStart = match.index;

    // Trouver la fin de la classe
    let braceCount = 0;
    let classEnd = classStart;
    let inString = false;
    let stringChar = null;

    for (let i = classStart; i < content.length; i++) {
      const char = content[i];
      const prevChar = i > 0 ? content[i - 1] : "";

      if (!inString && (char === '"' || char === "'")) {
        inString = true;
        stringChar = char;
      } else if (inString && char === stringChar && prevChar !== "\\") {
        inString = false;
        stringChar = null;
      }

      if (!inString) {
        if (char === "\n" && braceCount === 0 && i > classStart + 50) {
          // Vérifier si c'est le début d'une nouvelle classe
          const nextLines = content.slice(i, i + 100);
          if (nextLines.match(/^\s*class\s+\w+/m)) {
            classEnd = i;
            break;
          }
        }
      }
    }

    if (classEnd === classStart) {
      classEnd = content.length;
    }

    const classContent = content.slice(classStart, classEnd);

    // Extraire les champs
    const fields = {};
    const fieldRegex = /^\s+(\w+):\s*([^\n=]+)/gm;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(classContent)) !== null) {
      const fieldName = fieldMatch[1];
      let fieldType = fieldMatch[2].trim();

      // Nettoyer le type
      fieldType = fieldType.replace(/\s*=\s*Field\([^)]*\)/, "");
      fieldType = fieldType.replace(/\s*=\s*None/, "");
      fieldType = fieldType.trim();

      // Vérifier si optionnel
      const isOptional =
        classContent.includes(`${fieldName}: Optional[`) ||
        classContent.includes(`${fieldName}: ${fieldType} | None`);

      const tsType = parsePythonType(fieldType);
      fields[fieldName] =
        isOptional && !tsType.includes("null") ? `${tsType} | null` : tsType;
    }

    if (Object.keys(fields).length > 0) {
      schemas[className] = fields;
    }
  }

  return schemas;
}

function generateTypeScript(schemasDir, outputFile) {
  const allSchemas = {};

  // Lire tous les fichiers Python
  const files = fs
    .readdirSync(schemasDir)
    .filter((file) => file.endsWith(".py") && file !== "__init__.py");

  for (const file of files) {
    const filePath = path.join(schemasDir, file);
    console.log(`📄 Parsing ${file}...`);
    const fileSchemas = extractSchemas(filePath);
    Object.assign(allSchemas, fileSchemas);
  }

  if (Object.keys(allSchemas).length === 0) {
    console.log("⚠️  Aucun schema trouvé");
    return;
  }

  // Grouper par base name
  const grouped = {};

  for (const [schemaName, fields] of Object.entries(allSchemas)) {
    let baseName = schemaName;
    for (const suffix of ["Create", "Update", "Response", "Base"]) {
      if (schemaName.endsWith(suffix)) {
        baseName = schemaName.slice(0, -suffix.length);
        break;
      }
    }

    if (!grouped[baseName]) {
      grouped[baseName] = {};
    }
    grouped[baseName][schemaName] = fields;
  }

  // Générer le contenu TypeScript
  const content = [
    "/**",
    " * Auto-generated TypeScript types from Pydantic schemas",
    " * DO NOT EDIT MANUALLY - This file is auto-generated",
    " * Run: npm run generate:types",
    " */",
    "",
  ];

  for (const [baseName, schemas] of Object.entries(grouped).sort()) {
    // Interface principale
    const mainSchema =
      schemas[`${baseName}Response`] ||
      schemas[baseName] ||
      schemas[`${baseName}Base`] ||
      Object.values(schemas)[0];

    if (mainSchema) {
      content.push(`export interface ${baseName} {`);
      for (const [fieldName, fieldType] of Object.entries(mainSchema)) {
        content.push(`  ${fieldName}: ${fieldType};`);
      }
      content.push("}");
      content.push("");
    }

    // Create
    if (schemas[`${baseName}Create`]) {
      content.push(`export interface ${baseName}Create {`);
      for (const [fieldName, fieldType] of Object.entries(
        schemas[`${baseName}Create`],
      )) {
        if (
          fieldName !== "id" &&
          !fieldName.includes("created_at") &&
          !fieldName.includes("updated_at")
        ) {
          content.push(`  ${fieldName}: ${fieldType};`);
        }
      }
      content.push("}");
      content.push("");
    }

    // Update
    if (schemas[`${baseName}Update`]) {
      content.push(`export interface ${baseName}Update {`);
      for (const [fieldName, fieldType] of Object.entries(
        schemas[`${baseName}Update`],
      )) {
        const optionalType = fieldType.includes("null")
          ? fieldType
          : `${fieldType} | null`;
        content.push(`  ${fieldName}?: ${optionalType};`);
      }
      content.push("}");
      content.push("");
    }
  }

  // Écrire le fichier
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, content.join("\n"), "utf8");

  console.log(`✅ Types générés: ${outputFile}`);
  console.log(`   ${Object.keys(grouped).length} modèle(s) trouvé(s)`);
}

function main() {
  const scriptDir = __dirname;
  const rootDir = path.resolve(scriptDir, "../../..");
  const schemasDir = path.join(rootDir, "backend/app/schemas");
  const outputDir = path.join(rootDir, "packages/types/src");
  const outputFile = path.join(outputDir, "generated.ts");

  if (!fs.existsSync(schemasDir)) {
    console.error(`❌ Répertoire schemas introuvable: ${schemasDir}`);
    process.exit(1);
  }

  console.log("🔄 Génération des types TypeScript (mode fallback)...");
  console.log(`   Source: ${schemasDir}`);
  console.log(`   Destination: ${outputFile}`);
  console.log();

  generateTypeScript(schemasDir, outputFile);

  // Mettre à jour index.ts
  const indexFile = path.join(outputDir, "index.ts");
  let indexContent = "";
  if (fs.existsSync(indexFile)) {
    indexContent = fs.readFileSync(indexFile, "utf8");
  }

  if (!indexContent.includes("export * from './generated'")) {
    fs.appendFileSync(indexFile, "\nexport * from './generated';\n");
    console.log("✅ index.ts mis à jour");
  }

  console.log("\n✅ Génération terminée!");
}

main();
