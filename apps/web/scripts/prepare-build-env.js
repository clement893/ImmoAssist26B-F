#!/usr/bin/env node
/**
 * Prepare build environment variables for Next.js
 * This script reads NEXT_PUBLIC_* variables from the environment
 * and creates a .env.local file that Next.js can read during build
 *
 * Railway passes environment variables, but they may not be available as build args.
 * This script ensures they're available to Next.js during build.
 */

const fs = require('fs');
const path = require('path');

const envVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_DEFAULT_API_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
];

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = [];

console.log('Preparing build environment variables...');
console.log('Reading from process.env and ARG variables...');

// Check both process.env (runtime) and any build args that might have been passed
envVars.forEach((varName) => {
  // Try process.env first (Railway runtime variables)
  let value = process.env[varName];

  // If not found, try as build arg (Railway might pass as ARG)
  if (!value) {
    // Build args are passed as environment variables in Docker
    value = process.env[varName];
  }

  if (value !== undefined && value !== null && value !== '') {
    envContent.push(`${varName}=${value}`);
    console.log(`✓ Found ${varName}`);
  } else {
    console.log(`✗ Missing ${varName}`);
  }
});

if (envContent.length > 0) {
  fs.writeFileSync(envPath, envContent.join('\n') + '\n', 'utf8');
  console.log(`\n✓ Created ${envPath} with ${envContent.length} variables`);
  console.log(
    'Variables:',
    envVars.filter((v) => envContent.some((c) => c.startsWith(v))).join(', ')
  );
} else {
  console.log('\n⚠ No NEXT_PUBLIC_* variables found in environment');
  console.log(
    'Available env vars:',
    Object.keys(process.env)
      .filter((k) => k.startsWith('NEXT_PUBLIC_'))
      .join(', ') || 'none'
  );
  // Create empty file to avoid errors
  fs.writeFileSync(envPath, '', 'utf8');
}
