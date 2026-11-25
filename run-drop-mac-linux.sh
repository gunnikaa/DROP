#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
mkdir -p backend/out
find backend/src -name '*.java' > backend/sources.txt
javac -encoding UTF-8 -d backend/out @backend/sources.txt
(java -cp backend/out com.drop.server.DropServer) &
BACKEND_PID=$!
trap 'kill $BACKEND_PID 2>/dev/null || true' EXIT
if [ ! -d node_modules ]; then npm install; fi
npm run dev
