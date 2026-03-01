'use client';

import { useEffect } from 'react';

const CHUNK_RELOAD_KEY = 'chunk_load_error_reload';

/**
 * Handles ChunkLoadError / ERR_HTTP2_PROTOCOL_ERROR after deploy:
 * - CDN or proxy may serve stale/wrong content for a chunk URL
 * - One full reload fetches fresh HTML and assets
 * Reload is done at most once per session to avoid loops.
 */
export default function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handleError = (e: ErrorEvent | PromiseRejectionEvent) => {
      const message =
        (e instanceof PromiseRejectionEvent
          ? (e.reason?.message ?? String(e.reason))
          : e.message) ?? '';
      const isChunkError =
        message.includes('ChunkLoadError') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk') ||
        message.includes('ERR_HTTP2_PROTOCOL_ERROR') ||
        message.includes('Refused to execute script') ||
        (message.includes('MIME type') && message.includes('text/css'));

      if (!isChunkError) return;
      if (typeof sessionStorage === 'undefined') return;
      if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return;

      sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
      window.location.reload();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
