/**
 * Script to replace console statements with logger utility
 * This script scans TypeScript/JavaScript files and replaces console statements
 * with the secure logger utility that handles production/development automatically.
 */

const fs = require("fs");
const path = require("path");

const filesToProcess = [];
const filesToSkip = [
  "logger.ts",
  "logger/index.ts",
  "test/setup.ts",
  "__tests__",
  ".test.",
  ".spec.",
  ".stories.",
];

function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, dist, build, .git
      if (
        ![
          "node_modules",
          ".next",
          "dist",
          "build",
          ".git",
          "coverage",
          "__tests__",
          "tests",
        ].includes(file)
      ) {
        findFiles(filePath, extensions);
      }
    } else if (extensions.some((ext) => file.endsWith(ext))) {
      // Skip test files and logger files
      const shouldSkip = filesToSkip.some((skip) => filePath.includes(skip));
      if (!shouldSkip) {
        filesToProcess.push(filePath);
      }
    }
  }
}

// Find all files
const srcDir = path.join(__dirname, "../apps/web/src");
findFiles(srcDir);

console.log(`Found ${filesToProcess.length} files to process`);

// Process each file
let processed = 0;
let replacements = {
  log: 0,
  debug: 0,
  info: 0,
  warn: 0,
  error: 0,
};

for (const filePath of filesToProcess) {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;
  let hasLoggerImport = false;

  // Check if logger is already imported
  const loggerImportRegex = /import\s+.*logger.*from\s+['"]@\/lib\/logger['"]/;
  if (loggerImportRegex.test(content)) {
    hasLoggerImport = true;
  }

  // Replace console.log with logger.log
  if (/console\.log\(/.test(content)) {
    if (!hasLoggerImport) {
      // Add logger import at the top
      const importMatch = content.match(/^import\s+.*from\s+['"]/m);
      if (importMatch) {
        const insertPos = content.indexOf(
          "\n",
          importMatch.index + importMatch[0].length,
        );
        content =
          content.slice(0, insertPos) +
          "\nimport { logger } from '@/lib/logger';" +
          content.slice(insertPos);
        hasLoggerImport = true;
      } else {
        // No imports, add at the beginning
        content = "import { logger } from '@/lib/logger';\n" + content;
        hasLoggerImport = true;
      }
    }
    // Replace console.log(message) with logger.log(message)
    // Handle both simple and complex cases
    content = content.replace(/console\.log\(([^)]+)\)/g, (match, args) => {
      replacements.log++;
      // If it's a simple string, use logger.log
      if (
        args.trim().startsWith('"') ||
        args.trim().startsWith("'") ||
        args.trim().startsWith("`")
      ) {
        return `logger.log(${args})`;
      }
      // Otherwise, wrap in a message
      return `logger.log('', { message: ${args} })`;
    });
    modified = true;
  }

  // Replace console.debug with logger.debug
  if (/console\.debug\(/.test(content)) {
    if (!hasLoggerImport) {
      const importMatch = content.match(/^import\s+.*from\s+['"]/m);
      if (importMatch) {
        const insertPos = content.indexOf(
          "\n",
          importMatch.index + importMatch[0].length,
        );
        content =
          content.slice(0, insertPos) +
          "\nimport { logger } from '@/lib/logger';" +
          content.slice(insertPos);
        hasLoggerImport = true;
      } else {
        content = "import { logger } from '@/lib/logger';\n" + content;
        hasLoggerImport = true;
      }
    }
    content = content.replace(/console\.debug\(([^)]+)\)/g, (match, args) => {
      replacements.debug++;
      if (
        args.trim().startsWith('"') ||
        args.trim().startsWith("'") ||
        args.trim().startsWith("`")
      ) {
        return `logger.debug(${args})`;
      }
      return `logger.debug('', { message: ${args} })`;
    });
    modified = true;
  }

  // Replace console.info with logger.info
  if (/console\.info\(/.test(content)) {
    if (!hasLoggerImport) {
      const importMatch = content.match(/^import\s+.*from\s+['"]/m);
      if (importMatch) {
        const insertPos = content.indexOf(
          "\n",
          importMatch.index + importMatch[0].length,
        );
        content =
          content.slice(0, insertPos) +
          "\nimport { logger } from '@/lib/logger';" +
          content.slice(insertPos);
        hasLoggerImport = true;
      } else {
        content = "import { logger } from '@/lib/logger';\n" + content;
        hasLoggerImport = true;
      }
    }
    content = content.replace(/console\.info\(([^)]+)\)/g, (match, args) => {
      replacements.info++;
      if (
        args.trim().startsWith('"') ||
        args.trim().startsWith("'") ||
        args.trim().startsWith("`")
      ) {
        return `logger.info(${args})`;
      }
      return `logger.info('', { message: ${args} })`;
    });
    modified = true;
  }

  // Replace console.warn with logger.warn (keep in production)
  if (/console\.warn\(/.test(content)) {
    if (!hasLoggerImport) {
      const importMatch = content.match(/^import\s+.*from\s+['"]/m);
      if (importMatch) {
        const insertPos = content.indexOf(
          "\n",
          importMatch.index + importMatch[0].length,
        );
        content =
          content.slice(0, insertPos) +
          "\nimport { logger } from '@/lib/logger';" +
          content.slice(insertPos);
        hasLoggerImport = true;
      } else {
        content = "import { logger } from '@/lib/logger';\n" + content;
        hasLoggerImport = true;
      }
    }
    content = content.replace(/console\.warn\(([^)]+)\)/g, (match, args) => {
      replacements.warn++;
      if (
        args.trim().startsWith('"') ||
        args.trim().startsWith("'") ||
        args.trim().startsWith("`")
      ) {
        return `logger.warn(${args})`;
      }
      return `logger.warn('', { message: ${args} })`;
    });
    modified = true;
  }

  // Replace console.error with logger.error (keep in production)
  if (/console\.error\(/.test(content)) {
    if (!hasLoggerImport) {
      const importMatch = content.match(/^import\s+.*from\s+['"]/m);
      if (importMatch) {
        const insertPos = content.indexOf(
          "\n",
          importMatch.index + importMatch[0].length,
        );
        content =
          content.slice(0, insertPos) +
          "\nimport { logger } from '@/lib/logger';" +
          content.slice(insertPos);
        hasLoggerImport = true;
      } else {
        content = "import { logger } from '@/lib/logger';\n" + content;
        hasLoggerImport = true;
      }
    }
    content = content.replace(/console\.error\(([^)]+)\)/g, (match, args) => {
      replacements.error++;
      // Handle error objects specially
      if (
        args.includes("error") ||
        args.includes("Error") ||
        args.includes("err")
      ) {
        return `logger.error('', ${args})`;
      }
      if (
        args.trim().startsWith('"') ||
        args.trim().startsWith("'") ||
        args.trim().startsWith("`")
      ) {
        return `logger.error(${args})`;
      }
      return `logger.error('', { message: ${args} })`;
    });
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    processed++;
  }
}

console.log(`\nProcessed ${processed} files`);
console.log("Replacements made:");
console.log(`  - console.log: ${replacements.log}`);
console.log(`  - console.debug: ${replacements.debug}`);
console.log(`  - console.info: ${replacements.info}`);
console.log(`  - console.warn: ${replacements.warn}`);
console.log(`  - console.error: ${replacements.error}`);
console.log("\nPlease review the changes and test your application.");
