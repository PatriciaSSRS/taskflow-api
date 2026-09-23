#!/usr/bin/env bash
# Faz o deploy da imagem $IMAGE_TAG no host onde o script roda,
# via docker compose. Pensado para rodar tanto no runner do CD quanto,
# via SSH, direto numa VM de produção — o script não sabe (nem
# precisa saber) onde está sendo executado.
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
LAST_HEALTHY_FILE=".last-healthy-tag"

: "${IMAGE_TAG:?defina IMAGE_TAG com a tag da imagem a implantar}"
: "${DB_USER:?defina DB_USER}"
: "${DB_PASSWORD:?defina DB_PASSWORD}"
: "${DB_NAME:?defina DB_NAME}"
: "${JWT_SECRET:?defina JWT_SECRET}"
: "${GRAFANA_ADMIN_PASSWORD:?defina GRAFANA_ADMIN_PASSWORD}"

echo "==> Registrando a imagem atualmente em produção para rollback (se houver)"
if docker inspect taskflow-api >/dev/null 2>&1; then
  CURRENT_TAG=$(docker inspect --format '{{ index .Config.Labels "org.opencontainers.image.version" }}' taskflow-api 2>/dev/null || echo "")
  if [ -n "$CURRENT_TAG" ] && [ "$CURRENT_TAG" != "$IMAGE_TAG" ]; then
    echo "$CURRENT_TAG" > "$LAST_HEALTHY_FILE"
    echo "    imagem anterior: $CURRENT_TAG"
  fi
else
  echo "    nenhum container em execução ainda (primeiro deploy)"
fi

cat > .env <<EOF
IMAGE_TAG=${IMAGE_TAG}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
JWT_SECRET=${JWT_SECRET}
GRAFANA_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
EOF
chmod 600 .env

echo "==> Subindo docker compose -f ${COMPOSE_FILE} com a imagem :${IMAGE_TAG}"
docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

echo "==> Aguardando o container ficar healthy"
for i in $(seq 1 30); do
  status=$(docker inspect --format '{{.State.Health.Status}}' taskflow-api 2>/dev/null || echo "starting")
  if [ "$status" = "healthy" ]; then
    echo "    taskflow-api está healthy"
    exit 0
  fi
  sleep 2
done

echo "!! taskflow-api não ficou healthy a tempo" >&2
docker logs --tail 50 taskflow-api >&2 || true
exit 1
