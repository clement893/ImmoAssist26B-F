#!/bin/sh
set -e

# This script ensures NEXT_PUBLIC_* environment variables are available during build
# Railway passes environment variables, but we need to ensure they're available to Next.js

echo "Building Next.js application with environment variables..."

# Log available NEXT_PUBLIC_* variables (without exposing sensitive values)
echo "Available NEXT_PUBLIC_* variables:"
env | grep "^NEXT_PUBLIC_" | sed 's/=.*/=***/' || echo "No NEXT_PUBLIC_* variables found"

# Run Next.js build
# Next.js will automatically read NEXT_PUBLIC_* variables from the environment
exec pnpm next build

