#!/usr/bin/env node

/**
 * Script to fix 'use client' directive placement in Next.js pages
 * Moves 'use client' to the top and removes incompatible dynamic exports
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function fixUseClientDirective() {
  const files = await glob('src/app/**/page.tsx', {
    cwd: path.join(__dirname, '..'),
    absolute: true,
  });

  let fixedCount = 0;

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;

    // Check if file has both 'use client' and export const dynamic
    const hasUseClient = content.includes("'use client'");
    const hasDynamicExport = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(content);

    if (!hasUseClient || !hasDynamicExport) {
      continue;
    }

    // Check if 'use client' comes after export const dynamic
    const useClientIndex = content.indexOf("'use client'");
    const dynamicIndex = content.indexOf('export const dynamic');

    if (useClientIndex === -1 || dynamicIndex === -1 || useClientIndex > dynamicIndex) {
      continue;
    }

    // Remove export const dynamic and dynamicParams lines
    content = content.replace(/export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"];?\s*\n/g, '');
    content = content.replace(/export\s+const\s+dynamicParams\s*=\s*true;?\s*\n/g, '');

    // Remove 'use client' from its current position
    content = content.replace(/'use client';?\s*\n/g, '');

    // Add 'use client' at the very beginning (after any shebang or comments)
    const commentMatch = content.match(/^(\/\*\*[\s\S]*?\*\/|\/\/.*?\n)*/);
    const afterComments = commentMatch ? commentMatch[0].length : 0;

    // Insert 'use client' after comments but before any other code
    const before = content.substring(0, afterComments);
    const after = content.substring(afterComments);

    // Add comment explaining why dynamic export was removed
    content =
      before +
      "'use client';\n\n// Note: Client Components are automatically dynamic in Next.js App Router\n// No need for export const dynamic = 'force-dynamic'\n" +
      after;

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${path.relative(process.cwd(), filePath)}`);
      fixedCount++;
    }
  }

  console.log(`\nFixed ${fixedCount} files.`);
}

fixUseClientDirective().catch(console.error);
