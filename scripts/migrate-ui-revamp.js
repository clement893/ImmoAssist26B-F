#!/usr/bin/env node

/**
 * Script de Migration UI Revamp
 * 
 * Automatise la migration des composants vers le nouveau design
 * 
 * Usage:
 *   node scripts/migrate-ui-revamp.js audit <component-path>
 *   node scripts/migrate-ui-revamp.js migrate <component-path>
 *   node scripts/migrate-ui-revamp.js batch <components-list.json>
 *   node scripts/migrate-ui-revamp.js validate <component-path>
 */

const fs = require('fs');
const path = require('path');

// Configuration
const COMPONENTS_DIR = path.join(__dirname, '../apps/web/src/components');
const OUTPUT_DIR = path.join(__dirname, '../docs/migration-reports');

// Patterns de remplacement
const REPLACEMENTS = {
  // Ombres
  shadows: [
    {
      pattern: /\bshadow-sm\b/g,
      replacement: 'shadow-standard-sm',
      description: 'Remplace shadow-sm par shadow-standard-sm'
    },
    {
      pattern: /\bshadow-md\b/g,
      replacement: 'shadow-standard-md',
      description: 'Remplace shadow-md par shadow-standard-md'
    },
    {
      pattern: /\bshadow-lg\b/g,
      replacement: 'shadow-standard-lg',
      description: 'Remplace shadow-lg par shadow-standard-lg'
    },
    {
      pattern: /\bshadow-xl\b/g,
      replacement: 'shadow-standard-xl',
      description: 'Remplace shadow-xl par shadow-standard-xl'
    },
    {
      pattern: /\bshadow-2xl\b/g,
      replacement: 'shadow-standard-xl',
      description: 'Remplace shadow-2xl par shadow-standard-xl'
    },
  ],
  
  // Couleurs
  colors: [
    {
      pattern: /\bbg-blue-(\d+)\b/g,
      replacement: 'bg-primary-$1',
      description: 'Remplace bg-blue-* par bg-primary-*'
    },
    {
      pattern: /\btext-blue-(\d+)\b/g,
      replacement: 'text-primary-$1',
      description: 'Remplace text-blue-* par text-primary-*'
    },
    {
      pattern: /\bborder-blue-(\d+)\b/g,
      replacement: 'border-primary-$1',
      description: 'Remplace border-blue-* par border-primary-*'
    },
    {
      pattern: /\bbg-gray-(\d+)\s+dark:bg-gray-(\d+)\b/g,
      replacement: 'bg-background dark:bg-background',
      description: 'Remplace bg-gray-* dark:bg-gray-* par bg-background'
    },
    {
      pattern: /\btext-gray-(\d+)\s+dark:text-gray-(\d+)\b/g,
      replacement: 'text-foreground dark:text-foreground',
      description: 'Remplace text-gray-* dark:text-gray-* par text-foreground'
    },
    {
      pattern: /\bborder-gray-(\d+)\s+dark:border-gray-(\d+)\b/g,
      replacement: 'border-border dark:border-border',
      description: 'Remplace border-gray-* dark:border-gray-* par border-border'
    },
    {
      pattern: /\bbg-red-(\d+)\b/g,
      replacement: 'bg-error-$1',
      description: 'Remplace bg-red-* par bg-error-*'
    },
    {
      pattern: /\btext-red-(\d+)\b/g,
      replacement: 'text-error-$1',
      description: 'Remplace text-red-* par text-error-*'
    },
    {
      pattern: /\bborder-red-(\d+)\b/g,
      replacement: 'border-error-$1',
      description: 'Remplace border-red-* par border-error-*'
    },
    {
      pattern: /\bbg-green-(\d+)\b/g,
      replacement: 'bg-success-$1',
      description: 'Remplace bg-green-* par bg-success-*'
    },
    {
      pattern: /\btext-green-(\d+)\b/g,
      replacement: 'text-success-$1',
      description: 'Remplace text-green-* par text-success-*'
    },
    {
      pattern: /\bbg-yellow-(\d+)\b/g,
      replacement: 'bg-warning-$1',
      description: 'Remplace bg-yellow-* par bg-warning-*'
    },
    {
      pattern: /\btext-yellow-(\d+)\b/g,
      replacement: 'text-warning-$1',
      description: 'Remplace text-yellow-* par text-warning-*'
    },
  ],
  
  // Border Radius
  borderRadius: [
    {
      pattern: /\brounded-lg\b/g,
      replacement: 'rounded-2xl',
      description: 'Remplace rounded-lg (8px) par rounded-2xl (16px) pour cards',
      context: 'card'
    },
    {
      pattern: /\brounded-md\b/g,
      replacement: 'rounded-xl',
      description: 'Remplace rounded-md (6px) par rounded-xl (12px) pour buttons',
      context: 'button'
    },
  ],
  
  // Transitions
  transitions: [
    {
      pattern: /className=\{clsx\(([^)]+)\)\}/g,
      replacement: (match, p1) => {
        // Ajouter transition-all si pas déjà présent
        if (!p1.includes('transition')) {
          return `className={clsx(${p1}, 'transition-all duration-200 ease-out')}`;
        }
        return match;
      },
      description: 'Ajoute transition-all duration-200 ease-out si absent'
    },
  ],
};

/**
 * Audit un composant pour détecter les problèmes
 */
function auditComponent(componentPath) {
  const fullPath = path.join(COMPONENTS_DIR, componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier non trouvé: ${fullPath}`);
    return null;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const issues = {
    file: componentPath,
    shadows: [],
    colors: [],
    borderRadius: [],
    transitions: [],
    hardcodedColors: [],
    hardcodedShadows: [],
  };
  
  // Détecter les ombres non-thémées
  REPLACEMENTS.shadows.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.shadows.push({
        pattern: pattern.toString(),
        replacement,
        description,
        count: matches.length,
        matches: matches.slice(0, 5), // Limiter à 5 exemples
      });
    }
  });
  
  // Détecter les couleurs non-thémées
  REPLACEMENTS.colors.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.colors.push({
        pattern: pattern.toString(),
        replacement,
        description,
        count: matches.length,
        matches: matches.slice(0, 5),
      });
    }
  });
  
  // Détecter les border radius à remplacer
  REPLACEMENTS.borderRadius.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.borderRadius.push({
        pattern: pattern.toString(),
        replacement,
        description,
        count: matches.length,
        matches: matches.slice(0, 5),
      });
    }
  });
  
  // Détecter les couleurs hardcodées (hex, rgb, rgba)
  const hexPattern = /#[0-9A-Fa-f]{3,8}\b/g;
  const rgbPattern = /rgba?\([^)]+\)/g;
  const hexMatches = content.match(hexPattern);
  const rgbMatches = content.match(rgbPattern);
  
  if (hexMatches) {
    issues.hardcodedColors.push({
      type: 'hex',
      count: hexMatches.length,
      matches: hexMatches.slice(0, 5),
    });
  }
  
  if (rgbMatches) {
    issues.hardcodedColors.push({
      type: 'rgb/rgba',
      count: rgbMatches.length,
      matches: rgbMatches.slice(0, 5),
    });
  }
  
  // Détecter les ombres hardcodées
  const shadowPattern = /shadow-\[[^\]]+\]/g;
  const shadowMatches = content.match(shadowPattern);
  if (shadowMatches) {
    issues.hardcodedShadows.push({
      count: shadowMatches.length,
      matches: shadowMatches.slice(0, 5),
    });
  }
  
  return issues;
}

/**
 * Migre un composant automatiquement
 */
function migrateComponent(componentPath, dryRun = false) {
  const fullPath = path.join(COMPONENTS_DIR, componentPath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier non trouvé: ${fullPath}`);
    return null;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;
  const changes = [];
  
  // Appliquer les remplacements d'ombres
  REPLACEMENTS.shadows.forEach(({ pattern, replacement, description }) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      const matches = (before.match(pattern) || []).length;
      changes.push({
        type: 'shadow',
        description,
        count: matches,
      });
    }
  });
  
  // Appliquer les remplacements de couleurs
  REPLACEMENTS.colors.forEach(({ pattern, replacement, description }) => {
    const before = content;
    if (typeof replacement === 'function') {
      content = content.replace(pattern, replacement);
    } else {
      content = content.replace(pattern, replacement);
    }
    if (before !== content) {
      const matches = (before.match(pattern) || []).length;
      changes.push({
        type: 'color',
        description,
        count: matches,
      });
    }
  });
  
  // Appliquer les remplacements de border radius
  REPLACEMENTS.borderRadius.forEach(({ pattern, replacement, description, context }) => {
    // Vérifier le contexte si spécifié
    if (context && !componentPath.toLowerCase().includes(context)) {
      return; // Skip si le contexte ne correspond pas
    }
    
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      const matches = (before.match(pattern) || []).length;
      changes.push({
        type: 'borderRadius',
        description,
        count: matches,
      });
    }
  });
  
  // Sauvegarder si pas en dry-run
  if (!dryRun && content !== originalContent) {
    // Créer un backup
    const backupPath = `${fullPath}.backup`;
    fs.writeFileSync(backupPath, originalContent);
    
    // Écrire le nouveau contenu
    fs.writeFileSync(fullPath, content);
    
    console.log(`✅ Composant migré: ${componentPath}`);
    console.log(`   Backup créé: ${backupPath}`);
  } else if (dryRun) {
    console.log(`🔍 [DRY RUN] Changements détectés pour: ${componentPath}`);
  }
  
  return {
    file: componentPath,
    changed: content !== originalContent,
    changes,
  };
}

/**
 * Valide qu'un composant a été correctement migré
 */
function validateComponent(componentPath) {
  const issues = auditComponent(componentPath);
  
  if (!issues) {
    return { valid: false, error: 'Fichier non trouvé' };
  }
  
  const hasIssues = 
    issues.shadows.length > 0 ||
    issues.colors.length > 0 ||
    issues.borderRadius.length > 0 ||
    issues.hardcodedColors.length > 0 ||
    issues.hardcodedShadows.length > 0;
  
  return {
    valid: !hasIssues,
    issues,
  };
}

/**
 * Génère un rapport d'audit
 */
function generateReport(componentPath) {
  const issues = auditComponent(componentPath);
  
  if (!issues) {
    return;
  }
  
  // Créer le répertoire de sortie si nécessaire
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const reportPath = path.join(OUTPUT_DIR, `${path.basename(componentPath, '.tsx')}-audit.json`);
  fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2));
  
  console.log(`📊 Rapport généré: ${reportPath}`);
  
  // Afficher un résumé
  console.log('\n📋 Résumé:');
  console.log(`   Ombres à remplacer: ${issues.shadows.length}`);
  console.log(`   Couleurs à remplacer: ${issues.colors.length}`);
  console.log(`   Border radius à remplacer: ${issues.borderRadius.length}`);
  console.log(`   Couleurs hardcodées: ${issues.hardcodedColors.length}`);
  console.log(`   Ombres hardcodées: ${issues.hardcodedShadows.length}`);
}

// CLI
const command = process.argv[2];
const componentPath = process.argv[3];
const dryRun = process.argv.includes('--dry-run');

if (!command) {
  console.log(`
Usage:
  node scripts/migrate-ui-revamp.js audit <component-path>
  node scripts/migrate-ui-revamp.js migrate <component-path> [--dry-run]
  node scripts/migrate-ui-revamp.js validate <component-path>
  node scripts/migrate-ui-revamp.js report <component-path>

Examples:
  node scripts/migrate-ui-revamp.js audit ui/Card.tsx
  node scripts/migrate-ui-revamp.js migrate ui/Card.tsx --dry-run
  node scripts/migrate-ui-revamp.js migrate ui/Card.tsx
  node scripts/migrate-ui-revamp.js validate ui/Card.tsx
  node scripts/migrate-ui-revamp.js report ui/Card.tsx
`);
  process.exit(1);
}

switch (command) {
  case 'audit':
    if (!componentPath) {
      console.error('❌ Chemin du composant requis');
      process.exit(1);
    }
    const issues = auditComponent(componentPath);
    if (issues) {
      console.log(JSON.stringify(issues, null, 2));
    }
    break;
    
  case 'migrate':
    if (!componentPath) {
      console.error('❌ Chemin du composant requis');
      process.exit(1);
    }
    const result = migrateComponent(componentPath, dryRun);
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    }
    break;
    
  case 'validate':
    if (!componentPath) {
      console.error('❌ Chemin du composant requis');
      process.exit(1);
    }
    const validation = validateComponent(componentPath);
    console.log(JSON.stringify(validation, null, 2));
    break;
    
  case 'report':
    if (!componentPath) {
      console.error('❌ Chemin du composant requis');
      process.exit(1);
    }
    generateReport(componentPath);
    break;
    
  default:
    console.error(`❌ Commande inconnue: ${command}`);
    process.exit(1);
}
