#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo
  echo "A parar frontend e backend..."
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

cd "${ROOT_DIR}"

load_env_file() {
  local file_path="$1"
  if [[ -f "${file_path}" ]]; then
    echo "A carregar ${file_path#${ROOT_DIR}/}"
    set -a
    # shellcheck disable=SC1090
    source "${file_path}"
    set +a
  fi
}

load_env_file "${ROOT_DIR}/.env"
load_env_file "${ROOT_DIR}/backend/.env"

echo "A instalar dependencias do frontend..."
npm install

echo "A preparar Maven Wrapper..."
chmod +x backend/mvnw

echo "A arrancar backend em http://localhost:8080"
(
  cd "${ROOT_DIR}/backend"
  ./mvnw spring-boot:run
) &
BACKEND_PID=$!

echo "A arrancar frontend em http://localhost:5173"
npm run dev &
FRONTEND_PID=$!

echo
echo "Tudo a correr:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8080"
echo "  Swagger:  http://localhost:8080/swagger-ui.html"
echo
echo "Prime Ctrl+C para parar tudo."

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
