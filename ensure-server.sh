#!/bin/bash
PIDFILE=/home/z/my-project/server.pid
LOGFILE=/home/z/my-project/server.log

# Check if server is already running
if [ -f "$PIDFILE" ]; then
  OLD_PID=$(cat "$PIDFILE")
  if ps -p "$OLD_PID" > /dev/null 2>&1; then
    exit 0  # Already running
  fi
fi

# Start server
cd /home/z/my-project
export PORT=3000
export NODE_ENV=production
export HOSTNAME=0.0.0.0

node .next/standalone/server.js >> "$LOGFILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PIDFILE"
disown $NEW_PID
