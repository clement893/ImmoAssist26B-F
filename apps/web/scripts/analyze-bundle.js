#!/usr/bin/env node

/**
 * Script d'analyse du bundle size
 * Analyse la taille des bundles Next.js et identifie les opportunités d'optimisation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function analyzeBundle() {
  console.log('📊 Analyse du bundle size...\n');

  const webDir = path.resolve(__dirname, '..');
  const buildDir = path.join(webDir, '.next');

  if (!fs.existsSync(buildDir)) {
    console.log('⚠️  Build non trouvé. Exécution du build...\n');
    try {
      execSync('pnpm build', {
        stdio: 'inherit',
        cwd: webDir,
        env: { ...process.env, ANALYZE: 'true' },
      });
    } catch (error) {
      console.error('❌ Erreur lors du build:', error.message);
      process.exit(1);
    }
  }

  // Analyser les fichiers de build
  const staticDir = path.join(buildDir, 'static');
  if (fs.existsSync(staticDir)) {
    console.log('📦 Analyse des fichiers statiques:\n');

    const chunksDir = path.join(staticDir, 'chunks');
    if (fs.existsSync(chunksDir)) {
      const files = fs.readdirSync(chunksDir);
      const jsFiles = files.filter((f) => f.endsWith('.js'));

      const fileSizes = jsFiles
        .map((file) => {
          const filePath = path.join(chunksDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
            sizeMB: (stats.size / (1024 * 1024)).toFixed(2),
          };
        })
        .sort((a, b) => b.size - a.size);

      console.log('Top 10 des plus gros chunks:\n');
      fileSizes.slice(0, 10).forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`);
        console.log(`   ${file.sizeKB} KB (${file.sizeMB} MB)\n`);
      });

      const totalSize = fileSizes.reduce((sum, file) => sum + file.size, 0);
      console.log(`\n📊 Taille totale: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
    }
  }

  console.log('\n💡 Recommandations:');
  console.log('   - Utilisez dynamic imports pour les composants lourds');
  console.log('   - Vérifiez les dépendances inutilisées');
  console.log('   - Considérez le code splitting par route');
  console.log('   - Utilisez next/image pour les images');
}

if (require.main === module) {
  analyzeBundle();
}

module.exports = { analyzeBundle };
