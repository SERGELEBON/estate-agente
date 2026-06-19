#!/bin/bash
cd /home/z/my-project
export PORT=3000
export NODE_ENV=production
export HOSTNAME=0.0.0.0

# Kill any existing server
pkill -f "node.*server.js" 2>/dev/null
pkill -f "bun.*server.js" 2>/dev/null
sleep 2

# Start the server
exec node .next/standalone/server.js
