/**
 * Script to find and report all 'any' type usage
 * This helps track progress on removing 'any' types
 */

const fs = require('fs');
const path = require('path');

function findAnyUsage(dir, results = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
      findAnyUsage(filePath, results);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        if (
          line.includes(': any') ||
          line.includes('as any') ||
          line.includes('<any>') ||
          line.includes('any[') ||
          line.includes('any|') ||
          line.includes('any&')
        ) {
          // Skip test files and node_modules
          if (
            !filePath.includes('test') &&
            !filePath.includes('spec') &&
            !filePath.includes('node_modules')
          ) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim(),
            });
          }
        }
      });
    }
  }

  return results;
}

const srcDir = path.join(__dirname, '../src');
const results = findAnyUsage(srcDir);

console.log(`Found ${results.length} instances of 'any' type usage:\n`);
results.forEach((r, i) => {
  console.log(`${i + 1}. ${r.file}:${r.line}`);
  console.log(`   ${r.content}\n`);
});
