#!/bin/bash
LOCKFILE=/tmp/immocom-server.lock

# Prevent multiple instances
if [ -f "$LOCKFILE" ]; then
  OLD_PID=$(cat "$LOCKFILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    exit 0
  fi
fi

cd /home/z/my-project
export PORT=3000
export NODE_ENV=production
export HOSTNAME=0.0.0.0

# Start the server
node .next/standalone/server.js &
SERVER_PID=$!
echo "$SERVER_PID" > "$LOCKFILE"

# Wait for the server to exit
wait $SERVER_PID
rm -f "$LOCKFILE"
