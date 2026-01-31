#!/usr/bin/env node

/**
 * Quick Start Script for MODELE-NEXTJS-FULLSTACK
 * One-command setup for the entire project
 */

const { execSync, spawn } = require("child_process");
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
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function checkCommand(command, name) {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch {
    try {
      execSync(`where ${command}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString("base64url");
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) {
    return false;
  }
  fs.copyFileSync(src, dest);
  return true;
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    return false;
  }
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  for (const [search, replace] of Object.entries(replacements)) {
    if (content.includes(search)) {
      content = content.replace(
        new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        replace,
      );
      modified = true;
    }
  }
  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
  }
  return modified;
}

async function checkPrerequisites() {
  log("\n🔍 Checking prerequisites...", "blue");

  const checks = [
    { name: "Node.js", command: "node", version: "20.x+" },
    { name: "pnpm", command: "pnpm", version: "9.x+" },
    { name: "Git", command: "git", version: "any" },
  ];

  const missing = [];
  for (const check of checks) {
    if (checkCommand(check.command, check.name)) {
      try {
        const version = execSync(`${check.command} --version`, {
          encoding: "utf8",
        }).trim();
        log(`  ✅ ${check.name}: ${version}`, "green");
      } catch {
        log(`  ✅ ${check.name}: installed`, "green");
      }
    } else {
      log(`  ❌ ${check.name} (${check.version})`, "red");
      missing.push(check.name);
    }
  }

  if (missing.length > 0) {
    log(`\n⚠️  Missing prerequisites: ${missing.join(", ")}`, "yellow");
    log("Please install them before continuing.\n", "yellow");
    return false;
  }

  log("✅ All prerequisites met!\n", "green");
  return true;
}

async function installDependencies() {
  log("📦 Installing dependencies...", "blue");
  try {
    execSync("pnpm install", {
      stdio: "inherit",
      cwd: path.join(__dirname, ".."),
    });
    log("✅ Dependencies installed!\n", "green");
    return true;
  } catch (error) {
    log("❌ Failed to install dependencies", "red");
    return false;
  }
}

async function setupEnvironmentFiles() {
  log("📝 Setting up environment files...", "blue");

  const secretKey = generateSecret(32);
  const jwtSecret = generateSecret(64);
  const nextAuthSecret = generateSecret(64);

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
      "SECRET_KEY=": `SECRET_KEY=${secretKey}`,
      "postgresql+asyncpg://postgres:postgres@localhost:5432/your_app_db":
        "postgresql+asyncpg://postgres:postgres@localhost:5432/modele_db",
    });
    log("  ✅ Backend .env created", "green");
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
      "NEXTAUTH_SECRET=change-this-secret-key-in-production": `NEXTAUTH_SECRET=${nextAuthSecret}`,
    });
    log("  ✅ Frontend .env.local created", "green");
  }

  log("✅ Environment files configured!\n", "green");
  return true;
}

async function setupDatabase() {
  log("🗄️  Database setup...", "blue");

  const useDocker =
    (await question("Use Docker for database? (y/n, default: n): ")) || "n";

  if (useDocker.toLowerCase() === "y") {
    log("  ℹ️  Using Docker Compose for database...", "cyan");
    log("  ℹ️  Run: docker-compose up -d postgres redis", "cyan");
    log("  ℹ️  Then run migrations: pnpm migrate\n", "cyan");
    return true;
  }

  // Check if PostgreSQL is available
  if (checkCommand("psql", "PostgreSQL")) {
    const createDb =
      (await question("Create database? (y/n, default: y): ")) || "y";
    if (createDb.toLowerCase() === "y") {
      try {
        execSync("createdb modele_db", { stdio: "ignore" });
        log("  ✅ Database created", "green");
      } catch (error) {
        log(
          "  ⚠️  Database might already exist or need manual creation",
          "yellow",
        );
      }
    }
  } else {
    log(
      "  ⚠️  PostgreSQL not found. Please install PostgreSQL or use Docker.",
      "yellow",
    );
  }

  log("✅ Database setup complete!\n", "green");
  return true;
}

async function runMigrations() {
  log("🔄 Running database migrations...", "blue");

  const runMigrations =
    (await question("Run migrations now? (y/n, default: y): ")) || "y";

  if (runMigrations.toLowerCase() === "y") {
    try {
      execSync("cd backend && alembic upgrade head", { stdio: "inherit" });
      log("✅ Migrations completed!\n", "green");
      return true;
    } catch (error) {
      log(
        "  ⚠️  Migrations failed. You can run them later with: pnpm migrate\n",
        "yellow",
      );
      return false;
    }
  }

  log("  ℹ️  Skipped. Run migrations later with: pnpm migrate\n", "cyan");
  return true;
}

async function quickStart() {
  log("\n" + "=".repeat(70), "bright");
  log("🚀 MODELE-NEXTJS-FULLSTACK - Quick Start", "bright");
  log("=".repeat(70) + "\n", "bright");

  // Step 1: Check prerequisites
  if (!(await checkPrerequisites())) {
    rl.close();
    process.exit(1);
  }

  // Step 2: Install dependencies
  const installDeps =
    (await question("Install dependencies? (y/n, default: y): ")) || "y";
  if (installDeps.toLowerCase() === "y") {
    if (!(await installDependencies())) {
      rl.close();
      process.exit(1);
    }
  } else {
    log("  ℹ️  Skipped. Run: pnpm install\n", "cyan");
  }

  // Step 3: Setup environment files
  const setupEnv =
    (await question("Setup environment files? (y/n, default: y): ")) || "y";
  if (setupEnv.toLowerCase() === "y") {
    await setupEnvironmentFiles();
  } else {
    log("  ℹ️  Skipped. Copy .env.example files manually.\n", "cyan");
  }

  // Step 4: Database setup
  await setupDatabase();

  // Step 5: Run migrations
  await runMigrations();

  // Summary
  log("\n" + "=".repeat(70), "bright");
  log("✅ Quick Start Complete!", "green");
  log("=".repeat(70) + "\n", "bright");

  log("📋 Next Steps:", "blue");
  log("  1. Review environment files (.env and .env.local)", "cyan");
  log("  2. Configure OAuth credentials (Google, Stripe, etc.)", "cyan");
  log("  3. Start development server:", "cyan");
  log("     pnpm dev:full", "bright");
  log("  4. Or start services separately:", "cyan");
  log("     pnpm dev:frontend  # Frontend only", "bright");
  log("     pnpm dev:backend   # Backend only", "bright");
  log("\n📚 Documentation:", "blue");
  log("  - README.md - Overview and features", "cyan");
  log("  - GETTING_STARTED.md - Detailed setup guide", "cyan");
  log("  - docs/ - Additional documentation", "cyan");
  log("\n🌐 URLs:", "blue");
  log("  - Frontend: http://localhost:3000", "cyan");
  log("  - Backend API: http://localhost:8000", "cyan");
  log("  - API Docs: http://localhost:8000/docs", "cyan");
  log("\n");

  rl.close();
}

// Run quick start
quickStart().catch((error) => {
  log(`\n❌ Error: ${error.message}`, "red");
  console.error(error);
  rl.close();
  process.exit(1);
});
