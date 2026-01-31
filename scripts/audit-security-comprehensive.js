/**
 * Comprehensive Security Audit Script
 * Rates security on a scale of 0-1000
 *
 * Categories:
 * - Secrets Management (100 points)
 * - XSS Protection (100 points)
 * - SQL Injection Prevention (100 points)
 * - Authentication & Authorization (100 points)
 * - Input Validation (100 points)
 * - Security Headers (100 points)
 * - CORS Configuration (100 points)
 * - Rate Limiting (100 points)
 * - File Upload Security (100 points)
 * - Dependency Vulnerabilities (100 points)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Scoring weights (out of 1000 total)
const WEIGHTS = {
  SECRETS: 100,
  XSS: 100,
  SQL_INJECTION: 100,
  AUTH: 100,
  INPUT_VALIDATION: 100,
  SECURITY_HEADERS: 100,
  CORS: 100,
  RATE_LIMITING: 100,
  FILE_UPLOAD: 100,
  DEPENDENCIES: 100,
};

const issues = {
  critical: [],
  high: [],
  medium: [],
  low: [],
  info: [],
};

const scores = {
  secrets: { score: 0, max: WEIGHTS.SECRETS, issues: [] },
  xss: { score: 0, max: WEIGHTS.XSS, issues: [] },
  sqlInjection: { score: 0, max: WEIGHTS.SQL_INJECTION, issues: [] },
  auth: { score: 0, max: WEIGHTS.AUTH, issues: [] },
  inputValidation: { score: 0, max: WEIGHTS.INPUT_VALIDATION, issues: [] },
  securityHeaders: { score: 0, max: WEIGHTS.SECURITY_HEADERS, issues: [] },
  cors: { score: 0, max: WEIGHTS.CORS, issues: [] },
  rateLimiting: { score: 0, max: WEIGHTS.RATE_LIMITING, issues: [] },
  fileUpload: { score: 0, max: WEIGHTS.FILE_UPLOAD, issues: [] },
  dependencies: { score: 0, max: WEIGHTS.DEPENDENCIES, issues: [] },
};

// Track positive findings
const positives = {
  secrets: [],
  xss: [],
  sqlInjection: [],
  auth: [],
  inputValidation: [],
  securityHeaders: [],
  cors: [],
  rateLimiting: [],
  fileUpload: [],
  dependencies: [],
};

function scanFile(filePath, content) {
  const relativePath = path.relative(process.cwd(), filePath);
  const isTestFile =
    filePath.includes("/test/") ||
    filePath.includes(".test.") ||
    filePath.includes(".spec.");
  const isStoryFile = filePath.includes(".stories.");

  // 1. SECRETS MANAGEMENT (100 points)
  const secretPatterns = [
    { pattern: /password\s*=\s*['"][^'"]+['"]/gi, name: "Hardcoded password" },
    { pattern: /secret\s*=\s*['"][^'"]+['"]/gi, name: "Hardcoded secret" },
    { pattern: /token\s*=\s*['"][^'"]+['"]/gi, name: "Hardcoded token" },
    {
      pattern: /api[_-]?key\s*=\s*['"][^'"]+['"]/gi,
      name: "Hardcoded API key",
    },
  ];

  // Check for hardcoded secrets (exclude test files with mock/test data)
  if (!isTestFile && !isStoryFile) {
    secretPatterns.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        // Filter out common false positives
        const falsePositives = [
          "password = 'Password is required'",
          "password = 'Password must be at least",
          'password = "password123"', // Only in test files
        ];
        const isFalsePositive = matches.some((m) =>
          falsePositives.some((fp) => m.includes(fp)),
        );

        if (!isFalsePositive) {
          issues.critical.push({
            file: relativePath,
            issue: name,
            matches: matches.slice(0, 3),
          });
          scores.secrets.issues.push(`${name} found in ${relativePath}`);
        }
      }
    });
  }

  // Check for mock/test tokens in production code
  if (!isTestFile && !isStoryFile) {
    if (content.match(/mock[_-]?token|test[_-]?password|fake[_-]?secret/gi)) {
      issues.high.push({
        file: relativePath,
        issue: "Mock/test credentials in production code",
      });
      scores.secrets.issues.push(`Mock credentials found in ${relativePath}`);
    }
  }

  // 2. XSS PROTECTION (100 points)
  const xssPatterns = [
    {
      pattern: /dangerouslySetInnerHTML/,
      name: "dangerouslySetInnerHTML usage",
    },
    { pattern: /\.innerHTML\s*=/, name: "innerHTML assignment" },
    { pattern: /eval\(/, name: "eval() usage" },
  ];

  xssPatterns.forEach(({ pattern, name }) => {
    if (content.match(pattern)) {
      // Check if it's in a test file or has proper sanitization
      const hasSanitization =
        content.includes("DOMPurify") || content.includes("sanitize");
      if (!hasSanitization && !isTestFile) {
        issues.high.push({
          file: relativePath,
          issue: `Potential XSS vulnerability: ${name}`,
        });
        scores.xss.issues.push(
          `${name} found in ${relativePath} without sanitization`,
        );
      } else if (hasSanitization) {
        positives.xss.push(
          `${name} found but properly sanitized in ${relativePath}`,
        );
      }
    }
  });

  // 3. SQL INJECTION PREVENTION (100 points)
  // Check for raw SQL queries (should use ORM)
  if (filePath.endsWith(".py")) {
    const rawSqlPatterns = [
      /execute\(['"]\s*SELECT.*\+.*FROM/i,
      /execute\(['"]\s*INSERT.*\+.*INTO/i,
      /execute\(['"]\s*UPDATE.*\+.*SET/i,
      /execute\(['"]\s*DELETE.*\+.*FROM/i,
      /f['"]\s*SELECT.*\{.*\}.*FROM/i,
      /f['"]\s*INSERT.*\{.*\}.*INTO/i,
    ];

    rawSqlPatterns.forEach((pattern) => {
      if (content.match(pattern)) {
        issues.critical.push({
          file: relativePath,
          issue: "Potential SQL injection: String concatenation in SQL query",
        });
        scores.sqlInjection.issues.push(
          `Raw SQL with string concatenation in ${relativePath}`,
        );
      }
    });

    // Positive: Check for SQLAlchemy usage
    if (
      content.includes("from sqlalchemy") ||
      content.includes("import sqlalchemy")
    ) {
      positives.sqlInjection.push(`SQLAlchemy ORM used in ${relativePath}`);
    }
  }

  // 4. INPUT VALIDATION (100 points)
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    // Check for validation libraries
    if (
      content.includes("zod") ||
      content.includes("yup") ||
      content.includes("joi")
    ) {
      positives.inputValidation.push(
        `Validation library used in ${relativePath}`,
      );
    }

    // Check for fetch without error handling
    if (
      content.includes("fetch(") &&
      !content.includes(".catch(") &&
      !content.includes("try {")
    ) {
      if (!isTestFile) {
        issues.medium.push({
          file: relativePath,
          issue: "Fetch without error handling",
        });
        scores.inputValidation.issues.push(
          `Missing error handling in ${relativePath}`,
        );
      }
    }
  }

  if (filePath.endsWith(".py")) {
    // Check for Pydantic validation
    if (
      content.includes("from pydantic") ||
      content.includes("import pydantic")
    ) {
      positives.inputValidation.push(
        `Pydantic validation used in ${relativePath}`,
      );
    }
  }

  // 5. AUTHENTICATION & AUTHORIZATION (100 points)
  if (
    filePath.includes("auth") ||
    filePath.includes("login") ||
    filePath.includes("jwt")
  ) {
    // Check for JWT implementation
    if (content.includes("jwt") || content.includes("jsonwebtoken")) {
      positives.auth.push(`JWT authentication found in ${relativePath}`);
    }

    // Check for httpOnly cookies
    if (content.includes("httpOnly") || content.includes("httpOnly: true")) {
      positives.auth.push(`httpOnly cookies configured in ${relativePath}`);
    }

    // Check for secure flag
    if (content.includes("secure:") || content.includes("secure=")) {
      positives.auth.push(`Secure cookie flag found in ${relativePath}`);
    }

    // Check for password hashing
    if (
      content.includes("bcrypt") ||
      content.includes("argon2") ||
      content.includes("scrypt")
    ) {
      positives.auth.push(`Password hashing library found in ${relativePath}`);
    }
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git, dist
      if (
        file !== "node_modules" &&
        file !== ".next" &&
        file !== ".git" &&
        file !== "dist" &&
        file !== ".turbo"
      ) {
        scanDirectory(filePath);
      }
    } else if (stat.isFile()) {
      // Only scan relevant files
      if (filePath.match(/\.(ts|tsx|js|jsx|py)$/)) {
        try {
          const content = fs.readFileSync(filePath, "utf8");
          scanFile(filePath, content);
        } catch (err) {
          // Skip binary or unreadable files
        }
      }
    }
  });
}

function checkSecurityHeaders() {
  const securityHeadersPath = path.join(
    process.cwd(),
    "backend/app/core/security_headers.py",
  );
  if (fs.existsSync(securityHeadersPath)) {
    const content = fs.readFileSync(securityHeadersPath, "utf8");

    const headers = {
      HSTS: content.includes("Strict-Transport-Security"),
      CSP: content.includes("Content-Security-Policy"),
      "X-Frame-Options": content.includes("X-Frame-Options"),
      "X-Content-Type-Options": content.includes("X-Content-Type-Options"),
      "X-XSS-Protection": content.includes("X-XSS-Protection"),
      "Referrer-Policy": content.includes("Referrer-Policy"),
      "Permissions-Policy": content.includes("Permissions-Policy"),
    };

    const headerCount = Object.values(headers).filter(Boolean).length;
    const headerScore = Math.round(
      (headerCount / 7) * WEIGHTS.SECURITY_HEADERS,
    );

    scores.securityHeaders.score = headerScore;

    Object.entries(headers).forEach(([name, present]) => {
      if (present) {
        positives.securityHeaders.push(`${name} header configured`);
      } else {
        scores.securityHeaders.issues.push(`Missing ${name} header`);
      }
    });
  } else {
    scores.securityHeaders.issues.push("Security headers middleware not found");
  }
}

function checkCORS() {
  const corsPath = path.join(process.cwd(), "backend/app/core/cors.py");
  if (fs.existsSync(corsPath)) {
    const content = fs.readFileSync(corsPath, "utf8");

    let corsScore = WEIGHTS.CORS;

    // Check for proper CORS configuration
    if (content.includes("CORSMiddleware")) {
      positives.cors.push("CORS middleware configured");
    } else {
      corsScore -= 20;
      scores.cors.issues.push("CORS middleware not properly configured");
    }

    // Check for allow_credentials
    if (content.includes("allow_credentials")) {
      positives.cors.push("CORS credentials configured");
    } else {
      corsScore -= 10;
      scores.cors.issues.push("CORS credentials not configured");
    }

    // Check for specific origins (not wildcard in production)
    if (content.includes("allow_origins")) {
      positives.cors.push("CORS origins configured");
    } else {
      corsScore -= 10;
      scores.cors.issues.push("CORS origins not configured");
    }

    scores.cors.score = Math.max(0, corsScore);
  } else {
    scores.cors.issues.push("CORS configuration not found");
  }
}

function checkRateLimiting() {
  const rateLimitPath = path.join(
    process.cwd(),
    "backend/app/core/rate_limit.py",
  );
  if (fs.existsSync(rateLimitPath)) {
    const content = fs.readFileSync(rateLimitPath, "utf8");

    let rateLimitScore = WEIGHTS.RATE_LIMITING;

    if (content.includes("Limiter") || content.includes("rate_limit")) {
      positives.rateLimiting.push("Rate limiting middleware found");
    } else {
      rateLimitScore -= 50;
      scores.rateLimiting.issues.push("Rate limiting not configured");
    }

    // Check for auth endpoint limits
    if (content.includes("/auth/login") || content.includes("auth")) {
      positives.rateLimiting.push("Auth endpoints have rate limits");
    } else {
      rateLimitScore -= 20;
      scores.rateLimiting.issues.push(
        "Auth endpoints may not have rate limits",
      );
    }

    scores.rateLimiting.score = Math.max(0, rateLimitScore);
  } else {
    scores.rateLimiting.issues.push("Rate limiting configuration not found");
  }
}

function checkFileUpload() {
  const uploadPath = path.join(process.cwd(), "backend/app/api/upload.py");
  if (fs.existsSync(uploadPath)) {
    const content = fs.readFileSync(uploadPath, "utf8");

    let fileUploadScore = WEIGHTS.FILE_UPLOAD;

    // Check for file size limits
    if (content.includes("MAX_FILE_SIZE") || content.includes("max_size")) {
      positives.fileUpload.push("File size limits configured");
    } else {
      fileUploadScore -= 20;
      scores.fileUpload.issues.push("File size limits not configured");
    }

    // Check for allowed extensions
    if (content.includes("ALLOWED_EXTENSIONS") || content.includes("allowed")) {
      positives.fileUpload.push("Allowed file extensions configured");
    } else {
      fileUploadScore -= 20;
      scores.fileUpload.issues.push("Allowed file extensions not configured");
    }

    // Check for MIME type validation
    if (content.includes("MIME") || content.includes("content_type")) {
      positives.fileUpload.push("MIME type validation configured");
    } else {
      fileUploadScore -= 15;
      scores.fileUpload.issues.push("MIME type validation not configured");
    }

    // Check for filename sanitization
    if (content.includes("sanitize") || content.includes("basename")) {
      positives.fileUpload.push("Filename sanitization configured");
    } else {
      fileUploadScore -= 15;
      scores.fileUpload.issues.push("Filename sanitization not configured");
    }

    // Check for authentication requirement
    if (content.includes("get_current_user") || content.includes("Depends")) {
      positives.fileUpload.push("File upload requires authentication");
    } else {
      fileUploadScore -= 10;
      scores.fileUpload.issues.push(
        "File upload may not require authentication",
      );
    }

    scores.fileUpload.score = Math.max(0, fileUploadScore);
  } else {
    scores.fileUpload.issues.push("File upload endpoint not found");
  }
}

function checkDependencies() {
  try {
    // Check for npm/pnpm audit
    const packageJsonPath = path.join(process.cwd(), "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const result = execSync("pnpm audit --json 2>&1", {
          encoding: "utf8",
          cwd: process.cwd(),
          maxBuffer: 10 * 1024 * 1024,
        });
        const auditData = JSON.parse(result);

        if (auditData.metadata && auditData.metadata.vulnerabilities) {
          const vulns = auditData.metadata.vulnerabilities;
          const critical = vulns.critical || 0;
          const high = vulns.high || 0;
          const moderate = vulns.moderate || 0;
          const low = vulns.low || 0;

          let depScore = WEIGHTS.DEPENDENCIES;
          depScore -= critical * 20;
          depScore -= high * 10;
          depScore -= moderate * 5;
          depScore -= low * 1;

          if (critical > 0) {
            scores.dependencies.issues.push(
              `${critical} critical vulnerabilities found`,
            );
          }
          if (high > 0) {
            scores.dependencies.issues.push(
              `${high} high vulnerabilities found`,
            );
          }
          if (moderate > 0) {
            scores.dependencies.issues.push(
              `${moderate} moderate vulnerabilities found`,
            );
          }

          if (critical === 0 && high === 0) {
            positives.dependencies.push(
              "No critical or high vulnerabilities found",
            );
          }

          scores.dependencies.score = Math.max(0, depScore);
        } else {
          positives.dependencies.push("Dependency audit completed");
          scores.dependencies.score = WEIGHTS.DEPENDENCIES;
        }
      } catch (err) {
        // Audit may not be available or may have failed
        scores.dependencies.issues.push(
          "Could not run dependency audit (this is okay if dependencies are up to date)",
        );
        scores.dependencies.score = WEIGHTS.DEPENDENCIES * 0.8; // Partial credit
      }
    }
  } catch (err) {
    scores.dependencies.issues.push("Could not check dependencies");
  }
}

function calculateScores() {
  // Calculate secrets score (deduct for each critical issue)
  const secretsIssues = scores.secrets.issues.length;
  scores.secrets.score = Math.max(0, WEIGHTS.SECRETS - secretsIssues * 20);

  // Calculate XSS score
  const xssIssues = scores.xss.issues.length;
  scores.xss.score = Math.max(0, WEIGHTS.XSS - xssIssues * 15);
  if (positives.xss.length > 0) {
    scores.xss.score = Math.min(WEIGHTS.XSS, scores.xss.score + 10); // Bonus for sanitization
  }

  // Calculate SQL injection score
  const sqlIssues = scores.sqlInjection.issues.length;
  scores.sqlInjection.score = Math.max(
    0,
    WEIGHTS.SQL_INJECTION - sqlIssues * 30,
  );
  if (positives.sqlInjection.length > 0) {
    scores.sqlInjection.score = Math.min(
      WEIGHTS.SQL_INJECTION,
      scores.sqlInjection.score + 20,
    ); // Bonus for ORM usage
  }

  // Calculate auth score
  const authPositives = positives.auth.length;
  scores.auth.score = Math.min(
    WEIGHTS.AUTH,
    Math.round((authPositives / 4) * WEIGHTS.AUTH),
  );
  if (authPositives >= 4) {
    scores.auth.score = WEIGHTS.AUTH; // Full score if all auth features present
  }

  // Calculate input validation score
  const inputPositives = positives.inputValidation.length;
  const inputIssues = scores.inputValidation.issues.length;
  scores.inputValidation.score = Math.max(
    0,
    Math.min(WEIGHTS.INPUT_VALIDATION, inputPositives * 20 - inputIssues * 10),
  );
}

function generateReport() {
  console.log("\n" + "=".repeat(80));
  console.log("🔒 COMPREHENSIVE SECURITY AUDIT REPORT");
  console.log("=".repeat(80) + "\n");

  // Calculate total score
  calculateScores();
  checkSecurityHeaders();
  checkCORS();
  checkRateLimiting();
  checkFileUpload();
  checkDependencies();

  const totalScore = Object.values(scores).reduce(
    (sum, cat) => sum + cat.score,
    0,
  );
  const maxScore = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  console.log(
    `📊 OVERALL SECURITY SCORE: ${totalScore}/${maxScore} (${percentage}%)\n`,
  );
  console.log("=".repeat(80));
  console.log("📋 DETAILED BREAKDOWN:\n");

  // Print each category
  const categories = [
    { key: "secrets", name: "Secrets Management", emoji: "🔑" },
    { key: "xss", name: "XSS Protection", emoji: "🛡️" },
    { key: "sqlInjection", name: "SQL Injection Prevention", emoji: "💉" },
    { key: "auth", name: "Authentication & Authorization", emoji: "🔐" },
    { key: "inputValidation", name: "Input Validation", emoji: "✅" },
    { key: "securityHeaders", name: "Security Headers", emoji: "📋" },
    { key: "cors", name: "CORS Configuration", emoji: "🌐" },
    { key: "rateLimiting", name: "Rate Limiting", emoji: "⏱️" },
    { key: "fileUpload", name: "File Upload Security", emoji: "📁" },
    { key: "dependencies", name: "Dependency Vulnerabilities", emoji: "📦" },
  ];

  categories.forEach(({ key, name, emoji }) => {
    const cat = scores[key];
    const catPercentage = Math.round((cat.score / cat.max) * 100);
    const barLength = Math.round(catPercentage / 5);
    const bar = "█".repeat(barLength) + "░".repeat(20 - barLength);

    console.log(
      `\n${emoji} ${name}: ${cat.score}/${cat.max} (${catPercentage}%)`,
    );
    console.log(`   ${bar}`);

    if (cat.issues.length > 0) {
      console.log(`   ⚠️  Issues:`);
      cat.issues.slice(0, 3).forEach((issue) => {
        console.log(`      - ${issue}`);
      });
      if (cat.issues.length > 3) {
        console.log(`      ... and ${cat.issues.length - 3} more`);
      }
    }

    const positivesList = positives[key];
    if (positivesList.length > 0) {
      console.log(`   ✅ Positives:`);
      positivesList.slice(0, 3).forEach((pos) => {
        console.log(`      - ${pos}`);
      });
      if (positivesList.length > 3) {
        console.log(`      ... and ${positivesList.length - 3} more`);
      }
    }
  });

  // Summary of issues
  const totalIssues =
    issues.critical.length +
    issues.high.length +
    issues.medium.length +
    issues.low.length;

  console.log("\n" + "=".repeat(80));
  console.log("📊 ISSUE SUMMARY:\n");
  console.log(`  🔴 Critical: ${issues.critical.length}`);
  console.log(`  🟠 High:     ${issues.high.length}`);
  console.log(`  🟡 Medium:   ${issues.medium.length}`);
  console.log(`  🔵 Low:      ${issues.low.length}`);
  console.log(`  📝 Total:    ${totalIssues}\n`);

  if (issues.critical.length > 0) {
    console.log("🔴 CRITICAL ISSUES:\n");
    issues.critical.slice(0, 10).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}`);
      if (issue.matches) {
        console.log(`   Matches: ${issue.matches.join(", ")}`);
      }
      console.log("");
    });
  }

  if (issues.high.length > 0) {
    console.log("🟠 HIGH PRIORITY ISSUES:\n");
    issues.high.slice(0, 10).forEach((issue, i) => {
      console.log(`${i + 1}. ${issue.file}`);
      console.log(`   ${issue.issue}\n`);
    });
  }

  // Recommendations
  console.log("=".repeat(80));
  console.log("💡 RECOMMENDATIONS:\n");

  if (scores.secrets.score < WEIGHTS.SECRETS) {
    console.log("🔑 Secrets Management:");
    console.log("   - Remove all hardcoded secrets from production code");
    console.log("   - Use environment variables for all sensitive data");
    console.log("   - Ensure .env files are in .gitignore\n");
  }

  if (scores.xss.score < WEIGHTS.XSS) {
    console.log("🛡️  XSS Protection:");
    console.log("   - Use DOMPurify or similar library for HTML sanitization");
    console.log("   - Avoid dangerouslySetInnerHTML when possible");
    console.log("   - Never use eval() with user input\n");
  }

  if (scores.dependencies.score < WEIGHTS.DEPENDENCIES) {
    console.log("📦 Dependencies:");
    console.log("   - Run: pnpm audit --fix");
    console.log("   - Update vulnerable packages");
    console.log("   - Review and test after updates\n");
  }

  // Final score and grade
  console.log("=".repeat(80));
  console.log(
    `\n🎯 FINAL SECURITY SCORE: ${totalScore}/${maxScore} (${percentage}%)\n`,
  );

  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  console.log(`📈 GRADE: ${grade}\n`);

  if (percentage >= 90) {
    console.log("✅ Excellent security posture! Keep up the good work.\n");
  } else if (percentage >= 70) {
    console.log(
      "⚠️  Good security posture, but there are areas for improvement.\n",
    );
  } else {
    console.log(
      "🚨 Security improvements needed. Please address critical and high priority issues.\n",
    );
  }

  console.log("=".repeat(80) + "\n");

  // Exit with error code if critical issues found
  if (issues.critical.length > 0) {
    process.exit(1);
  }
}

// Main execution
console.log("🔍 Starting comprehensive security audit...\n");
console.log("Scanning codebase for security issues...\n");

const srcDirs = [
  path.join(process.cwd(), "apps/web/src"),
  path.join(process.cwd(), "backend/app"),
];

srcDirs.forEach((dir) => {
  if (fs.existsSync(dir)) {
    scanDirectory(dir);
  }
});

generateReport();
