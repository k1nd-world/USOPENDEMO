#!/bin/zsh

set -u

K1ND_LAUNCHER_DIR="$(cd "$(dirname "$0")" && pwd)"
K1ND_OFFLINE_PORT="8137"
K1ND_OFFLINE_URL="http://127.0.0.1:${K1ND_OFFLINE_PORT}/sign-in"

cd "$K1ND_LAUNCHER_DIR" || exit 1

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3 is required to run the K1ND offline demo."
  echo "Press Return to close this window."
  read -r
  exit 1
fi

echo "Starting K1ND MVP v10/2026 for offline use..."
echo "Keep this window open while you use the demo."
echo

PORT="$K1ND_OFFLINE_PORT" K1ND_HOST="127.0.0.1" python3 serve.py &
K1ND_SERVER_PID=$!

stop_k1nd_server() {
  kill "$K1ND_SERVER_PID" >/dev/null 2>&1 || true
}
trap stop_k1nd_server EXIT INT TERM

for K1ND_ATTEMPT in {1..40}; do
  if curl -fsS "http://127.0.0.1:${K1ND_OFFLINE_PORT}/api/health" >/dev/null 2>&1; then
    open "$K1ND_OFFLINE_URL"
    echo "K1ND MVP v10/2026 is open in your browser."
    echo "Offline address: $K1ND_OFFLINE_URL"
    echo "Close this window when your demonstration is finished."
    wait "$K1ND_SERVER_PID"
    exit $?
  fi
  if ! kill -0 "$K1ND_SERVER_PID" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

echo
echo "The offline demo could not start. Another application may be using port ${K1ND_OFFLINE_PORT}."
echo "Press Return to close this window."
read -r
exit 1
