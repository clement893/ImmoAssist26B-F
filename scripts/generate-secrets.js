#!/usr/bin/env node
/**
 * Generate Secure Secrets Script
 * 
 * Generates cryptographically secure secrets for:
 * - SECRET_KEY (backend)
 * - NEXTAUTH_SECRET (frontend)
 * - JWT_SECRET (frontend)
 * - POSTGRES_PASSWORD (database)
 * 
 * Usage:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --output .env
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate a secure random secret
 * @param {number} length - Length in bytes (default: 32)
 * @param {string} encoding - Encoding format (default: 'hex')
 * @returns {string} Generated secret
 */
function generateSecret(length = 32, encoding = 'hex') {
  return crypto.randomBytes(length).toString(encoding);
}

/**
 * Generate a secure random password
 * @param {number} length - Length in characters (default: 24)
 * @returns {string} Generated password
 */
function generatePassword(length = 24) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[bytes[i] % charset.length];
  }
  return password;
}

/**
 * Generate all secrets
 * @returns {Object} Object containing all generated secrets
 */
function generateAllSecrets() {
  return {
    // Backend secrets
    SECRET_KEY: generateSecret(32, 'hex'),
    POSTGRES_PASSWORD: generatePassword(24),
    
    // Frontend secrets
    NEXTAUTH_SECRET: generateSecret(32, 'base64'),
    JWT_SECRET: generateSecret(32, 'hex'),
    
    // Additional secrets
    STRIPE_WEBHOOK_SECRET: `whsec_${generateSecret(32, 'hex')}`,
    SENDGRID_API_KEY: `SG.${generateSecret(22, 'base64').replace(/[+/=]/g, '')}`,
  };
}

/**
 * Format secrets for .env file
 * @param {Object} secrets - Secrets object
 * @returns {string} Formatted .env content
 */
function formatEnvFile(secrets) {
  return `# ============================================
# GENERATED SECRETS
# ============================================
# ⚠️ IMPORTANT: Keep these secrets secure!
# Generated on: ${new Date().toISOString()}
# 
# NEVER commit this file to version control!
# Add .env to .gitignore

# ============================================
# BACKEND SECRETS
# ============================================
SECRET_KEY=${secrets.SECRET_KEY}
POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD}

# ============================================
# FRONTEND SECRETS
# ============================================
NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}
JWT_SECRET=${secrets.JWT_SECRET}

# ============================================
# OPTIONAL SECRETS (if needed)
# ============================================
# STRIPE_WEBHOOK_SECRET=${secrets.STRIPE_WEBHOOK_SECRET}
# SENDGRID_API_KEY=${secrets.SENDGRID_API_KEY}

# ============================================
# NOTES
# ============================================
# 1. Copy these values to your .env files:
#    - backend/.env
#    - apps/web/.env.local
# 2. Update docker-compose.yml with POSTGRES_PASSWORD
# 3. Never share these secrets
# 4. Rotate secrets regularly in production
`;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const outputFile = args.includes('--output') 
    ? args[args.indexOf('--output') + 1] 
    : null;

  console.log('🔐 Generating secure secrets...\n');

  const secrets = generateAllSecrets();

  // Display secrets
  console.log('Generated Secrets:');
  console.log('==================\n');
  console.log('Backend:');
  console.log(`  SECRET_KEY=${secrets.SECRET_KEY}`);
  console.log(`  POSTGRES_PASSWORD=${secrets.POSTGRES_PASSWORD}`);
  console.log('\nFrontend:');
  console.log(`  NEXTAUTH_SECRET=${secrets.NEXTAUTH_SECRET}`);
  console.log(`  JWT_SECRET=${secrets.JWT_SECRET}`);
  console.log('\n');

  // Write to file if requested
  if (outputFile) {
    const outputPath = path.resolve(process.cwd(), outputFile);
    const envContent = formatEnvFile(secrets);
    
    try {
      fs.writeFileSync(outputPath, envContent, 'utf8');
      console.log(`✅ Secrets written to: ${outputPath}`);
      console.log('⚠️  Remember to add this file to .gitignore!\n');
    } catch (error) {
      console.error('❌ Error writing file:', error.message);
      process.exit(1);
    }
  } else {
    console.log('💡 Tip: Use --output .env to save secrets to a file');
    console.log('⚠️  Remember to copy these secrets to your .env files!\n');
  }

  console.log('📝 Next steps:');
  console.log('  1. Copy SECRET_KEY to backend/.env');
  console.log('  2. Copy NEXTAUTH_SECRET and JWT_SECRET to apps/web/.env.local');
  console.log('  3. Update POSTGRES_PASSWORD in docker-compose.yml or .env');
  console.log('  4. Never commit these secrets to version control!\n');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSecret, generatePassword, generateAllSecrets };
