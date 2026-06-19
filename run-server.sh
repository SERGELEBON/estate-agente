#!/bin/bash
cd /home/z/my-project
export PORT=3000
export NODE_ENV=production
export HOSTNAME=0.0.0.0

trap "" SIGHUP
trap "" SIGTERM

exec node .next/standalone/server.js 2>&1
