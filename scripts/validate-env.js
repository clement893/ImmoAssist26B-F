#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates required environment variables before starting the application
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, "red");
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function warning(message) {
  log(`⚠️  ${message}`, "yellow");
}

function info(message) {
  log(`ℹ️  ${message}`, "blue");
}

// Required environment variables by environment
const requiredVars = {
  development: {
    backend: ["DATABASE_URL", "SECRET_KEY", "FRONTEND_URL"],
    frontend: [
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
  production: {
    backend: ["DATABASE_URL", "SECRET_KEY", "FRONTEND_URL", "PROJECT_NAME"],
    frontend: [
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "NEXT_PUBLIC_API_URL",
      "NEXT_PUBLIC_APP_URL",
    ],
  },
};

// Validation rules
const validations = {
  SECRET_KEY: (value) => {
    if (!value || value === "change-this-secret-key-in-production") {
      return "SECRET_KEY must be set to a secure value";
    }
    if (value.length < 32) {
      return "SECRET_KEY must be at least 32 characters long";
    }
    return null;
  },
  NEXTAUTH_SECRET: (value) => {
    if (!value || value === "your-secret-key-change-in-production") {
      return "NEXTAUTH_SECRET must be set to a secure value";
    }
    if (value.length < 32) {
      return "NEXTAUTH_SECRET must be at least 32 characters long";
    }
    return null;
  },
  DATABASE_URL: (value) => {
    if (!value) {
      return "DATABASE_URL is required";
    }
    if (!value.startsWith("postgresql")) {
      return "DATABASE_URL must be a PostgreSQL connection string";
    }
    return null;
  },
};

function validateEnv(envFile, type, environment) {
  const envPath = path.resolve(process.cwd(), envFile);

  if (!fs.existsSync(envPath)) {
    error(`${envFile} not found`);
    return false;
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const envVars = {};

  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts
          .join("=")
          .trim()
          .replace(/^["']|["']$/g, "");
      }
    }
  });

  const required = requiredVars[environment]?.[type] || [];
  let hasErrors = false;

  info(`\nValidating ${type} environment variables (${environment})...`);

  required.forEach((varName) => {
    const value = process.env[varName] || envVars[varName];

    if (!value) {
      error(`${varName} is missing`);
      hasErrors = true;
    } else {
      // Run custom validation if exists
      const validator = validations[varName];
      if (validator) {
        const validationError = validator(value);
        if (validationError) {
          error(`${varName}: ${validationError}`);
          hasErrors = true;
        } else {
          success(`${varName} is set`);
        }
      } else {
        success(`${varName} is set`);
      }
    }
  });

  return !hasErrors;
}

function main() {
  const args = process.argv.slice(2);
  const environment = process.env.NODE_ENV || "development";
  const type = args[0] || "all";

  log("\n🔍 Environment Variables Validation\n", "blue");

  let backendValid = true;
  let frontendValid = true;

  if (type === "backend" || type === "all") {
    backendValid = validateEnv("backend/.env", "backend", environment);
  }

  if (type === "frontend" || type === "all") {
    frontendValid = validateEnv("apps/web/.env.local", "frontend", environment);
  }

  if (backendValid && frontendValid) {
    success("\n✅ All environment variables are valid!");
    process.exit(0);
  } else {
    error("\n❌ Environment validation failed!");
    error("Please fix the errors above before starting the application.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnv };
