#!/bin/bash
# State-ImmoCom Server Startup Script
cd /home/z/my-project
export PORT=3000
export NODE_ENV=production
export HOSTNAME=0.0.0.0

echo "Starting State-ImmoCom server on port 3000..."

# Kill any existing server
pkill -f "node.*standalone/server.js" 2>/dev/null
sleep 1

# Start the server
exec node .next/standalone/server.js
