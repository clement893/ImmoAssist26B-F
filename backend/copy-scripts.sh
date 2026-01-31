#!/bin/sh
# Script to copy Node.js scripts from project root to backend/scripts
# This allows the scripts to be available in the Docker container

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Copy scripts from parent directory (if building from project root)
# or from current directory (if scripts are already in backend/)
if [ -f ../scripts/check-api-connections.js ]; then
    echo "Copying scripts from project root..."
    cp ../scripts/check-api-connections.js scripts/
    cp ../scripts/check-api-connections-backend.js scripts/
    cp ../scripts/generate-api-connection-report.js scripts/
elif [ -f scripts/check-api-connections.js ]; then
    echo "Scripts already in backend/scripts, skipping copy..."
else
    echo "Warning: Scripts not found. They may not be available in production."
fi

# Make scripts executable
chmod +x scripts/*.js 2>/dev/null || true
