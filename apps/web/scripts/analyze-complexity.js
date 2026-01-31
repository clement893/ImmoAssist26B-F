#!/usr/bin/env node

/**
 * Code Complexity Analysis Script
 * Analyzes code complexity and generates a report
 */

const fs = require('fs');
const path = require('path');

// Complexity thresholds
const THRESHOLDS = {
  complexity: 10, // Warning at 10, error at 15
  maxLines: 300,
  maxFunctionLines: 50,
  maxDepth: 4,
  maxParams: 5,
};

const issues = {
  highComplexity: [],
  longFiles: [],
  longFunctions: [],
  deepNesting: [],
  manyParams: [],
};

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const relativePath = path.relative(process.cwd(), filePath);

  // File length check
  if (lines.length > THRESHOLDS.maxLines) {
    issues.longFiles.push({
      file: relativePath,
      lines: lines.length,
      threshold: THRESHOLDS.maxLines,
    });
  }

  // Analyze functions
  let inFunction = false;
  let functionStart = 0;
  let functionName = '';
  let depth = 0;
  let paramCount = 0;
  let complexity = 1; // Base complexity

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect function start
    if (
      trimmed.match(
        /^(export\s+)?(async\s+)?(function|const\s+\w+\s*=\s*(async\s+)?\(|const\s+\w+\s*:\s*\(/
      )
    ) {
      inFunction = true;
      functionStart = i;
      functionName =
        trimmed.match(/(?:function\s+(\w+)|const\s+(\w+)|(\w+)\s*[:=])/)?.[1] || `anonymous_${i}`;
      depth = 0;
      complexity = 1;

      // Count parameters
      const paramMatch = line.match(/\(([^)]*)\)/);
      if (paramMatch) {
        paramCount = paramMatch[1].split(',').filter((p) => p.trim()).length;
      }
    }

    if (inFunction) {
      // Count nesting
      if (trimmed.includes('{')) depth++;
      if (trimmed.includes('}')) depth--;

      // Count complexity factors
      if (trimmed.match(/(if|else if|while|for|switch|catch|\?\s*:)/)) {
        complexity++;
      }
      if (trimmed.match(/(&&|\|\|)/)) {
        complexity += 0.5;
      }

      // Function end
      if (trimmed === '}' && depth === 0 && inFunction) {
        const functionLines = i - functionStart;

        // Check function length
        if (functionLines > THRESHOLDS.maxFunctionLines) {
          issues.longFunctions.push({
            file: relativePath,
            function: functionName,
            lines: functionLines,
            threshold: THRESHOLDS.maxFunctionLines,
            line: functionStart + 1,
          });
        }

        // Check complexity
        if (complexity > THRESHOLDS.complexity) {
          issues.highComplexity.push({
            file: relativePath,
            function: functionName,
            complexity: Math.round(complexity * 10) / 10,
            threshold: THRESHOLDS.complexity,
            line: functionStart + 1,
          });
        }

        // Check nesting depth
        const maxDepth = Math.max(
          ...lines.slice(functionStart, i).map((l) => {
            let d = 0;
            let maxD = 0;
            for (const char of l) {
              if (char === '{') d++;
              if (char === '}') d--;
              maxD = Math.max(maxD, d);
            }
            return maxD;
          })
        );

        if (maxDepth > THRESHOLDS.maxDepth) {
          issues.deepNesting.push({
            file: relativePath,
            function: functionName,
            depth: maxDepth,
            threshold: THRESHOLDS.maxDepth,
            line: functionStart + 1,
          });
        }

        // Check parameter count
        if (paramCount > THRESHOLDS.maxParams) {
          issues.manyParams.push({
            file: relativePath,
            function: functionName,
            params: paramCount,
            threshold: THRESHOLDS.maxParams,
            line: functionStart + 1,
          });
        }

        inFunction = false;
        complexity = 1;
        paramCount = 0;
      }
    }
  }
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
      file.name === 'build' ||
      file.name === 'coverage'
    ) {
      continue;
    }

    if (file.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
      try {
        analyzeFile(filePath);
      } catch (error) {
        console.warn(`Failed to analyze ${filePath}:`, error.message);
      }
    }
  }
}

function generateReport() {
  console.log('\n📊 Code Complexity Analysis Report\n');
  console.log('='.repeat(60));

  const totalIssues =
    issues.highComplexity.length +
    issues.longFiles.length +
    issues.longFunctions.length +
    issues.deepNesting.length +
    issues.manyParams.length;

  if (totalIssues === 0) {
    console.log('\n✅ No complexity issues found!\n');
    return { success: true };
  }

  // High complexity
  if (issues.highComplexity.length > 0) {
    console.log(`\n⚠️  High Complexity Functions (${issues.highComplexity.length}):`);
    issues.highComplexity.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.function}`);
      console.log(`    Complexity: ${issue.complexity} (threshold: ${issue.threshold})`);
    });
    if (issues.highComplexity.length > 10) {
      console.log(`  ... and ${issues.highComplexity.length - 10} more`);
    }
  }

  // Long files
  if (issues.longFiles.length > 0) {
    console.log(`\n⚠️  Long Files (${issues.longFiles.length}):`);
    issues.longFiles.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}: ${issue.lines} lines (threshold: ${issue.threshold})`);
    });
  }

  // Long functions
  if (issues.longFunctions.length > 0) {
    console.log(`\n⚠️  Long Functions (${issues.longFunctions.length}):`);
    issues.longFunctions.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.function}`);
      console.log(`    ${issue.lines} lines (threshold: ${issue.threshold})`);
    });
  }

  // Deep nesting
  if (issues.deepNesting.length > 0) {
    console.log(`\n⚠️  Deep Nesting (${issues.deepNesting.length}):`);
    issues.deepNesting.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.function}`);
      console.log(`    Depth: ${issue.depth} (threshold: ${issue.threshold})`);
    });
  }

  // Many parameters
  if (issues.manyParams.length > 0) {
    console.log(`\n⚠️  Many Parameters (${issues.manyParams.length}):`);
    issues.manyParams.slice(0, 10).forEach((issue) => {
      console.log(`  ${issue.file}:${issue.line} - ${issue.function}`);
      console.log(`    ${issue.params} parameters (threshold: ${issue.threshold})`);
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 Summary: ${totalIssues} complexity issues found`);
  console.log('\n💡 Recommendations:');
  console.log('  - Break down complex functions into smaller ones');
  console.log('  - Extract reusable logic into utilities');
  console.log('  - Reduce nesting depth with early returns');
  console.log('  - Use configuration objects for many parameters');
  console.log('  - Consider splitting large files');

  return { success: totalIssues === 0, issues: totalIssues };
}

// Main execution
const srcDir = path.join(process.cwd(), 'src');
if (fs.existsSync(srcDir)) {
  scanDirectory(srcDir);
  const result = generateReport();
  process.exit(result.success ? 0 : 1);
} else {
  console.error('Error: src directory not found');
  process.exit(1);
}
