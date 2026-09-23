# Relatório — DevOps na Prática — Fase 2

**Projeto:** TaskFlow API
**Autora:** Patricia dos Santos Silva
**Repositório:** https://github.com/PatriciaSSRS/taskflow-api

## 1. Recapitulação da Fase 1

API REST de gerenciamento de tarefas (NestJS + TypeScript + PostgreSQL), com CRUD de tarefas e filtros por status/prioridade. Entregue com: repositório organizado (`src`, `test`, `infra`, `.github/workflows`), pipeline de CI em GitHub Actions (lint, testes, cobertura, build), containerização com Docker/Docker Compose, e infraestrutura como código em Terraform (VPC, EC2, RDS PostgreSQL, security groups).

## 2. Seção 1 — Pipeline de Entrega Contínua

**Ferramenta:** GitHub Actions + GitHub Container Registry (GHCR).

**Gatilho:** o workflow de CD ([`.github/workflows/cd.yml`](../.github/workflows/cd.yml)) dispara automaticamente via `workflow_run` assim que o CI ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) termina com sucesso na branch `main` — garantindo que só entra na esteira de entrega o código que já passou por lint, testes, cobertura e build. Também aceita `workflow_dispatch` para reexecução manual.

**Etapas do pipeline de CD:**

1. **Build e push** — build multi-stage da imagem Docker (Buildx, com cache), publicada no GHCR com as tags `sha-<commit>` e `latest`.
2. **Scan de segurança** — Trivy varre a imagem recém-publicada e **bloqueia** o pipeline em vulnerabilidades `CRITICAL`/`HIGH` não corrigidas.
3. **Aprovação manual** — o job de deploy usa o GitHub Environment `production`, configurado com aprovação obrigatória (revisor: a própria autora). O pipeline fica pausado até a aprovação.
4. **Deploy** — `deploy/deploy.sh` faz login no GHCR, gera o `.env` a partir dos GitHub Secrets, registra a imagem atualmente em produção (para rollback) e sobe `docker-compose.prod.yml` (`pull` + `up -d`), aguardando o container ficar `healthy`.
5. **Smoke test** — `deploy/smoke-test.sh` valida `/health/live`, `/health/ready`, `/metrics` e um fluxo funcional real (`POST` → `GET` → `DELETE` em `/tasks`).
6. **Rollback automático** — se o smoke test falhar, `deploy/rollback.sh` volta para a última imagem saudável registrada.
7. **Release** — criação automática de uma release/tag no GitHub com a imagem publicada.

**Entrega Contínua (e não Implantação Contínua):** o deploy exige aprovação manual explícita; todo o restante (build, scan, smoke test, rollback) é 100% automático.

**Limitação assumida nesta entrega:** não há uma VM de produção disponível (sem acesso à infraestrutura AWS da Fase 1 nesta entrega). O job de deploy roda num runner efêmero do próprio GitHub Actions, funcionando como um ambiente de homologação real e testável de ponta a ponta. Para apontar para uma VM de produção de verdade, bastaria adicionar um passo de SSH antes de `deploy.sh` (ex.: `appleboy/ssh-action`) executando os mesmos scripts remotamente — os scripts já são agnósticos a onde rodam.

**Links do repositório:**
- Workflow de CD: [`.github/workflows/cd.yml`](../.github/workflows/cd.yml)
- Workflow de CI atualizado: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
- Scripts de deploy: [`deploy/`](../deploy)

## 3. Seção 2 — Implementação de Containers e Orquestração

### a) Containerização com Docker

**Ferramenta:** Docker (Dockerfile de 3 estágios) + Docker Compose.

O [`Dockerfile`](../Dockerfile) tem três estágios (`build`, `deps`, `production`) e é endurecido para produção:
- roda como usuário não-root (`node`, já presente na imagem base);
- usa `dumb-init` como PID 1, para encerramento gracioso (`SIGTERM` chega até o processo Node e não sobram processos zumbis — verificado localmente: `docker stop` encerra com exit code 143, não 137);
- define `HEALTHCHECK` batendo em `/health/live`;
- aplica labels OCI (`org.opencontainers.image.*`) com o commit e a versão como build args;
- a imagem final não contém toolchain de build nem código-fonte TypeScript — só `dist/` e as dependências de produção.

**Arquivos Compose:**
- [`docker-compose.yml`](../docker-compose.yml) — desenvolvimento local (API + PostgreSQL).
- [`docker-compose.prod.yml`](../docker-compose.prod.yml) — produção: imagem puxada do GHCR, banco sem porta exposta ao host, limites de CPU/memória, rotação de logs (`json-file`, `max-size`/`max-file`), healthchecks.
- [`docker-compose.observability.yml`](../docker-compose.observability.yml) — Prometheus + Grafana, provisionados por código (datasource e dashboard automáticos).

### b) Scripts de deploy

**Ferramenta:** shell script + Docker Compose (deploy no próprio pipeline de CD; instruções documentadas para apontar a uma VM via SSH).

- [`deploy/deploy.sh`](../deploy/deploy.sh) — autentica no GHCR, gera o `.env` com os segredos (permissão `600`), registra a imagem atual para permitir rollback, executa `docker compose -f docker-compose.prod.yml pull && up -d` e aguarda o container ficar `healthy`.
- [`deploy/smoke-test.sh`](../deploy/smoke-test.sh) — valida `/health/live`, `/health/ready`, `/metrics` e executa um fluxo funcional real (`POST` → `GET` → `DELETE` em `/tasks`); sai com erro em qualquer falha, disparando o rollback.
- [`deploy/rollback.sh`](../deploy/rollback.sh) — relê a última imagem saudável registrada e sobe a versão anterior.

**Links do repositório:**
- Dockerfile: [`Dockerfile`](../Dockerfile)
- Arquivos Compose: [raiz do repositório](..)
- Scripts de deploy: [`deploy/`](../deploy)

## 4. Monitoramento e logging

- **Métricas:** endpoint [`/metrics`](../src/metrics) (Prometheus), com métricas padrão do processo (`prom-client`) e métricas HTTP customizadas (`http_requests_total`, `http_request_duration_seconds`, por rota, método e status).
- **Health checks:** `/health/live` (liveness, sem dependências externas) e `/health/ready` (readiness, checa a conexão com o banco via `@nestjs/terminus`).
- **Logs estruturados:** JSON via `pino`/`nestjs-pino`, correlacionados por `x-request-id` (gerado ou propagado a partir do header recebido).
- **Dashboard:** [`monitoring/grafana/dashboards/taskflow-api.json`](../monitoring/grafana/dashboards/taskflow-api.json), provisionado automaticamente — painéis de disponibilidade, taxa de requisições, taxa de erros 5xx, latência p95 e memória (Golden Signals).
- **Alertas:** [`monitoring/alerts.yml`](../monitoring/alerts.yml) — `ApiDown`, `HighErrorRate5xx`, `HighLatencyP95`, avaliados pelo Prometheus. **Sem Alertmanager configurado nesta entrega** — os alertas ficam visíveis na UI do Prometheus, mas não há roteamento para Slack/e-mail (ver Melhorias Futuras).

## 5. Segurança no pipeline

| Controle | Ferramenta | Onde roda | Bloqueia o pipeline? |
|---|---|---|---|
| Auditoria de dependências | `npm audit` | CI | Não (relatório informativo) |
| Segredos versionados | Gitleaks | CI | Sim |
| Lint do Dockerfile | Hadolint | CI | Sim (erros) |
| Vulnerabilidades na imagem | Trivy | CD | Sim (Critical/High) |
| Dependências desatualizadas | Dependabot | Semanal (npm, Docker, GitHub Actions) | Abre PR, não bloqueia |
| Validação de configuração no boot | `validate-env.ts` | Boot da aplicação | Sim, em produção (falha rápida se faltar segredo ou se um segredo ainda estiver com valor padrão de desenvolvimento) |

Escopo assumido: sem SAST (CodeQL), SBOM/proveniência assinada ou assinatura de imagem (cosign) nesta entrega — ver Melhorias Futuras.

## 6. Gerenciamento de configuração e schema

- **Variáveis de ambiente:** validadas no boot ([`src/config/validate-env.ts`](../src/config/validate-env.ts)) — em produção, falha imediatamente se faltar uma variável obrigatória ou se um segredo ainda estiver com o valor padrão de desenvolvimento, em vez de subir silenciosamente com uma configuração insegura.
- **Schema do banco:** gerenciado exclusivamente por migration versionada do TypeORM ([`src/migrations/`](../src/migrations)), nunca por `synchronize` — em dev e em produção, garantindo que o schema que roda localmente é o mesmo que sobe no deploy. As migrations rodam automaticamente no boot (`migrationsRun: true`).

## 7. Testes

- **Cobertura:** gate configurado no Jest (`package.json`) — mínimo de 75% de linhas/statements/funções e 30% de branches sobre o código de negócio (módulos de wiring do Nest e o bootstrap são excluídos da métrica, por não terem lógica). Cobertura real medida localmente: ~97% statements/linhas.
- **Testes adicionados na Fase 2:** `TasksController`, `HealthController` (liveness/readiness), `MetricsController`/`MetricsMiddleware`, `validateEnv`.
- **Testes de integração real (local, fora da cobertura do Jest):** build da imagem Docker, subida do `docker-compose.prod.yml` + `docker-compose.observability.yml`, `deploy/smoke-test.sh` contra o container real, verificação do `HEALTHCHECK`, do usuário não-root, do encerramento gracioso via `dumb-init`, e scrape real do Prometheus.

## 8. Demonstração prática do fluxo DevOps implementado

Fluxograma completo (4 visões) em [`docs/fluxograma-devops.md`](fluxograma-devops.md) e como imagem em [`docs/img/`](img).

Roteiro de demonstração reproduzível:

1. Subir a stack local com observabilidade: `docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d`.
2. Gerar tráfego real contra `/tasks` e visualizar as métricas no dashboard do Grafana (`http://localhost:3001`).
3. Abrir um PR na `main` → observar o CI rodando (lint, Gitleaks, Hadolint, testes com cobertura, build).
4. Fazer merge → o CD dispara automaticamente: build, push no GHCR, scan Trivy.
5. Aprovar o deploy no Environment `production` (GitHub pede aprovação manual).
6. Acompanhar o deploy, o smoke test e a criação da release no GitHub Actions.
7. Forçar uma falha (ex.: derrubar o container do banco antes do smoke test) para observar o rollback automático.

## 9. Análise de resultados

**Resultados:**
- As etapas automatizadas entre commit e produção passaram de ~4 (Fase 1: parava no build) para 7 estágios encadeados no CD (build → scan → aprovação → deploy → smoke test → rollback condicional → release).
- A intervenção manual no deploy foi reduzida a um clique de aprovação.
- Cobertura de testes subiu de ~26% para ~97% (código de negócio).
- Adicionados: `/metrics`, health checks live/ready, logs estruturados correlacionados, 5 controles de segurança no pipeline (npm audit, Gitleaks, Hadolint, Trivy, Dependabot), migrations versionadas (corrigindo um bug real encontrado durante os testes desta fase: sem elas, `synchronize: false` em produção deixava a tabela `tasks` inexistente).

**Limitações conhecidas:**
- Deploy via `docker compose` num único host não é *zero downtime* real.
- Sem Alertmanager — alertas não têm roteamento para Slack/e-mail.
- Instância única, sem alta disponibilidade (SPOF).
- Segredos em arquivo `.env` gerado em runtime, não num cofre (ex.: AWS Secrets Manager/Vault).
- Ambiente único (sem `staging`) e deploy nesta entrega roda num runner efêmero do GitHub Actions, não numa VM de produção real — ver Seção 2.
- Sem SAST (CodeQL), SBOM/proveniência assinada ou assinatura de imagem (cosign).
- Sem Kubernetes/Ansible nesta entrega — escopo reduzido deliberadamente para priorizar um pipeline menor, porém real e demonstrável de ponta a ponta.

**Melhorias futuras:**
- Alertmanager com notificação em Slack/e-mail.
- Ambiente de `staging` antes da produção.
- Deploy azul-verde ou canário; múltiplas instâncias + load balancer.
- Cofre de segredos (AWS Secrets Manager) em vez de `.env`.
- CodeQL (SAST), SBOM + proveniência assinada, assinatura de imagem com `cosign`.
- Tracing distribuído (OpenTelemetry).
- Testes de carga (k6) como portão de performance.
- GitOps (Argo CD/Flux) caso o projeto evolua para Kubernetes.
