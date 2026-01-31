#!/usr/bin/env node

/**
 * Build script with Turbopack (default) / Webpack (fallback) support
 *
 * Usage:
 *   - Default (Turbopack): pnpm build
 *   - Force Webpack: USE_WEBPACK=true pnpm build
 *   - Force Turbopack: USE_TURBOPACK=true pnpm build
 */

const { execSync } = require('child_process');
const path = require('path');

const isWebpack = process.env.USE_WEBPACK === 'true' || process.env.USE_WEBPACK === '1';
const isTurbopack = process.env.USE_TURBOPACK === 'true' || process.env.USE_TURBOPACK === '1';

// Determine bundler
let bundler = 'turbopack'; // Default to Turbopack
let buildCommand;

if (isWebpack) {
  bundler = 'webpack';
  buildCommand = 'npx next build --webpack';
  console.log('🔧 Using Webpack (forced via USE_WEBPACK)');
} else if (isTurbopack) {
  bundler = 'turbopack';
  buildCommand = 'npx next build --turbo';
  console.log('⚡ Using Turbopack (forced via USE_TURBOPACK)');
} else {
  // Default: Turbopack (Next.js 16 default)
  bundler = 'turbopack';
  buildCommand = 'npx next build';
  console.log('⚡ Using Turbopack (default)');
}

console.log(`\n📦 Starting build with ${bundler.toUpperCase()}...\n`);

try {
  // Use pnpm exec if available, otherwise npx
  const usePnpm = process.env.npm_execpath && process.env.npm_execpath.includes('pnpm');
  const command = usePnpm ? buildCommand.replace('npx next', 'pnpm exec next') : buildCommand;

  execSync(command, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NEXT_BUILDER: bundler, // Pass bundler info to Next.js
    },
  });

  console.log(`\n✅ Build completed successfully with ${bundler.toUpperCase()}!\n`);
  process.exit(0);
} catch (error) {
  console.error(`\n❌ Build failed with ${bundler.toUpperCase()}`);

  // If Turbopack failed and Webpack wasn't explicitly forced, suggest fallback
  if (bundler === 'turbopack' && !isWebpack && !isTurbopack) {
    console.error('\n💡 Tip: If this is a Turbopack-specific issue, you can fallback to Webpack:');
    console.error('   USE_WEBPACK=true pnpm build\n');
  }

  process.exit(error.status || 1);
}
