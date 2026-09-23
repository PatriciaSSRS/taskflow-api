#!/usr/bin/env bash
# Volta para a última imagem saudável registrada por deploy.sh.
# Chamado automaticamente pelo job de smoke-test do cd.yml quando o
# smoke test do deploy novo falha.
set -euo pipefail

LAST_HEALTHY_FILE=".last-healthy-tag"

if [ ! -f "$LAST_HEALTHY_FILE" ]; then
  echo "!! Não há registro de uma imagem anterior saudável — nada para reverter." >&2
  exit 1
fi

PREVIOUS_TAG=$(cat "$LAST_HEALTHY_FILE")
echo "==> Revertendo para a imagem :${PREVIOUS_TAG}"

IMAGE_TAG="$PREVIOUS_TAG" ./deploy/deploy.sh

echo "==> Rollback concluído para :${PREVIOUS_TAG}"
