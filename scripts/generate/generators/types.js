/**
 * Générateur de Types TypeScript depuis Backend
 * Synchronise les types depuis les schemas Pydantic
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function generateTypes() {
  console.log("🔄 Synchronisation des types TypeScript depuis le backend...");

  const backendDir = path.join(__dirname, "../../backend");
  const schemasDir = path.join(backendDir, "app/schemas");
  const outputDir = path.join(__dirname, "../../packages/types/src");

  if (!fs.existsSync(schemasDir)) {
    throw new Error(`Le répertoire ${schemasDir} n'existe pas`);
  }

  // Read all schema files
  const schemaFiles = fs
    .readdirSync(schemasDir)
    .filter((file) => file.endsWith(".py") && file !== "__init__.py");

  let typesContent = `/**
 * Auto-generated TypeScript types from Pydantic schemas
 * DO NOT EDIT MANUALLY - This file is auto-generated
 */

`;

  schemaFiles.forEach((file) => {
    const schemaPath = path.join(schemasDir, file);
    const content = fs.readFileSync(schemaPath, "utf8");

    // Extract model name
    const modelMatch = content.match(/class (\w+)(Create|Update|Response)/);
    if (modelMatch) {
      const baseName = modelMatch[1].replace(/Create|Update|Response$/, "");

      // Extract fields from Create schema
      const createMatch = content.match(
        /class \w+Create\(BaseModel\):([\s\S]*?)(?=class|\nclass|$)/,
      );
      if (createMatch) {
        const fields = createMatch[1]
          .split("\n")
          .filter((line) => line.trim() && !line.trim().startsWith('"""'))
          .map((line) => {
            const match = line.match(/\s+(\w+):\s*(.+)/);
            if (match) {
              const [, name, type] = match;
              const tsType = mapPythonToTypeScript(type);
              return `  ${name}: ${tsType};`;
            }
            return null;
          })
          .filter(Boolean);

        if (fields.length > 0) {
          typesContent += `export interface ${baseName} {\n`;
          typesContent += `  id: string;\n`;
          fields.forEach((field) => {
            typesContent += `${field}\n`;
          });
          typesContent += `  created_at: string;\n`;
          typesContent += `  updated_at: string;\n`;
          typesContent += `}\n\n`;

          typesContent += `export interface ${baseName}Create {\n`;
          fields.forEach((field) => {
            typesContent += `${field}\n`;
          });
          typesContent += `}\n\n`;

          typesContent += `export interface ${baseName}Update {\n`;
          fields.forEach((field) => {
            typesContent += `  ${field.replace(":", "?:")}\n`;
          });
          typesContent += `}\n\n`;
        }
      }
    }
  });

  // Write to types package
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const typesFile = path.join(outputDir, "generated.ts");
  fs.writeFileSync(typesFile, typesContent);
  console.log(`✅ Types générés: ${typesFile}`);

  // Update index.ts
  const indexFile = path.join(outputDir, "index.ts");
  let indexContent = fs.existsSync(indexFile)
    ? fs.readFileSync(indexFile, "utf8")
    : "";

  if (!indexContent.includes("export * from './generated'")) {
    indexContent += "\nexport * from './generated';\n";
    fs.writeFileSync(indexFile, indexContent);
  }

  console.log("✅ Synchronisation terminée!");
}

function mapPythonToTypeScript(pythonType) {
  const mapping = {
    str: "string",
    int: "number",
    float: "number",
    bool: "boolean",
    datetime: "string",
    date: "string",
    UUID: "string",
    dict: "Record<string, unknown>",
    "Optional[str]": "string | null",
    "Optional[int]": "number | null",
    "Optional[float]": "number | null",
    "Optional[bool]": "boolean | null",
    EmailStr: "string",
  };

  // Remove Optional wrapper
  let cleaned = pythonType.trim();
  if (cleaned.startsWith("Optional[")) {
    cleaned = cleaned.replace("Optional[", "").replace("]", "") + " | null";
  }

  return (
    mapping[cleaned] || mapping[cleaned.replace(" | null", "")] || "unknown"
  );
}

module.exports = generateTypes;
