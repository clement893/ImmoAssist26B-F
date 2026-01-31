/**
 * Générateur de Modèle SQLAlchemy
 */

const fs = require("fs");
const path = require("path");

const TYPE_MAPPING = {
  string: "String",
  integer: "Integer",
  float: "Float",
  boolean: "Boolean",
  date: "DateTime",
  datetime: "DateTime",
  text: "Text",
  uuid: "UUID",
  json: "JSON",
};

const RELATION_MAPPING = {
  "many-to-one": {
    import: "ForeignKey, relationship",
    column: (rel) =>
      `Column(UUID(as_uuid=True), ForeignKey('${rel.model.toLowerCase()}s.id'), nullable=False)`,
    relationship: (rel) =>
      `relationship('${rel.model}', back_populates='${rel.backRef || rel.name}')`,
  },
  "one-to-many": {
    import: "relationship",
    column: null,
    relationship: (rel) =>
      `relationship('${rel.model}', back_populates='${rel.backRef || rel.name}')`,
  },
  "many-to-many": {
    import: "Table, Column, ForeignKey",
    column: null,
    relationship: (rel) => {
      const tableName = `${rel.name}_${rel.model}`.toLowerCase();
      return `relationship('${rel.model}', secondary=${tableName}_table, back_populates='${rel.backRef || rel.name}')`;
    },
  },
};

function generateModel(name, options = {}) {
  const fields = options.fields || [];
  const relations = options.relations || [];
  const modelName = name.charAt(0).toUpperCase() + name.slice(1);
  const tableName = `${name.toLowerCase()}s`;

  // Collect imports
  const imports = new Set(["Column", "DateTime"]);
  const uuidImports = new Set();
  const relationImports = new Set();

  fields.forEach((field) => {
    if (field.type === "uuid") {
      uuidImports.add("UUID");
    }
    if (field.type === "date" || field.type === "datetime") {
      imports.add("DateTime");
    }
    if (field.type === "json") {
      imports.add("JSON");
    }
    if (field.type === "text") {
      imports.add("Text");
    }
  });

  relations.forEach((rel) => {
    const mapping = RELATION_MAPPING[rel.type];
    if (mapping) {
      mapping.import
        .split(", ")
        .forEach((imp) => relationImports.add(imp.trim()));
    }
  });

  // Generate model code
  const uuidImport = uuidImports.size > 0 ? ", UUID" : "";
  const relationImportList = Array.from(relationImports);
  const relationImportsStr =
    relationImportList.length > 0 ? ", " + relationImportList.join(", ") : "";
  const relationshipImport =
    relationImports.has("ForeignKey") || relationImports.has("relationship")
      ? "\nfrom sqlalchemy.orm import relationship"
      : "";
  const tableImport = relationImports.has("Table")
    ? "\nfrom sqlalchemy import Table"
    : "";

  let code = `"""
${modelName} Model
Auto-generated model with SQLAlchemy
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime${uuidImport}${relationImportsStr}${relationshipImport}${tableImport}

from app.core.database import Base


class ${modelName}(Base):
    __tablename__ = "${tableName}"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
`;

  // Add fields
  fields.forEach((field) => {
    const sqlType = TYPE_MAPPING[field.type] || "String";
    const nullable = field.required ? "nullable=False" : "nullable=True";
    const defaultVal =
      field.type === "datetime" || field.type === "date"
        ? ", default=datetime.utcnow"
        : "";

    code += `    ${field.name} = Column(${sqlType}, ${nullable}${defaultVal})\n`;
  });

  // Add relations
  relations.forEach((rel) => {
    const mapping = RELATION_MAPPING[rel.type];
    if (mapping && mapping.column) {
      code += `    ${rel.name}_id = ${mapping.column(rel)}\n`;
    }
    if (mapping && mapping.relationship) {
      code += `    ${rel.name} = ${mapping.relationship(rel)}\n`;
    }
  });

  // Add timestamps
  code += `    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
`;

  // Write file
  const modelDir = path.join(__dirname, "../../backend/app/models");
  const modelFile = path.join(modelDir, `${name.toLowerCase()}.py`);

  if (!fs.existsSync(modelDir)) {
    fs.mkdirSync(modelDir, { recursive: true });
  }

  if (fs.existsSync(modelFile) && !options.force) {
    throw new Error(
      `Le fichier ${modelFile} existe déjà. Utilisez --force pour l'écraser.`,
    );
  }

  fs.writeFileSync(modelFile, code);
  console.log(`✅ Modèle généré: ${modelFile}`);

  // Update __init__.py
  const initFile = path.join(modelDir, "__init__.py");
  let initContent = fs.existsSync(initFile)
    ? fs.readFileSync(initFile, "utf8")
    : "";

  if (
    !initContent.includes(
      `from app.models.${name.toLowerCase()} import ${modelName}`,
    )
  ) {
    initContent += `from app.models.${name.toLowerCase()} import ${modelName}\n`;
    fs.writeFileSync(initFile, initContent);
    console.log(`✅ __init__.py mis à jour`);
  }
}

module.exports = generateModel;
