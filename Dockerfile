# syntax=docker/dockerfile:1

# ---- Stage 1: build ----
# Compila o TypeScript. Fica de fora da imagem final: só o dist/ sai daqui.
FROM node:25-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage 2: dependências de produção ----
# Instalado separado do build para não herdar devDependencies (eslint,
# ts-jest, etc.) na imagem final.
FROM node:25-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: runtime ----
FROM node:25-alpine AS production

ARG GIT_COMMIT=unknown
ARG APP_VERSION=unknown

LABEL org.opencontainers.image.title="taskflow-api" \
      org.opencontainers.image.description="API REST de gerenciamento de tarefas" \
      org.opencontainers.image.source="https://github.com/PatriciaSSRS/taskflow-api" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.licenses="MIT"

# dumb-init assume o PID 1: encaminha SIGTERM pro Node e faz reap de
# processos zumbis, o que o `node` sozinho não faz.
RUN apk add --no-cache dumb-init wget

WORKDIR /app
ENV NODE_ENV=production \
    GIT_COMMIT=${GIT_COMMIT} \
    APP_VERSION=${APP_VERSION}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

# A imagem base node:20-alpine já vem com o usuário "node" (uid 1000)
# criado; só precisamos deixar os arquivos da app legíveis por ele e
# trocar de usuário antes do CMD.
RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
