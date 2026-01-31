#!/usr/bin/env node

/**
 * Backend API Endpoint Checker
 *
 * Scans backend Python files to extract all API endpoints and verify they're registered.
 *
 * Usage:
 *   node scripts/check-api-connections-backend.js
 */

const fs = require("fs");
const path = require("path");

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Adjust paths based on whether we're in Docker container or local development
const isDocker =
  process.env.DOCKER === "true" ||
  fs.existsSync("/.dockerenv") ||
  __dirname.startsWith("/app");
const backendPath = isDocker
  ? "/app/app/api/v1/endpoints" // In Docker: backend is at /app
  : path.join(__dirname, "../app/api/v1/endpoints"); // Local: scripts are in backend/scripts, backend is at backend/
const routerPath = isDocker
  ? "/app/app/api/v1/router.py" // In Docker: backend is at /app
  : path.join(__dirname, "../app/api/v1/router.py"); // Local: scripts are in backend/scripts, backend is at backend/

/**
 * Extract endpoints from a Python file
 */
function extractEndpoints(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const endpoints = [];

  // Pattern: @router.get("/path", ...)
  const pattern = /@router\.(get|post|put|patch|delete)\(["']([^"']+)["']/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2],
      file: path.basename(filePath),
      line: content.substring(0, match.index).split("\n").length,
    });
  }

  return endpoints;
}

/**
 * Check if endpoint is registered in router
 */
function checkRouterRegistration(endpoint) {
  if (!fs.existsSync(routerPath)) {
    return false;
  }

  const routerContent = fs.readFileSync(routerPath, "utf8");
  const moduleName = endpoint.file.replace(".py", "");

  // Check if module is imported
  const importPattern = new RegExp(
    `from.*import.*${moduleName}|import.*${moduleName}`,
  );
  if (!importPattern.test(routerContent)) {
    return false;
  }

  // Check if router is included
  const includePattern = new RegExp(
    `api_router\\.include_router\\(\\s*${moduleName}\\.router`,
    "s",
  );
  return includePattern.test(routerContent);
}

/**
 * Main function
 */
function main() {
  log("🔍 Scanning backend endpoints...\n", "blue");

  const endpointFiles = fs
    .readdirSync(backendPath)
    .filter((file) => file.endsWith(".py") && file !== "__init__.py")
    .map((file) => path.join(backendPath, file));

  const allEndpoints = [];
  const endpointsByModule = {};

  endpointFiles.forEach((filePath) => {
    const endpoints = extractEndpoints(filePath);
    const moduleName = path.basename(filePath, ".py");

    endpointsByModule[moduleName] = endpoints;
    allEndpoints.push(...endpoints.map((e) => ({ ...e, module: moduleName })));
  });

  log(
    `📊 Found ${allEndpoints.length} endpoints in ${endpointFiles.length} modules\n`,
    "green",
  );

  // Check registration
  log("🔍 Checking router registration...\n", "blue");

  const unregistered = [];
  const registered = [];

  Object.entries(endpointsByModule).forEach(([module, endpoints]) => {
    if (endpoints.length > 0) {
      const isRegistered = checkRouterRegistration({ file: `${module}.py` });

      if (isRegistered) {
        registered.push(module);
      } else {
        unregistered.push(module);
      }
    }
  });

  // Report
  log("📈 Summary:", "blue");
  log(`  ✅ Registered modules: ${registered.length}`, "green");
  log(
    `  ❌ Unregistered modules: ${unregistered.length}`,
    unregistered.length > 0 ? "red" : "green",
  );

  if (unregistered.length > 0) {
    log("\n❌ Unregistered Modules:", "red");
    unregistered.forEach((module) => {
      log(`  - ${module}`, "red");
    });
  }

  // List all endpoints by module
  log("\n📋 Endpoints by Module:", "cyan");
  Object.entries(endpointsByModule).forEach(([module, endpoints]) => {
    if (endpoints.length > 0) {
      const status = registered.includes(module) ? "✅" : "❌";
      log(
        `\n${status} ${module} (${endpoints.length} endpoints)`,
        registered.includes(module) ? "green" : "red",
      );
      endpoints.forEach((endpoint) => {
        log(`    ${endpoint.method} /api/v1${endpoint.path}`, "reset");
      });
    }
  });

  log("\n");

  // Exit with error if unregistered modules found
  process.exit(unregistered.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { extractEndpoints, checkRouterRegistration };
