#!/bin/sh
set -e

# Use PORT from Railway environment, fallback to 3000
# Next.js standalone mode automatically uses process.env.PORT
PORT=${PORT:-3000}
export PORT

echo "Starting server on port $PORT..."

# In standalone mode, server.js is always in /app
# Use absolute path to avoid any path resolution issues
exec node /app/server.js "$@"

