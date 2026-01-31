#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Validates all required environment variables before build/start
 */

const fs = require('fs');
const path = require('path');

// Load environment validation
const envValidationPath = path.join(__dirname, '../src/lib/env/validate.ts');
const { validateEnv, printEnvDocs, generateEnvExample } = require('../src/lib/env/validate');

const args = process.argv.slice(2);
const command = args[0];

if (command === 'docs') {
  printEnvDocs();
  process.exit(0);
}

if (command === 'generate') {
  const examplePath = path.join(__dirname, '../.env.example');
  const content = generateEnvExample();
  fs.writeFileSync(examplePath, content);
  console.log('✅ Generated .env.example file');
  process.exit(0);
}

// Validate environment
const result = validateEnv();

if (!result.valid) {
  console.error('\n❌ Environment Variables Validation Failed\n');

  if (result.errors.length > 0) {
    console.error('Errors:');
    result.errors.forEach((error) => console.error(`  ❌ ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn('\nWarnings:');
    result.warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
  }

  if (result.missing.length > 0) {
    console.error('\nMissing required variables:');
    result.missing.forEach((key) => console.error(`  • ${key}`));
  }

  console.error('\n💡 Tip: Run "pnpm env:docs" to see documentation');
  console.error('💡 Tip: Run "pnpm env:generate" to generate .env.example\n');
  process.exit(1);
}

if (result.warnings.length > 0) {
  console.warn('\n⚠️  Environment Variables Warnings\n');
  result.warnings.forEach((warning) => console.warn(`  ⚠️  ${warning}`));
  console.warn('');
}

console.log('✅ All environment variables are valid\n');
process.exit(0);
