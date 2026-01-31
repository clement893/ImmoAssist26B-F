/**
 * k6 Load Testing Script
 * Performance and load testing for the application
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run k6-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 10 }, // Stay at 10 users
    { duration: '30s', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 50 }, // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'], // Custom error rate < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_URL = __ENV.API_URL || 'http://localhost:8000';

export default function () {
  // Test homepage
  const homeResponse = http.get(`${BASE_URL}/`);
  const homeCheck = check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(!homeCheck);
  responseTime.add(homeResponse.timings.duration);
  sleep(1);

  // Test API health endpoint
  const healthResponse = http.get(`${API_URL}/api/v1/health/`);
  const healthCheck = check(healthResponse, {
    'health endpoint status is 200': (r) => r.status === 200,
    'health endpoint response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(!healthCheck);
  responseTime.add(healthResponse.timings.duration);
  sleep(1);

  // Test components page
  const componentsResponse = http.get(`${BASE_URL}/components`);
  const componentsCheck = check(componentsResponse, {
    'components page status is 200': (r) => r.status === 200,
    'components page response time < 1000ms': (r) => r.timings.duration < 1000,
  });
  errorRate.add(!componentsCheck);
  responseTime.add(componentsResponse.timings.duration);
  sleep(2);
}

export function handleSummary(data) {
  return {
    'load-test-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}==================\n\n`;

  // Metrics summary
  summary += `${indent}Metrics:\n`;
  summary += `${indent}  - Total Requests: ${data.metrics.http_reqs.values.count}\n`;
  summary += `${indent}  - Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%\n`;
  summary += `${indent}  - Avg Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += `${indent}  - P95 Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `${indent}  - P99 Response Time: ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;

  // Thresholds
  summary += `\n${indent}Thresholds:\n`;
  Object.keys(data.metrics).forEach((metric) => {
    const metricData = data.metrics[metric];
    if (metricData.thresholds) {
      Object.keys(metricData.thresholds).forEach((threshold) => {
        const passed = metricData.thresholds[threshold].ok;
        const status = passed ? '✓' : '✗';
        summary += `${indent}  ${status} ${metric}: ${threshold}\n`;
      });
    }
  });

  return summary;
}
