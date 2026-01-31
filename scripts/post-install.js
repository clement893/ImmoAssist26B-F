#!/usr/bin/env node

/**
 * Post-installation verification script
 * Verifies that the template is properly set up and ready to use
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description}`, "green");
    return true;
  } else {
    log(`❌ ${description} - File not found: ${filePath}`, "red");
    return false;
  }
}

function checkEnvFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("change-this") || content.includes("your-")) {
      log(`⚠️  ${description} - Contains placeholder values`, "yellow");
      return false;
    }
    log(`✅ ${description}`, "green");
    return true;
  } else {
    log(`❌ ${description} - File not found`, "red");
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: "ignore" });
    log(`✅ ${description}`, "green");
    return true;
  } catch (error) {
    log(`❌ ${description}`, "red");
    return false;
  }
}

function main() {
  log("\n🔍 Post-Installation Verification\n", "bright");

  let allChecks = true;

  // Check essential files
  log("\n📁 Checking Essential Files:", "blue");
  allChecks &= checkFile("package.json", "package.json");
  allChecks &= checkFile("backend/.env.example", "Backend .env.example");
  allChecks &= checkFile("apps/web/.env.example", "Frontend .env.example");
  allChecks &= checkFile(
    "backend/requirements.txt",
    "Backend requirements.txt",
  );

  // Check environment files
  log("\n🔐 Checking Environment Configuration:", "blue");
  const backendEnvExists = checkFile("backend/.env", "Backend .env");
  const frontendEnvExists = checkFile(
    "apps/web/.env.local",
    "Frontend .env.local",
  );

  if (backendEnvExists) {
    checkEnvFile("backend/.env", "Backend .env configured");
  } else {
    log("   💡 Run: cp backend/.env.example backend/.env", "yellow");
    allChecks = false;
  }

  if (frontendEnvExists) {
    checkEnvFile("apps/web/.env.local", "Frontend .env.local configured");
  } else {
    log("   💡 Run: cp apps/web/.env.example apps/web/.env.local", "yellow");
    allChecks = false;
  }

  // Check dependencies
  log("\n📦 Checking Dependencies:", "blue");
  allChecks &= checkCommand("pnpm --version", "pnpm installed");
  allChecks &= checkCommand("node --version", "Node.js installed");
  allChecks &= checkCommand("python --version", "Python installed");

  // Check if node_modules exists
  if (fs.existsSync("node_modules")) {
    log("✅ Dependencies installed", "green");
  } else {
    log("⚠️  Dependencies not installed - Run: pnpm install", "yellow");
    allChecks = false;
  }

  // Check database
  log("\n🗄️  Checking Database:", "blue");
  try {
    const dbUrl =
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/test";
    execSync(`psql "${dbUrl}" -c "SELECT 1"`, { stdio: "ignore" });
    log("✅ Database connection works", "green");
  } catch (error) {
    log(
      "⚠️  Database connection failed - Make sure PostgreSQL is running",
      "yellow",
    );
    log("   💡 Run: createdb your_database_name", "yellow");
  }

  // Summary
  log("\n" + "=".repeat(60), "bright");
  if (allChecks) {
    log("✅ All checks passed! Your template is ready to use.", "green");
    log("\n📋 Next Steps:", "blue");
    log("   1. Review your .env files");
    log("   2. Run: pnpm dev:full");
    log("   3. Visit: http://localhost:3000");
  } else {
    log("⚠️  Some checks failed. Please review the issues above.", "yellow");
    log("\n💡 Quick Setup:", "blue");
    log("   1. Run: pnpm setup");
    log("   2. Run: pnpm install");
    log("   3. Configure your .env files");
    log("   4. Run: pnpm dev:full");
  }
  log("=".repeat(60) + "\n", "bright");
}

main();
