#!/usr/bin/env node

/**
 * Script to rename the project after cloning the template
 * Replaces all occurrences of template names with new project name
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, "utf8");
    let modified = false;

    for (const [search, replace] of Object.entries(replacements)) {
      const regex = new RegExp(search, "gi");
      if (regex.test(content)) {
        content = content.replace(regex, replace);
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(filePath, content, "utf8");
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, extensions, excludeDirs = []) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        results = results.concat(findFiles(filePath, extensions, excludeDirs));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });

  return results;
}

async function renameProject() {
  console.log("\n🔄 Project Renaming Tool\n");

  const oldName =
    (await question("Current project name (default: ImmoAssist): ")) || "ImmoAssist";
  const newName = await question("New project name: ");

  if (!newName) {
    console.log("❌ New project name is required");
    rl.close();
    return;
  }

  const oldNameLower = oldName.toLowerCase();
  const newNameLower = newName.toLowerCase();
  const oldNameKebab = oldNameLower.replace(/[^a-z0-9]/g, "-");
  const newNameKebab = newNameLower.replace(/[^a-z0-9]/g, "-");

  console.log(`\n📝 Replacing "${oldName}" with "${newName}"...\n`);

  const replacements = {
    [oldName]: newName,
    [oldNameLower]: newNameLower,
    [oldNameKebab]: newNameKebab,
    "modele-nextjs-fullstack": newNameKebab + "-nextjs-fullstack",
    "immoassist": newNameKebab,
    "@modele/web": "@" + newNameKebab + "/web",
    "@modele/types": "@" + newNameKebab + "/types",
  };

  // Find all relevant files
  const rootDir = path.join(__dirname, "..");
  const extensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".yml",
    ".yaml",
    ".py",
    ".env.example",
  ];
  const excludeDirs = [
    "node_modules",
    ".next",
    ".git",
    "dist",
    "build",
    "coverage",
    ".turbo",
  ];

  const files = findFiles(rootDir, extensions, excludeDirs);
  let modifiedCount = 0;

  files.forEach((file) => {
    if (replaceInFile(file, replacements)) {
      console.log(`✅ Updated: ${path.relative(rootDir, file)}`);
      modifiedCount++;
    }
  });

  console.log(`\n✨ Renaming complete! Modified ${modifiedCount} files.`);
  console.log("\n📋 Next steps:");
  console.log("   1. Review the changes");
  console.log("   2. Update package.json if needed");
  console.log("   3. Run: pnpm install");
  console.log("   4. Run: pnpm setup\n");

  rl.close();
}

renameProject().catch((error) => {
  console.error(`\n❌ Error: ${error.message}`);
  rl.close();
  process.exit(1);
});
