#!/bin/bash
set -e

echo "[DEV] Starting State-ImmoCom production server..."

cd /home/z/my-project

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "[DEV] Installing dependencies..."
    npm install
fi

# Push database schema
echo "[DEV] Setting up database..."
npx prisma db push --accept-data-loss 2>/dev/null || true

# Start production server
echo "[DEV] Starting production server on port 3000..."
exec NODE_ENV=production node .next/standalone/server.js
