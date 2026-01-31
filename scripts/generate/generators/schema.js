/**
 * Générateur de Schemas Pydantic
 */

const fs = require("fs");
const path = require("path");

const TYPE_MAPPING = {
  string: "str",
  integer: "int",
  float: "float",
  boolean: "bool",
  date: "date",
  datetime: "datetime",
  text: "str",
  uuid: "UUID",
  json: "dict",
};

function generateSchema(name, options = {}) {
  const fields = options.fields || [];
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);

  // Generate Create schema
  let createCode = `"""
${modelName} Schemas
Auto-generated Pydantic schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, EmailStr


class ${modelName}Create(BaseModel):
`;

  fields.forEach((field) => {
    const pyType = TYPE_MAPPING[field.type] || "str";
    const optional = field.required ? "" : "Optional[";
    const optionalClose = field.required ? "" : "] = None";
    const fieldDef = field.required
      ? `    ${field.name}: ${pyType}`
      : `    ${field.name}: ${optional}${pyType}${optionalClose}`;

    if (field.type === "email") {
      createCode += `    ${field.name}: EmailStr${field.required ? "" : " | None"} = None\n`;
    } else {
      createCode += `${fieldDef}\n`;
    }
  });

  // Generate Update schema
  let updateCode = `class ${modelName}Update(BaseModel):
`;

  fields.forEach((field) => {
    const pyType = TYPE_MAPPING[field.type] || "str";
    updateCode += `    ${field.name}: Optional[${pyType}] = None\n`;
  });

  // Generate Response schema
  let responseCode = `class ${modelName}Response(BaseModel):
    id: UUID
`;

  fields.forEach((field) => {
    const pyType = TYPE_MAPPING[field.type] || "str";
    const optional = field.required ? "" : "Optional[";
    const optionalClose = field.required ? "" : "] = None";
    responseCode += `    ${field.name}: ${optional}${pyType}${optionalClose}\n`;
  });

  responseCode += `    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
`;

  const fullCode = createCode + "\n" + updateCode + "\n" + responseCode;

  // Write file
  const schemaDir = path.join(__dirname, "../../backend/app/schemas");
  const schemaFile = path.join(schemaDir, `${name.toLowerCase()}.py`);

  if (!fs.existsSync(schemaDir)) {
    fs.mkdirSync(schemaDir, { recursive: true });
  }

  if (fs.existsSync(schemaFile) && !options.force) {
    throw new Error(
      `Le fichier ${schemaFile} existe déjà. Utilisez --force pour l'écraser.`,
    );
  }

  fs.writeFileSync(schemaFile, fullCode);
  console.log(`✅ Schemas générés: ${schemaFile}`);

  // Update __init__.py
  const initFile = path.join(schemaDir, "__init__.py");
  let initContent = fs.existsSync(initFile)
    ? fs.readFileSync(initFile, "utf8")
    : "";

  const imports = [
    `from app.schemas.${name.toLowerCase()} import ${modelName}Create, ${modelName}Update, ${modelName}Response`,
  ];

  imports.forEach((imp) => {
    if (!initContent.includes(imp)) {
      initContent += `${imp}\n`;
    }
  });

  fs.writeFileSync(initFile, initContent);
  console.log(`✅ __init__.py mis à jour`);
}

module.exports = generateSchema;
