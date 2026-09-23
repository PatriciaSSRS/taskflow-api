#!/usr/bin/env bash
# Valida que o deploy que acabou de subir está realmente servindo
# tráfego: health checks, /metrics, e um fluxo funcional real de CRUD
# em /tasks (não só "o processo existe").
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

fail() {
  echo "!! SMOKE TEST FALHOU: $1" >&2
  exit 1
}

echo "==> GET /health/live"
curl -sf "${BASE_URL}/health/live" > /dev/null || fail "/health/live não respondeu 200"

echo "==> GET /health/ready"
curl -sf "${BASE_URL}/health/ready" > /dev/null || fail "/health/ready não respondeu 200 (banco indisponível?)"

echo "==> GET /metrics"
curl -sf "${BASE_URL}/metrics" | grep -q "^http_requests_total" || fail "/metrics não expôs http_requests_total"

echo "==> POST /tasks"
TASK_ID=$(curl -sf -X POST "${BASE_URL}/tasks" \
  -H 'Content-Type: application/json' \
  -d '{"title":"smoke-test","priority":"baixa"}' | \
  node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).id))')
[ -n "$TASK_ID" ] || fail "POST /tasks não retornou um id"

echo "==> GET /tasks/${TASK_ID}"
curl -sf "${BASE_URL}/tasks/${TASK_ID}" > /dev/null || fail "GET /tasks/:id não encontrou a tarefa recém-criada"

echo "==> DELETE /tasks/${TASK_ID}"
STATUS=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${BASE_URL}/tasks/${TASK_ID}")
[ "$STATUS" = "200" ] || fail "DELETE /tasks/:id retornou status ${STATUS}"

echo "==> smoke test OK"
