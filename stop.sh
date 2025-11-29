#!/bin/bash

echo "Stopping Live Interpreter..."

# Kill whisper-stream processes
pkill -9 whisper-stream 2>/dev/null

# Kill server using saved PID
if [ -f .server.pid ]; then
    kill $(cat .server.pid) 2>/dev/null
    rm .server.pid
fi

# Also kill any node server.js processes
pkill -f "node server.js" 2>/dev/null

echo "Stopped."
