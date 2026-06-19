#!/bin/bash
while true; do
    echo "[$(date)] Starting server..."
    cd /home/z/my-project
    NODE_ENV=production node .next/standalone/server.js
    EXIT_CODE=$?
    echo "[$(date)] Server exited with code $EXIT_CODE. Restarting in 3s..."
    sleep 3
done
