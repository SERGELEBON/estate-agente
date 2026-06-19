#!/bin/bash
cd /home/z/my-project
while true; do
    echo "[$(date +%H:%M:%S)] Starting production server..."
    NODE_ENV=production node .next/standalone/server.js 2>&1
    EXIT=$?
    echo "[$(date +%H:%M:%S)] Server exited (code=$EXIT). Restarting in 1s..."
    sleep 1
done
