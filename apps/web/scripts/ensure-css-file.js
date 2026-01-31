/**
 * Script to ensure default-stylesheet.css exists before build
 * This prevents build errors when dependencies try to access this file
 * during static page generation
 */
const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', '.next', 'browser', 'default-stylesheet.css');
const cssDir = path.dirname(cssPath);

// Create directory if it doesn't exist
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
  console.log(`Created directory: ${cssDir}`);
}

// Create empty CSS file if it doesn't exist
if (!fs.existsSync(cssPath)) {
  fs.writeFileSync(cssPath, '/* Empty stylesheet - created by ensure-css-file script */\n', 'utf8');
  console.log(`Created file: ${cssPath}`);
} else {
  console.log(`File already exists: ${cssPath}`);
}
