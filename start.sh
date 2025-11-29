#!/bin/bash

# Kill any existing instances
pkill -f "node server.js" 2>/dev/null
pkill -9 whisper-stream 2>/dev/null

echo "Starting Live Interpreter..."
node server.js &
SERVER_PID=$!
echo $SERVER_PID > .server.pid

sleep 1
echo "Server running at http://localhost:3000 (PID: $SERVER_PID)"
echo "Run ./stop.sh to stop"
