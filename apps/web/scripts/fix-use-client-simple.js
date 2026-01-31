#!/usr/bin/env node

/**
 * Simple script to fix 'use client' directive placement
 * Uses only Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file === 'page.tsx') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  // Check if file has both 'use client' and export const dynamic
  const hasUseClient = content.includes("'use client'");
  const hasDynamicExport = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(content);

  if (!hasUseClient || !hasDynamicExport) {
    return false;
  }

  // Check if 'use client' comes after export const dynamic
  const useClientIndex = content.indexOf("'use client'");
  const dynamicIndex = content.indexOf('export const dynamic');

  if (useClientIndex === -1 || dynamicIndex === -1 || useClientIndex <= dynamicIndex) {
    return false;
  }

  // Remove export const dynamic and dynamicParams lines
  content = content.replace(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];?\s*\n/g, '');
  content = content.replace(/export\s+const\s+dynamicParams\s*=\s*true;?\s*\n/g, '');

  // Remove 'use client' from its current position
  content = content.replace(/'use client';?\s*\n/g, '');

  // Find where to insert (after comments, before imports)
  const commentMatch = content.match(/^(\/\*\*[\s\S]*?\*\/|\/\/.*?\n)*/);
  const afterComments = commentMatch ? commentMatch[0].length : 0;

  // Insert 'use client' after comments
  const before = content.substring(0, afterComments);
  const after = content.substring(afterComments);

  content =
    before +
    "'use client';\n\n// Note: Client Components are automatically dynamic in Next.js App Router\n// No need for export const dynamic = 'force-dynamic'\n" +
    after;

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

const appDir = path.join(__dirname, '..', 'src', 'app', '[locale]');
const files = findFiles(appDir);

let fixedCount = 0;
files.forEach((file) => {
  if (fixFile(file)) {
    console.log(`Fixed: ${path.relative(process.cwd(), file)}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files.`);
