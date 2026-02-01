#!/usr/bin/env node

/**
 * Script de Migration Batch - Ombres
 * 
 * Migre automatiquement les ombres dans plusieurs fichiers
 * 
 * Usage:
 *   node scripts/migrate-shadows-batch.js <file1> <file2> ...
 */

const fs = require('fs');
const path = require('path');

// Mappings de remplacement
const shadowReplacements = [
  // Ombres standard
  { pattern: /\bshadow-sm\b/g, replacement: 'shadow-standard-sm', context: 'standard' },
  { pattern: /\bshadow-md\b/g, replacement: 'shadow-standard-md', context: 'standard' },
  { pattern: /\bshadow-lg\b/g, replacement: 'shadow-standard-lg', context: 'standard' },
  { pattern: /\bshadow-xl\b/g, replacement: 'shadow-standard-xl', context: 'standard' },
  
  // Hover shadows
  { pattern: /\bhover:shadow-sm\b/g, replacement: 'hover:shadow-standard-sm', context: 'hover' },
  { pattern: /\bhover:shadow-md\b/g, replacement: 'hover:shadow-standard-md', context: 'hover' },
  { pattern: /\bhover:shadow-lg\b/g, replacement: 'hover:shadow-standard-lg', context: 'hover' },
  { pattern: /\bhover:shadow-xl\b/g, replacement: 'hover:shadow-standard-xl', context: 'hover' },
  
  // Focus shadows (généralement colorées)
  { pattern: /\bfocus:shadow-primary\b/g, replacement: 'focus:shadow-colored-primary', context: 'focus' },
  { pattern: /\bfocus:shadow-error\b/g, replacement: 'focus:shadow-colored-error', context: 'focus' },
  { pattern: /\bfocus:shadow-sm\b/g, replacement: 'focus:shadow-subtle-sm', context: 'focus' },
  
  // Transitions
  { pattern: /\btransition-all duration-200 ease-natural\b/g, replacement: 'transition-modern', context: 'transition' },
  { pattern: /\btransition-all duration-200 ease-out\b/g, replacement: 'transition-modern', context: 'transition' },
  { pattern: /\btransition-all duration-200\b/g, replacement: 'transition-modern', context: 'transition' },
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier non trouvé: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;
  const changes = [];
  
  shadowReplacements.forEach(({ pattern, replacement, context }) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      const matches = (before.match(pattern) || []).length;
      changes.push({ context, replacement, count: matches });
    }
  });
  
  if (content !== originalContent) {
    // Créer un backup
    const backupPath = `${fullPath}.backup`;
    fs.writeFileSync(backupPath, originalContent);
    
    // Écrire le nouveau contenu
    fs.writeFileSync(fullPath, content);
    
    console.log(`✅ ${filePath}`);
    changes.forEach(({ context, replacement, count }) => {
      console.log(`   - ${context}: ${replacement} (${count}x)`);
    });
    return true;
  }
  
  return false;
}

// CLI
const files = process.argv.slice(2);

if (files.length === 0) {
  console.log(`
Usage:
  node scripts/migrate-shadows-batch.js <file1> <file2> ...

Examples:
  node scripts/migrate-shadows-batch.js apps/web/src/components/ui/Modal.tsx
  node scripts/migrate-shadows-batch.js apps/web/src/components/ui/Alert.tsx apps/web/src/components/ui/Badge.tsx
`);
  process.exit(1);
}

let migrated = 0;
files.forEach((file) => {
  if (migrateFile(file)) {
    migrated++;
  }
});

console.log(`\n📊 ${migrated}/${files.length} fichiers migrés`);
