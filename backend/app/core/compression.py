"""
HTTP Compression Middleware
Enhanced GZip/Brotli compression for API responses with streaming support
"""

from fastapi import Request
from fastapi.responses import Response, StreamingResponse
from starlette.middleware.base import BaseHTTPMiddleware
import gzip
import brotli
from typing import Callable, AsyncGenerator, Optional
from app.core.logging import logger


class CompressionMiddleware(BaseHTTPMiddleware):
    """Enhanced middleware for response compression (GZip/Brotli) with streaming support"""

    def __init__(self, app, min_size: int = 1024, compress_level: int = 6, use_brotli: bool = True):
        super().__init__(app)
        self.min_size = min_size  # Minimum size to compress (bytes)
        self.compress_level = compress_level  # Compression level (1-9)
        self.use_brotli = use_brotli  # Use Brotli if available
    
    def _supports_compression(self, accept_encoding: str) -> tuple[bool, bool]:
        """Check if client supports compression"""
        accept_encoding_lower = accept_encoding.lower()
        supports_gzip = "gzip" in accept_encoding_lower
        supports_brotli = "br" in accept_encoding_lower and self.use_brotli
        return supports_gzip, supports_brotli
    
    def _compress_gzip(self, data: bytes) -> bytes:
        """Compress data using GZip"""
        return gzip.compress(data, compresslevel=self.compress_level)
    
    def _compress_brotli(self, data: bytes) -> Optional[bytes]:
        """Compress data using Brotli"""
        try:
            return brotli.compress(data, quality=self.compress_level)
        except Exception:
            return None
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check if client accepts compression
        accept_encoding = request.headers.get("Accept-Encoding", "")
        supports_gzip, supports_brotli = self._supports_compression(accept_encoding)
        
        # Call the next middleware/endpoint
        response = await call_next(request)
        
        # Skip compression for certain status codes
        if response.status_code >= 400:
            return response
        
        # Skip compression for streaming responses or responses without body
        if not hasattr(response, 'body'):
            return response
        
        # Get content type
        content_type = response.headers.get("Content-Type", "")
        
        # Only compress JSON, text, and JavaScript responses
        compressible_types = [
            "application/json",
            "text/",
            "application/javascript",
            "application/xml",
            "application/xhtml+xml",
        ]
        
        if not any(ct in content_type for ct in compressible_types):
            return response
        
        # Skip if already compressed
        if response.headers.get("Content-Encoding"):
            return response
        
        try:
            body = response.body
            
            # Skip if too small (compression overhead not worth it)
            if len(body) < self.min_size:
                return response
            
            # Choose compression algorithm (Brotli preferred, fallback to GZip)
            compressed_body: Optional[bytes] = None
            encoding: Optional[str] = None
            
            if supports_brotli:
                compressed_body = self._compress_brotli(body)
                if compressed_body and len(compressed_body) < len(body):
                    encoding = "br"
            
            if not encoding and supports_gzip:
                compressed_body = self._compress_gzip(body)
                if compressed_body and len(compressed_body) < len(body):
                    encoding = "gzip"
            
            # Apply compression if beneficial
            if encoding and compressed_body:
                # For very large responses (>500KB), use streaming
                if len(body) > 500 * 1024:
                    async def compress_stream() -> AsyncGenerator[bytes, None]:
                        if encoding == "br":
                            compressor = brotli.Compressor(quality=self.compress_level)
                        else:
                            compressor = gzip.GzipFile(mode='wb', compresslevel=self.compress_level)
                        
                        chunk_size = 8192
                        for i in range(0, len(body), chunk_size):
                            chunk = body[i:i + chunk_size]
                            if encoding == "br":
                                compressed_chunk = compressor.process(chunk)
                            else:
                                compressed_chunk = compressor.compress(chunk)
                            
                            if compressed_chunk:
                                yield compressed_chunk
                        
                        # Flush remaining data
                        if encoding == "br":
                            final = compressor.finish()
                        else:
                            final = compressor.flush()
                        
                        if final:
                            yield final
                    
                    return StreamingResponse(
                        compress_stream(),
                        status_code=response.status_code,
                        headers={
                            **response.headers,
                            "Content-Encoding": encoding,
                            "Vary": "Accept-Encoding",
                        },
                        media_type=content_type
                    )
                else:
                    # In-memory compression for smaller responses
                    response.body = compressed_body
                    response.headers["Content-Encoding"] = encoding
                    response.headers["Content-Length"] = str(len(compressed_body))
                    
                    # Update Vary header
                    vary = response.headers.get("Vary", "")
                    if "Accept-Encoding" not in vary:
                        response.headers["Vary"] = (
                            f"{vary}, Accept-Encoding".strip(", ") if vary else "Accept-Encoding"
                        )
                    
                    logger.debug(
                        f"Compressed response: {len(body)} -> {len(compressed_body)} bytes "
                        f"({(1 - len(compressed_body)/len(body))*100:.1f}% reduction)"
                    )
        
        except Exception as e:
            logger.error(f"Compression error: {e}")
            # Return uncompressed response on error
        
        return response
