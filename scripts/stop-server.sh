#!/usr/bin/env bash
# stop-server.sh — Stop the local dev server
# Usage: ./scripts/stop-server.sh

set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.server.pid"

if [ ! -f "$PID_FILE" ]; then
  echo "ℹ  No server PID file found. Nothing to stop."
  exit 0
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  rm -f "$PID_FILE"
  echo "✔  Server (PID $PID) stopped."
else
  rm -f "$PID_FILE"
  echo "ℹ  Server (PID $PID) was not running. Cleaned up PID file."
fi

