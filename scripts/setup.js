#!/usr/bin/env node

/**
 * Setup script for MODELE-NEXTJS-FULLSTACK template
 * Automates initial project configuration
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function generateSecretKey(length = 32) {
  return crypto.randomBytes(length).toString("base64url");
}

function generateJWTSecret() {
  return crypto.randomBytes(64).toString("base64url");
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    log(`⚠️  Source file not found: ${src}`, "yellow");
    return false;
  }
  fs.copyFileSync(src, dest);
  return true;
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    log(`⚠️  File not found: ${filePath}`, "yellow");
    return false;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  for (const [search, replace] of Object.entries(replacements)) {
    if (content.includes(search)) {
      content = content.replace(new RegExp(search, "g"), replace);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    return true;
  }
  return false;
}

async function setupProject() {
  log("\n🚀 MODELE-NEXTJS-FULLSTACK Template Setup\n", "bright");

  // Step 1: Get project information
  log("📋 Project Configuration", "blue");
  const projectName =
    (await question("Project name (default: my-app): ")) || "my-app";
  const projectDescription =
    (await question("Project description: ")) ||
    "Full-stack application built with Next.js and FastAPI";
  const authorName = (await question("Author name: ")) || "Developer";
  const authorEmail =
    (await question("Author email: ")) || "developer@example.com";

  // Step 2: Generate secrets
  log("\n🔐 Generating secure secrets...", "blue");
  const secretKey = generateSecretKey(32);
  const jwtSecret = generateJWTSecret();
  const nextAuthSecret = generateJWTSecret();

  log("✅ Secrets generated", "green");

  // Step 3: Database configuration
  log("\n🗄️  Database Configuration", "blue");
  const dbName =
    (await question(
      "Database name (default: " +
        projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase() +
        "_db): ",
    )) || projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase() + "_db";
  const dbUser =
    (await question("Database user (default: postgres): ")) || "postgres";
  const dbPassword =
    (await question("Database password (default: postgres): ")) || "postgres";
  const dbHost =
    (await question("Database host (default: localhost): ")) || "localhost";
  const dbPort = (await question("Database port (default: 5432): ")) || "5432";

  const databaseUrl = `postgresql+asyncpg://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;

  // Step 4: Frontend configuration
  log("\n⚛️  Frontend Configuration", "blue");
  const frontendPort =
    (await question("Frontend port (default: 3000): ")) || "3000";
  const frontendUrl = `http://localhost:${frontendPort}`;

  // Step 5: Backend configuration
  log("\n🐍 Backend Configuration", "blue");
  const backendPort =
    (await question("Backend port (default: 8000): ")) || "8000";
  const backendUrl = `http://localhost:${backendPort}`;

  // Step 6: Create .env files
  log("\n📝 Creating environment files...", "blue");

  // Backend .env
  const backendEnvPath = path.join(__dirname, "..", "backend", ".env");
  const backendEnvExamplePath = path.join(
    __dirname,
    "..",
    "backend",
    ".env.example",
  );

  if (copyFile(backendEnvExamplePath, backendEnvPath)) {
    replaceInFile(backendEnvPath, {
      "change-this-secret-key-in-production-min-32-chars": secretKey,
      "postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db":
        databaseUrl,
      "http://localhost:3000": frontendUrl,
      MODELE: projectName.toUpperCase(),
      "Your App Name": projectName,
    });
    log("✅ Backend .env created", "green");
  }

  // Frontend .env.local
  const frontendEnvPath = path.join(
    __dirname,
    "..",
    "apps",
    "web",
    ".env.local",
  );
  const frontendEnvExamplePath = path.join(
    __dirname,
    "..",
    "apps",
    "web",
    ".env.example",
  );

  if (copyFile(frontendEnvExamplePath, frontendEnvPath)) {
    replaceInFile(frontendEnvPath, {
      "change-this-secret-key-in-production": nextAuthSecret,
      "http://localhost:8000": backendUrl,
      "http://localhost:3000": frontendUrl,
    });
    log("✅ Frontend .env.local created", "green");
  }

  // Step 7: Update package.json
  log("\n📦 Updating package.json...", "blue");
  const rootPackageJsonPath = path.join(__dirname, "..", "package.json");
  if (fs.existsSync(rootPackageJsonPath)) {
    const packageJson = JSON.parse(
      fs.readFileSync(rootPackageJsonPath, "utf8"),
    );
    packageJson.name = projectName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    packageJson.description = projectDescription;
    packageJson.author = `${authorName} <${authorEmail}>`;
    fs.writeFileSync(
      rootPackageJsonPath,
      JSON.stringify(packageJson, null, 2) + "\n",
    );
    log("✅ package.json updated", "green");
  }

  // Step 8: Update backend config
  log("\n⚙️  Updating backend configuration...", "blue");
  const backendConfigPath = path.join(
    __dirname,
    "..",
    "backend",
    "app",
    "core",
    "config.py",
  );
  if (fs.existsSync(backendConfigPath)) {
    replaceInFile(backendConfigPath, {
      'PROJECT_NAME: str = "MODELE API"': `PROJECT_NAME: str = "${projectName} API"`,
      'default="MODELE"': `default="${projectName.toUpperCase()}"`,
    });
    log("✅ Backend config updated", "green");
  }

  // Step 9: Update frontend config
  log("\n⚛️  Updating frontend configuration...", "blue");
  const sitemapConfigPath = path.join(
    __dirname,
    "..",
    "apps",
    "web",
    "src",
    "config",
    "sitemap.ts",
  );
  if (fs.existsSync(sitemapConfigPath)) {
    // This will be handled by environment variable, but we can add a comment
    log("✅ Frontend config ready (uses NEXT_PUBLIC_APP_URL)", "green");
  }

  // Step 10: Create .env.local.example with NEXT_PUBLIC_APP_URL
  const frontendEnvLocalPath = path.join(
    __dirname,
    "..",
    "apps",
    "web",
    ".env.local",
  );
  if (fs.existsSync(frontendEnvLocalPath)) {
    const envContent = fs.readFileSync(frontendEnvLocalPath, "utf8");
    if (!envContent.includes("NEXT_PUBLIC_APP_URL")) {
      fs.appendFileSync(
        frontendEnvLocalPath,
        `\n# App URL\nNEXT_PUBLIC_APP_URL=${frontendUrl}\n`,
      );
    }
  }

  // Summary
  log("\n" + "=".repeat(60), "bright");
  log("✅ Setup Complete!", "green");
  log("=".repeat(60), "bright");
  log("\n📋 Configuration Summary:", "blue");
  log(`   Project Name: ${projectName}`);
  log(`   Database: ${dbName}`);
  log(`   Frontend: ${frontendUrl}`);
  log(`   Backend: ${backendUrl}`);
  log("\n🔐 Security:", "blue");
  log("   ✅ SECRET_KEY generated");
  log("   ✅ JWT secrets generated");
  log("   ✅ NextAuth secret generated");
  log("\n📝 Next Steps:", "yellow");
  log("   1. Review the generated .env files");
  log("   2. Install dependencies: pnpm install");
  log("   3. Create database: createdb " + dbName);
  log("   4. Run migrations: cd backend && alembic upgrade head");
  log("   5. Start development: pnpm dev:full");
  log("\n📚 Documentation:", "blue");
  log("   - See GETTING_STARTED.md for detailed instructions");
  log("   - See docs/TEMPLATE_USAGE.md for template-specific guide");
  log("\n");

  rl.close();
}

// Run setup
setupProject().catch((error) => {
  log(`\n❌ Error during setup: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
