#!/usr/bin/env node

/**
 * Script de vérification de la cohérence du thème
 * Détecte les couleurs hardcodées et les incohérences dans l'utilisation des classes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const COMPONENTS_DIR = path.join(__dirname, '../apps/web/src/components');
const UI_DIR = path.join(COMPONENTS_DIR, 'ui');

// Patterns à détecter
const HARDCODED_COLORS = /#[0-9a-fA-F]{3,6}|rgb\(|rgba\(/gi;
const ERROR_CLASSES = /(text|bg|border)-(error|danger)-\d+/g;
const INCONSISTENT_ERROR = /(error-\d+|danger-\d+)/g;

const issues = {
  hardcodedColors: [],
  inconsistentErrorClasses: [],
  dangerVsError: [],
};

function scanFile(filePath, relativePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // Détecter les couleurs hardcodées (sauf dans les tests et ColorPicker)
  if (!filePath.includes('__tests__') && !filePath.includes('ColorPicker')) {
    lines.forEach((line, index) => {
      if (HARDCODED_COLORS.test(line) && !line.includes('var(--') && !line.includes('fallback')) {
        issues.hardcodedColors.push({
          file: relativePath,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  }

  // Détecter les classes d'erreur inconsistantes
  lines.forEach((line, index) => {
    const errorMatches = line.matchAll(ERROR_CLASSES);
    for (const match of errorMatches) {
      const fullMatch = match[0];
      const variant = match[1]; // text, bg, border
      const type = match[2]; // error ou danger
      const shade = fullMatch.match(/\d+/)?.[0];

      issues.inconsistentErrorClasses.push({
        file: relativePath,
        line: index + 1,
        class: fullMatch,
        variant,
        type,
        shade,
        content: line.trim(),
      });

      // Détecter le mélange error/danger
      if (type === 'danger') {
        issues.dangerVsError.push({
          file: relativePath,
          line: index + 1,
          class: fullMatch,
          content: line.trim(),
        });
      }
    }
  });
}

function scanDirectory(dir, relativeDir = '') {
  if (!fs.existsSync(dir)) {
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(relativeDir, entry.name);

    if (entry.isDirectory()) {
      // Ignorer node_modules et autres dossiers non pertinents
      if (!['node_modules', '.next', 'dist', 'build'].includes(entry.name)) {
        scanDirectory(fullPath, relativePath);
      }
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
      scanFile(fullPath, relativePath);
    }
  }
}

// Analyser les composants UI
console.log('🔍 Analyse des composants UI...\n');
scanDirectory(UI_DIR, 'ui');

// Statistiques
const errorShades = {};
const errorTypes = { error: 0, danger: 0 };

issues.inconsistentErrorClasses.forEach((issue) => {
  const key = `${issue.variant}-${issue.shade}`;
  if (!errorShades[key]) {
    errorShades[key] = [];
  }
  errorShades[key].push(issue.file);
  errorTypes[issue.type]++;
});

// Rapport
console.log('📊 RAPPORT DE COHÉRENCE DU THÈME\n');
console.log('='.repeat(60));

// Couleurs hardcodées
if (issues.hardcodedColors.length > 0) {
  console.log(`\n⚠️  Couleurs hardcodées détectées: ${issues.hardcodedColors.length}`);
  const uniqueFiles = [...new Set(issues.hardcodedColors.map((i) => i.file))];
  console.log(`   Fichiers affectés: ${uniqueFiles.length}`);
  if (uniqueFiles.length <= 10) {
    uniqueFiles.forEach((file) => console.log(`   - ${file}`));
  }
} else {
  console.log('\n✅ Aucune couleur hardcodée détectée (hors tests)');
}

// Classes d'erreur inconsistantes
console.log(`\n📋 Classes d'erreur/danger détectées: ${issues.inconsistentErrorClasses.length}`);
console.log(`   Utilisation de 'error': ${errorTypes.error}`);
console.log(`   Utilisation de 'danger': ${errorTypes.danger}`);

if (Object.keys(errorShades).length > 0) {
  console.log(`\n   Nuances utilisées:`);
  Object.entries(errorShades)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([shade, files]) => {
      const uniqueFiles = [...new Set(files)];
      console.log(`   - ${shade}: ${uniqueFiles.length} fichier(s)`);
      if (uniqueFiles.length <= 5) {
        uniqueFiles.forEach((file) => console.log(`     → ${file}`));
      }
    });
}

// Mélange error/danger
if (issues.dangerVsError.length > 0) {
  console.log(`\n⚠️  Mélange error/danger détecté: ${issues.dangerVsError.length} occurrences`);
  const uniqueFiles = [...new Set(issues.dangerVsError.map((i) => i.file))];
  console.log(`   Fichiers utilisant 'danger' au lieu de 'error': ${uniqueFiles.length}`);
  if (uniqueFiles.length <= 15) {
    uniqueFiles.forEach((file) => {
      const count = issues.dangerVsError.filter((i) => i.file === file).length;
      console.log(`   - ${file} (${count} occurrence(s))`);
    });
  }
}

// Recommandations
console.log('\n' + '='.repeat(60));
console.log('\n💡 RECOMMANDATIONS:\n');

if (issues.dangerVsError.length > 0) {
  console.log('1. Standardiser sur "error" au lieu de "danger"');
  console.log('   → Remplacer toutes les occurrences de "danger" par "error"');
}

if (Object.keys(errorShades).length > 5) {
  console.log('2. Standardiser les nuances utilisées:');
  console.log('   → Messages: text-error-600');
  console.log('   → Bordures: border-error-500');
  console.log('   → Backgrounds: bg-error-50 / bg-error-900');
}

if (issues.hardcodedColors.length > 0) {
  console.log('3. Remplacer les couleurs hardcodées par des variables CSS');
}

console.log('\n✅ Analyse terminée\n');

// Code de sortie
const hasIssues = issues.hardcodedColors.length > 0 || issues.dangerVsError.length > 0;
process.exit(hasIssues ? 1 : 0);
