/**
 * Webpack plugin to create missing CSS file during build
 * This handles the case where some dependencies try to access
 * .next/browser/default-stylesheet.css during static generation
 */
const fs = require('fs');
const path = require('path');

class CreateMissingCssPlugin {
  apply(compiler) {
    // Create CSS file at multiple possible locations
    const createCssFile = (basePath) => {
      const possiblePaths = [
        path.join(basePath, 'browser', 'default-stylesheet.css'),
        path.join(basePath, '.next', 'browser', 'default-stylesheet.css'),
        path.join(process.cwd(), 'apps', 'web', '.next', 'browser', 'default-stylesheet.css'),
        path.join(process.cwd(), '.next', 'browser', 'default-stylesheet.css'),
      ];

      possiblePaths.forEach((cssPath) => {
        try {
          const cssDir = path.dirname(cssPath);

          // Create directory if it doesn't exist
          if (!fs.existsSync(cssDir)) {
            fs.mkdirSync(cssDir, { recursive: true });
          }

          // Create empty CSS file if it doesn't exist
          if (!fs.existsSync(cssPath)) {
            fs.writeFileSync(
              cssPath,
              '/* Empty stylesheet - created by webpack plugin */\n',
              'utf8'
            );
          }
        } catch (error) {
          // Silently ignore errors for paths that don't exist
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Could not create CSS file at ${cssPath}:`, error.message);
          }
        }
      });
    };

    compiler.hooks.beforeCompile.tap('CreateMissingCssPlugin', () => {
      const outputPath = compiler.options.output?.path || compiler.context || process.cwd();
      createCssFile(outputPath);
    });

    compiler.hooks.afterEmit.tap('CreateMissingCssPlugin', (compilation) => {
      const outputPath =
        compilation.outputOptions?.path || compilation.compiler.context || process.cwd();
      createCssFile(outputPath);
    });

    // Also try to create it during the compilation phase
    compiler.hooks.compilation.tap('CreateMissingCssPlugin', () => {
      const outputPath = compiler.options.output?.path || compiler.context || process.cwd();
      createCssFile(outputPath);
    });
  }
}

module.exports = CreateMissingCssPlugin;
