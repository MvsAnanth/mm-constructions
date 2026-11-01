#!/usr/bin/env bash
# start-server.sh — Start a local dev server for MM Constructions
# Usage: ./scripts/start-server.sh [port]

set -e

PORT="${1:-8080}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$ROOT/.server.pid"

if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    echo "⚠  Server is already running (PID $OLD_PID) at http://localhost:$PORT"
    echo "   Run ./scripts/stop-server.sh to stop it first."
    exit 1
  else
    rm -f "$PID_FILE"
  fi
fi

cd "$ROOT"

echo "🚀 Starting server on http://localhost:$PORT …"
python3 -m http.server "$PORT" &>/dev/null &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Give it a moment to bind
sleep 0.5

if kill -0 "$SERVER_PID" 2>/dev/null; then
  echo "✔  Server running (PID $SERVER_PID)"
  echo "   Open: http://localhost:$PORT"

  # Auto-open in default browser
  if command -v open &>/dev/null; then
    open "http://localhost:$PORT"
  elif command -v xdg-open &>/dev/null; then
    xdg-open "http://localhost:$PORT"
  fi

  echo "   Stop: ./scripts/stop-server.sh"
else
  echo "✗  Server failed to start."
  rm -f "$PID_FILE"
  exit 1
fi

