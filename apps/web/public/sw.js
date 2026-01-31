/**
 * Service Worker for Caching
 * Implements caching strategies for improved performance
 */

const CACHE_NAME = 'modele-app-v1';
const STATIC_CACHE_NAME = 'modele-static-v1';
const API_CACHE_NAME = 'modele-api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, fallback to network
  CACHE_FIRST: 'cache-first',
  // Network first, fallback to cache
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network only
  NETWORK_ONLY: 'network-only',
};

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== CACHE_NAME &&
              name !== STATIC_CACHE_NAME &&
              name !== API_CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Static assets - Cache First
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/static') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
    return;
  }

  // API requests - Network First with short cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE_NAME, 60000)); // 1 minute cache
    return;
  }

  // HTML pages - Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request, CACHE_NAME, 300000)); // 5 minute cache
    return;
  }

  // Default - Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 */
async function cacheFirst(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline page if available
    const offlinePage = await cache.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(
  request: Request,
  cacheName: string,
  maxAge: number = 300000
): Promise<Response> {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache with timestamp
      const cacheResponse = response.clone();
      cache.put(request, cacheResponse);
      return response;
    }
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback to cache
    const cached = await cache.match(request);
    if (cached) {
      // Check if cache is still fresh
      const cachedDate = cached.headers.get('sw-cached-date');
      if (cachedDate) {
        const age = Date.now() - parseInt(cachedDate);
        if (age < maxAge) {
          return cached;
        }
      } else {
        return cached;
      }
    }
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update in background
 */
async function staleWhileRevalidate(
  request: Request,
  cacheName: string
): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch fresh version in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached version if available, otherwise wait for network
  return cached || fetchPromise;
}

