#!/usr/bin/env node

/**
 * Accessibility Audit Script
 * Checks components for common accessibility issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

// Accessibility checks
const ACCESSIBILITY_CHECKS = {
  missingAriaLabel: {
    pattern: /<(button|input|select|textarea|a)(?!.*aria-label)(?!.*aria-labelledby)(?!.*>.*<\/)/gi,
    message: 'Missing aria-label or aria-labelledby',
    severity: 'error',
  },
  missingAlt: {
    pattern: /<img(?!.*alt=)/gi,
    message: 'Missing alt attribute on image',
    severity: 'error',
  },
  missingRole: {
    pattern: /<(div|span)(?!.*role=)(?!.*aria-)/gi,
    message: 'Interactive element may need role attribute',
    severity: 'warning',
  },
  missingKeyboardSupport: {
    pattern: /onClick.*(?!.*onKeyDown)(?!.*onKeyPress)/gi,
    message: 'Click handler without keyboard support',
    severity: 'warning',
  },
  missingFocusManagement: {
    pattern: /tabIndex.*-1/gi,
    message: 'Negative tabIndex may trap focus',
    severity: 'warning',
  },
};

const issues = {
  error: [],
  warning: [],
};

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(process.cwd(), filePath);
  const lines = content.split('\n');

  Object.entries(ACCESSIBILITY_CHECKS).forEach(([checkName, check]) => {
    const matches = content.matchAll(check.pattern);

    for (const match of matches) {
      const lineNumber = content.substring(0, match.index).split('\n').length;
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Skip if it's a comment or string literal
      if (lineContent.startsWith('//') || lineContent.startsWith('*')) {
        continue;
      }

      const issue = {
        file: relativePath,
        line: lineNumber,
        check: checkName,
        message: check.message,
        severity: check.severity,
        context: lineContent.substring(0, 100),
      };

      issues[check.severity].push(issue);
    }
  });
}

function scanDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    // Skip node_modules, .next, etc.
    if (
      file.name.startsWith('.') ||
      file.name === 'node_modules' ||
      file.name === '.next' ||
      file.name === 'dist' ||
      file.name === 'build'
    ) {
      continue;
    }

    if (file.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.jsx')) {
      scanFile(filePath);
    }
  }
}

function auditAccessibility() {
  console.log(`${colors.blue}♿ Running accessibility audit...${colors.reset}\n`);

  const componentsDir = path.join(process.cwd(), 'src', 'components');
  const pagesDir = path.join(process.cwd(), 'src', 'app');

  if (fs.existsSync(componentsDir)) {
    console.log(`Scanning components directory...`);
    scanDirectory(componentsDir);
  }

  if (fs.existsSync(pagesDir)) {
    console.log(`Scanning pages directory...`);
    scanDirectory(pagesDir);
  }

  // Display results
  console.log('\n' + '─'.repeat(60));
  console.log('Accessibility Audit Results:');
  console.log('─'.repeat(60));

  if (issues.error.length === 0 && issues.warning.length === 0) {
    console.log(`\n${colors.green}✅ No accessibility issues found!${colors.reset}`);
    return { success: true };
  }

  // Display errors
  if (issues.error.length > 0) {
    console.log(`\n${colors.red}❌ Errors (${issues.error.length}):${colors.reset}`);
    issues.error.forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   ${colors.red}${issue.message}${colors.reset}`);
      console.log(`   Context: ${issue.context}`);
    });
  }

  // Display warnings
  if (issues.warning.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings (${issues.warning.length}):${colors.reset}`);
    issues.warning.slice(0, 10).forEach((issue, index) => {
      console.log(`\n${index + 1}. ${issue.file}:${issue.line}`);
      console.log(`   ${colors.yellow}${issue.message}${colors.reset}`);
      console.log(`   Context: ${issue.context}`);
    });

    if (issues.warning.length > 10) {
      console.log(`\n   ... and ${issues.warning.length - 10} more warnings`);
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log('Summary:');
  console.log(`  Errors:   ${issues.error.length}`);
  console.log(`  Warnings: ${issues.warning.length}`);
  console.log('─'.repeat(60));

  // Recommendations
  console.log(`\n${colors.yellow}💡 Recommendations:${colors.reset}`);
  console.log('  - Add aria-label or aria-labelledby to interactive elements');
  console.log('  - Add alt text to all images');
  console.log('  - Ensure keyboard navigation support');
  console.log('  - Add role attributes where appropriate');
  console.log('  - Test with screen readers');
  console.log('  - Use semantic HTML elements');

  // Exit with error if critical issues found
  if (issues.error.length > 0) {
    console.log(`\n${colors.red}❌ Accessibility audit failed!${colors.reset}`);
    process.exit(1);
  }

  return {
    success: issues.error.length === 0,
    errors: issues.error.length,
    warnings: issues.warning.length,
  };
}

// Run if called directly
if (require.main === module) {
  auditAccessibility();
}

module.exports = { auditAccessibility };
