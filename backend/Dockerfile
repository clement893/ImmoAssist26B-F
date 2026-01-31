# Multi-stage build for FastAPI backend
FROM python:3.11-slim AS base

# Set working directory
WORKDIR /app

# Install system dependencies including Node.js for API connection check scripts
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
FROM base AS deps
COPY requirements.txt* ./
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Production image
FROM base AS runner
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create non-root user
RUN groupadd --system --gid 1001 appuser && \
    useradd --system --uid 1001 --gid appuser appuser

# Copy dependencies and application
COPY --from=deps /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY . .

# Ensure scripts directory exists and make scripts executable
RUN mkdir -p /app/scripts && \
    chmod +x /app/scripts/*.js 2>/dev/null || true

# Change ownership
RUN chown -R appuser:appuser /app

# Ensure entrypoint.sh is executable
RUN chmod +x entrypoint.sh && \
    chown appuser:appuser entrypoint.sh

USER appuser

EXPOSE 8000

# Health check - uses PORT env var or defaults to 8000
# Note: HEALTHCHECK runs inside container, so it uses the same PORT as the app
# Use Python's urllib instead of requests for better reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD sh -c 'PORT=${PORT:-8000}; python -c "import urllib.request; import sys; r=urllib.request.urlopen(f\"http://localhost:{PORT}/api/v1/health\", timeout=5); sys.exit(0 if r.getcode()==200 else 1)"' || exit 1

# Use entrypoint.sh from the repo
ENTRYPOINT ["./entrypoint.sh"]

