/**
 * Request Signing Utilities
 * Client-side utilities for signing API requests
 */

import CryptoJS from 'crypto-js';

export interface SigningConfig {
  secretKey: string;
  headerName?: string;
  timestampHeader?: string;
}

/**
 * Compute request signature
 */
export function computeSignature(
  method: string,
  path: string,
  body: string,
  timestamp: string,
  secretKey: string
): string {
  // Create signature string: method + path + body + timestamp
  const signatureString = `${method}${path}${body}${timestamp}`;

  // Compute HMAC-SHA256
  const signature = CryptoJS.HmacSHA256(signatureString, secretKey).toString(CryptoJS.enc.Hex);

  return signature;
}

/**
 * Create signed headers for a request
 */
export function createSignedHeaders(
  method: string,
  path: string,
  body: string,
  config: SigningConfig
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = computeSignature(method, path, body, timestamp, config.secretKey);

  return {
    [config.headerName || 'X-Signature']: signature,
    [config.timestampHeader || 'X-Timestamp']: timestamp,
  };
}

/**
 * Add signing to fetch request
 */
export async function signedFetch(
  url: string,
  options: RequestInit = {},
  config: SigningConfig
): Promise<Response> {
  try {
    const method = options.method || 'GET';
    const path = new URL(url).pathname;
    const body = options.body
      ? typeof options.body === 'string'
        ? options.body
        : JSON.stringify(options.body)
      : '';

    const signedHeaders = createSignedHeaders(method, path, body, config);

    const headers = {
      ...options.headers,
      ...signedHeaders,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is ok, throw error if not
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error: unknown) {
    // Re-throw with context for better error handling upstream
    if (error instanceof Error) {
      throw new Error(`Signed fetch failed for ${url}: ${error.message}`);
    }
    throw error;
  }
}
