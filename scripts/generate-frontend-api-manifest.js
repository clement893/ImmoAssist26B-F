#!/usr/bin/env node

/**
 * Generate Frontend API Manifest
 *
 * This script analyzes frontend files and generates a manifest JSON file
 * that can be used in production to check API connections.
 *
 * Usage:
 *   node scripts/generate-frontend-api-manifest.js
 */

const fs = require("fs");
const path = require("path");

// Get root directory by finding pnpm-workspace.yaml (project root marker)
// This works regardless of where the script is located
function findProjectRoot(startDir) {
  let currentDir = startDir;
  while (currentDir !== path.dirname(currentDir)) {
    const workspaceFile = path.join(currentDir, "pnpm-workspace.yaml");
    if (fs.existsSync(workspaceFile)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  // Fallback: if not found, assume we're in scripts/ directory
  return path.join(__dirname, "..");
}

const rootDir = findProjectRoot(__dirname);
const config = {
  frontendPath: path.join(rootDir, "apps/web/src"),
  pagesPath: path.join(rootDir, "apps/web/src/app/[locale]"),
  apiLibPath: path.join(rootDir, "apps/web/src/lib/api"),
  outputPath: path.join(rootDir, "apps/web/public/api-manifest.json"),
};

const apiPatterns = {
  apiClient: {
    get: /apiClient\.get\(['"`]([^'"`]+)['"`]/g,
    post: /apiClient\.post\(['"`]([^'"`]+)['"`]/g,
    put: /apiClient\.put\(['"`]([^'"`]+)['"`]/g,
    patch: /apiClient\.patch\(['"`]([^'"`]+)['"`]/g,
    delete: /apiClient\.delete\(['"`]([^'"`]+)['"`]/g,
  },
  apiModule: {
    call: /(\w+API)\.(\w+)\(/g,
    import: /import\s+.*from\s+['"`]@\/lib\/api\/(\w+)['"`]/g,
  },
};

function findPageFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!["node_modules", ".next", ".git", "dist", "build"].includes(file)) {
        findPageFiles(filePath, fileList);
      }
    } else if (file === "page.tsx" || file === "page.ts") {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function extractApiCalls(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const apiCalls = {
    direct: [],
    module: [],
    imports: [],
  };

  Object.entries(apiPatterns.apiClient).forEach(([method, pattern]) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      apiCalls.direct.push({
        method: method.toUpperCase(),
        endpoint: match[1],
      });
    }
  });

  let match;
  const modulePattern = apiPatterns.apiModule.call;
  while ((match = modulePattern.exec(content)) !== null) {
    apiCalls.module.push({
      module: match[1],
      method: match[2],
    });
  }

  const importPattern = apiPatterns.apiModule.import;
  while ((match = importPattern.exec(content)) !== null) {
    apiCalls.imports.push(match[1]);
  }

  return apiCalls;
}

function analyzePage(pagePath) {
  const relativePath = path.relative(config.frontendPath, pagePath);
  const apiCalls = extractApiCalls(pagePath);

  const url = relativePath
    .replace(/\\/g, "/")
    .replace(/\[locale\]\//, "")
    .replace(/\/page\.(tsx|ts)$/, "")
    .replace(/^app\//, "/");

  return {
    path: relativePath,
    url: url || "/",
    apiCalls: [
      ...apiCalls.direct.map((call) => ({
        method: call.method,
        endpoint: call.endpoint,
      })),
      ...apiCalls.module.map((call) => ({
        method: "MODULE",
        endpoint: `${call.module}.${call.method}`,
      })),
    ],
    hasApiCalls: apiCalls.direct.length > 0 || apiCalls.module.length > 0,
    imports: apiCalls.imports,
  };
}

function generateManifest() {
  console.log("Generating frontend API manifest...");

  const pageFiles = findPageFiles(config.pagesPath);
  console.log(`Found ${pageFiles.length} page files`);

  const pages = pageFiles.map(analyzePage);

  const summary = {
    total: pages.length,
    connected: pages.filter((p) => p.hasApiCalls && p.apiCalls.length > 0)
      .length,
    partial: pages.filter(
      (p) => p.hasApiCalls && p.apiCalls.length > 0 && p.imports.length > 0,
    ).length,
    needsIntegration: pages.filter((p) => !p.hasApiCalls).length,
    static: pages.filter((p) => !p.hasApiCalls).length,
  };

  const manifest = {
    version: "1.0.0",
    generated: new Date().toISOString(),
    summary,
    pages,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(config.outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(config.outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Manifest generated: ${config.outputPath}`);
  console.log(
    `Summary: ${summary.total} pages, ${summary.connected} connected, ${summary.needsIntegration} need integration`,
  );
}

generateManifest();
