#!/usr/bin/env node

/**
 * Deployment Health Check Script (Node.js version)
 * Verifies deployment health after deployment
 * Usage: node scripts/deployment/health-check.js <backend_url> [frontend_url]
 */

const https = require("https");
const http = require("http");
const { URL } = require("url");

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 5000; // 5 seconds
const TIMEOUT = 10000; // 10 seconds

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === "https:" ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      timeout: options.timeout || TIMEOUT,
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

async function checkEndpoint(url, endpointName, expectedStatus = 200) {
  try {
    const response = await makeRequest(url);

    if (response.statusCode === expectedStatus) {
      log(`✅ ${endpointName}: Healthy (HTTP ${response.statusCode})`, "green");
      return { success: true, response };
    } else {
      log(`❌ ${endpointName}: Unhealthy (HTTP ${response.statusCode})`, "red");
      if (response.body) {
        console.log(`   Response: ${response.body.substring(0, 200)}`);
      }
      return { success: false, response };
    }
  } catch (error) {
    log(`❌ ${endpointName}: Error - ${error.message}`, "red");
    return { success: false, error: error.message };
  }
}

async function waitForService(url, serviceName) {
  log(`⏳ Waiting for ${serviceName} to be ready...`, "blue");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await makeRequest(url);
      log(`✅ ${serviceName} is ready`, "green");
      return true;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        log(
          `   Attempt ${attempt}/${MAX_RETRIES} - Retrying in ${RETRY_INTERVAL / 1000}s...`,
          "yellow",
        );
        await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      }
    }
  }

  log(
    `❌ ${serviceName} failed to become ready after ${MAX_RETRIES} attempts`,
    "red",
  );
  return false;
}

async function main() {
  const backendUrl = process.argv[2] || "http://localhost:8000";
  const frontendUrl = process.argv[3] || "";

  log("🔍 Starting deployment health checks...", "blue");
  log(`Backend URL: ${backendUrl}`);
  if (frontendUrl) {
    log(`Frontend URL: ${frontendUrl}`);
  }
  console.log("");

  // Check backend health endpoints
  log("📊 Checking Backend Health Endpoints...", "blue");

  // Basic health check
  const basicHealth = await checkEndpoint(
    `${backendUrl}/api/v1/health/`,
    "Basic Health",
  );
  if (!basicHealth.success) {
    log("❌ Basic health check failed", "red");
    process.exit(1);
  }

  // Readiness check
  const readiness = await checkEndpoint(
    `${backendUrl}/api/v1/health/ready`,
    "Readiness Check",
  );
  if (!readiness.success) {
    log("❌ Readiness check failed - service not ready", "red");
    process.exit(1);
  }

  // Liveness check
  const liveness = await checkEndpoint(
    `${backendUrl}/api/v1/health/live`,
    "Liveness Check",
  );
  if (!liveness.success) {
    log("⚠️  Liveness check failed - service may be restarting", "yellow");
  }

  // Detailed health check
  console.log("");
  log("📋 Detailed Health Check:", "blue");
  try {
    const detailedResponse = await makeRequest(
      `${backendUrl}/api/v1/health/detailed`,
    );
    const healthData = JSON.parse(detailedResponse.body);

    if (healthData.status === "healthy") {
      log("✅ All components healthy", "green");
      console.log(JSON.stringify(healthData, null, 2));
    } else {
      log("❌ Some components unhealthy", "red");
      console.log(JSON.stringify(healthData, null, 2));
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Detailed health check failed: ${error.message}`, "red");
    process.exit(1);
  }

  // Check frontend if URL provided
  if (frontendUrl) {
    console.log("");
    log("🌐 Checking Frontend...", "blue");

    if (await waitForService(frontendUrl, "Frontend")) {
      const frontendCheck = await checkEndpoint(
        frontendUrl,
        "Frontend Homepage",
      );
      if (frontendCheck.success) {
        log("✅ Frontend is healthy", "green");
      } else {
        log("⚠️  Frontend health check failed", "yellow");
      }
    } else {
      log("❌ Frontend failed to become ready", "red");
      process.exit(1);
    }
  }

  console.log("");
  log("✅ All health checks passed!", "green");
  log("🚀 Deployment verified successfully", "green");
}

main().catch((error) => {
  log(`❌ Health check failed: ${error.message}`, "red");
  process.exit(1);
});
