#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * Checks bundle size against configured budgets and reports results
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in bytes)
// Based on Next.js recommendations and Web Vitals thresholds
const BUNDLE_BUDGETS = {
  // First Load JS (all JS needed for initial page load)
  maxFirstLoadJS: 244 * 1024, // 244KB max (Next.js default)
  warningFirstLoadJS: 200 * 1024, // 200KB warning threshold

  // Individual route budgets
  maxRouteJS: 200 * 1024, // 200KB max per route
  warningRouteJS: 150 * 1024, // 150KB warning per route

  // Total bundle size
  maxTotal: 500 * 1024, // 500KB max total bundle
  warningTotal: 400 * 1024, // 400KB warning threshold

  // CSS budgets
  maxCSS: 50 * 1024, // 50KB max CSS
  warningCSS: 40 * 1024, // 40KB warning threshold
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function getBuildStats() {
  const buildDir = path.join(process.cwd(), '.next');

  if (!fs.existsSync(buildDir)) {
    console.error(
      `${colors.red}Error: Build directory not found. Run 'pnpm build' first.${colors.reset}`
    );
    process.exit(1);
  }

  const staticDir = path.join(buildDir, 'static');
  let totalSize = 0;
  let firstLoadJS = 0;
  let cssSize = 0;
  const chunks = {};
  const cssChunks = {};

  if (fs.existsSync(staticDir)) {
    // Calculate total static assets size
    function calculateDirSize(dir, relativePath = '') {
      let size = 0;
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dir, file.name);
        const relativeFilePath = path.join(relativePath, file.name);

        if (file.isDirectory()) {
          size += calculateDirSize(filePath, relativeFilePath);
        } else {
          const stats = fs.statSync(filePath);
          size += stats.size;

          // Track JS chunks
          if (file.name.endsWith('.js')) {
            chunks[relativeFilePath] = stats.size;

            // Estimate first load JS (framework + main + pages/_app)
            if (
              file.name.includes('framework') ||
              file.name.includes('main') ||
              file.name.includes('webpack') ||
              file.name.includes('_app') ||
              file.name.includes('pages/_app')
            ) {
              firstLoadJS += stats.size;
            }
          }

          // Track CSS chunks
          if (file.name.endsWith('.css')) {
            cssChunks[relativeFilePath] = stats.size;
            cssSize += stats.size;
          }
        }
      }
      return size;
    }

    totalSize = calculateDirSize(staticDir);
  }

  // Try to read Next.js build manifest for more accurate stats
  const buildManifestPath = path.join(buildDir, 'build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
      // Next.js provides pages object with JS/CSS files per route
      // We can use this for route-specific budgets
    } catch (e) {
      // Ignore if manifest can't be parsed
    }
  }

  return {
    totalSize,
    firstLoadJS,
    cssSize,
    chunks,
    cssChunks,
  };
}

function checkBundleSize() {
  console.log(
    `${colors.blue}📦 Checking bundle sizes against performance budgets...${colors.reset}\n`
  );

  const stats = getBuildStats();
  const { totalSize, firstLoadJS, cssSize, chunks, cssChunks } = stats;

  // Check total bundle size
  const totalStatus =
    totalSize > BUNDLE_BUDGETS.maxTotal
      ? 'error'
      : totalSize > BUNDLE_BUDGETS.warningTotal
        ? 'warning'
        : 'success';

  // Check first load JS size
  const firstLoadStatus =
    firstLoadJS > BUNDLE_BUDGETS.maxFirstLoadJS
      ? 'error'
      : firstLoadJS > BUNDLE_BUDGETS.warningFirstLoadJS
        ? 'warning'
        : 'success';

  // Check CSS size
  const cssStatus =
    cssSize > BUNDLE_BUDGETS.maxCSS
      ? 'error'
      : cssSize > BUNDLE_BUDGETS.warningCSS
        ? 'warning'
        : 'success';

  // Display results
  console.log('Performance Budget Report:');
  console.log('─'.repeat(60));
  console.log(
    `Total Bundle:     ${formatBytes(totalSize).padStart(10)} / ${formatBytes(BUNDLE_BUDGETS.maxTotal).padStart(10)}`
  );
  console.log(
    `First Load JS:   ${formatBytes(firstLoadJS).padStart(10)} / ${formatBytes(BUNDLE_BUDGETS.maxFirstLoadJS).padStart(10)}`
  );
  console.log(
    `CSS:             ${formatBytes(cssSize).padStart(10)} / ${formatBytes(BUNDLE_BUDGETS.maxCSS).padStart(10)}`
  );
  console.log(`JS Chunks:       ${Object.keys(chunks).length.toString().padStart(10)} files`);
  console.log(`CSS Chunks:      ${Object.keys(cssChunks).length.toString().padStart(10)} files`);
  console.log('─'.repeat(60));

  // Display status
  const totalIcon = totalStatus === 'error' ? '❌' : totalStatus === 'warning' ? '⚠️' : '✅';
  const firstLoadIcon =
    firstLoadStatus === 'error' ? '❌' : firstLoadStatus === 'warning' ? '⚠️' : '✅';
  const cssIcon = cssStatus === 'error' ? '❌' : cssStatus === 'warning' ? '⚠️' : '✅';

  console.log(`\n${totalIcon} Total Bundle: ${totalStatus.toUpperCase()}`);
  console.log(`${firstLoadIcon} First Load JS: ${firstLoadStatus.toUpperCase()}`);
  console.log(`${cssIcon} CSS: ${cssStatus.toUpperCase()}`);

  // Display largest chunks
  if (Object.keys(chunks).length > 0) {
    console.log('\n📊 Largest JS Chunks:');
    const sortedChunks = Object.entries(chunks)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    sortedChunks.forEach(([name, size]) => {
      const percentage = firstLoadJS > 0 ? ((size / firstLoadJS) * 100).toFixed(1) : '0.0';
      const displayName = name.length > 50 ? '...' + name.slice(-47) : name;
      console.log(
        `  ${displayName.padEnd(50)} ${formatBytes(size).padStart(10)} (${percentage}% of first load)`
      );
    });
  }

  // Exit with error if budgets exceeded
  const hasErrors = totalStatus === 'error' || firstLoadStatus === 'error' || cssStatus === 'error';
  const hasWarnings =
    totalStatus === 'warning' || firstLoadStatus === 'warning' || cssStatus === 'warning';

  if (hasErrors) {
    console.log(`\n${colors.red}❌ Bundle size exceeds maximum budget!${colors.reset}`);
    console.log(`${colors.yellow}💡 Consider:${colors.reset}`);
    console.log('  - Code splitting with dynamic imports');
    console.log('  - Tree shaking unused code');
    console.log('  - Removing unused dependencies');
    console.log('  - Lazy loading heavy components');
    console.log('  - Using React Server Components where possible');
    console.log('  - Optimizing images and assets');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log(`\n${colors.yellow}⚠️  Bundle size exceeds warning threshold${colors.reset}`);
    console.log(
      `${colors.yellow}💡 Consider optimizing bundle size before it becomes a problem${colors.reset}`
    );
  }

  if (!hasErrors && !hasWarnings) {
    console.log(
      `\n${colors.green}✅ All bundle sizes are within performance budgets!${colors.reset}`
    );
  }

  return { totalStatus, firstLoadStatus, cssStatus };
}

// Run if called directly
if (require.main === module) {
  checkBundleSize();
}

module.exports = { checkBundleSize, BUNDLE_BUDGETS };
