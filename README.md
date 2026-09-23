# TaskFlow API

API REST para gerenciamento de tarefas (to-do list), desenvolvida com NestJS, TypeScript e PostgreSQL, como projeto da disciplina **DevOps na Prática**.

- **Fase 1:** configuração e automação inicial (CI, containers, IaC).
- **Fase 2:** entrega contínua, containers/orquestração, monitoramento e segurança — ver [`docs/RELATORIO-FASE02.md`](docs/RELATORIO-FASE02.md) e o fluxograma em [`docs/fluxograma-devops.md`](docs/fluxograma-devops.md).

## Stack

- **Linguagem/Framework:** TypeScript + NestJS
- **Banco de dados:** PostgreSQL (TypeORM, schema versionado por migrations)
- **Containers:** Docker (multi-stage, usuário não-root) / Docker Compose
- **CI/CD:** GitHub Actions (GHCR, Trivy, aprovação manual, rollback automático)
- **Observabilidade:** Prometheus + Grafana, logs estruturados (pino)
- **IaC:** Terraform (AWS)

## Funcionalidades

- CRUD de tarefas (`/tasks`)
- Filtros por status (`a_fazer`, `em_andamento`, `concluida`) e prioridade (`baixa`, `media`, `alta`)
- Health checks (`/health`, `/health/live`, `/health/ready`)
- Métricas Prometheus (`/metrics`)
- Logs estruturados em JSON correlacionados por `x-request-id`

## Rodando localmente

### Com Docker (recomendado)

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` e o banco PostgreSQL em `localhost:5432`. As migrations rodam automaticamente no boot.

### Sem Docker

```bash
cp .env.example .env
npm install
npm run start:dev
```

> É necessário ter um PostgreSQL rodando localmente com as credenciais definidas no `.env`.

### Stack de produção local (compose de prod + observabilidade)

```bash
cp .env.example .env   # preencha DB_PASSWORD, JWT_SECRET, GRAFANA_ADMIN_PASSWORD
docker compose -f docker-compose.prod.yml -f docker-compose.observability.yml up -d
```

- API: `http://localhost:3000`
- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3001` (dashboard "TaskFlow API - Golden Signals" já provisionado)

## Testes

```bash
npm run lint       # lint (ESLint)
npm run test       # testes unitários (Jest)
npm run test:cov   # testes unitários com relatório de cobertura (gate: 75% linhas)
npm run test:e2e   # testes end-to-end
```

## Migrations (TypeORM)

O schema do banco é sempre gerenciado por migration versionada (nunca por `synchronize`), tanto em desenvolvimento quanto em produção — elas rodam automaticamente no boot da aplicação (`migrationsRun: true`).

```bash
npm run migration:generate -- src/migrations/NomeDaMigracao   # gera a partir de mudanças nas entidades
npm run migration:run                                          # roda manualmente, se precisar
npm run migration:revert                                        # desfaz a última migration
```

## Endpoints principais

| Método | Rota           | Descrição                                   |
|--------|----------------|----------------------------------------------|
| GET    | /health        | Healthcheck simples (compatibilidade Fase 1)  |
| GET    | /health/live   | Liveness — processo está de pé                |
| GET    | /health/ready  | Readiness — banco alcançável                  |
| GET    | /metrics       | Métricas no formato Prometheus                |
| POST   | /tasks         | Cria uma nova tarefa                          |
| GET    | /tasks         | Lista tarefas (filtros opcionais)             |
| GET    | /tasks/:id     | Busca uma tarefa pelo id                      |
| PATCH  | /tasks/:id     | Atualiza uma tarefa                           |
| DELETE | /tasks/:id     | Remove uma tarefa                             |

## CI/CD

- **CI** ([`ci.yml`](.github/workflows/ci.yml)): a cada push/PR na `main` — lint, `npm audit`, Gitleaks, Hadolint, testes com cobertura, build e build de validação da imagem Docker.
- **CD** ([`cd.yml`](.github/workflows/cd.yml)): disparado automaticamente após o CI passar na `main` — build multi-stage + push versionado no GHCR, scan Trivy (bloqueia em vulnerabilidade Critical/High), aprovação manual (GitHub Environment `production`), deploy via `docker compose`, smoke test funcional e rollback automático se falhar, e criação de release/tag.

Veja o detalhamento completo em [`docs/RELATORIO-FASE02.md`](docs/RELATORIO-FASE02.md).

## Observabilidade

- Métricas: [`/metrics`](src/metrics) (Prometheus) — Golden Signals (taxa de requisições, erros 5xx, latência p95, uso de memória).
- Dashboard: [`monitoring/grafana/dashboards/taskflow-api.json`](monitoring/grafana/dashboards/taskflow-api.json), provisionado automaticamente.
- Alertas: [`monitoring/alerts.yml`](monitoring/alerts.yml) (`ApiDown`, `HighErrorRate5xx`, `HighLatencyP95`) — avaliados pelo Prometheus; sem Alertmanager configurado nesta entrega (roteamento para Slack/e-mail é uma melhoria futura documentada no relatório).

## Segurança no pipeline

`npm audit`, Gitleaks (segredos), Hadolint (lint do Dockerfile) no CI; Trivy (scan de imagem) no CD; Dependabot ([`dependabot.yml`](.github/dependabot.yml)) para npm, Docker e GitHub Actions; validação de variáveis de ambiente obrigatórias no boot em produção ([`src/config/validate-env.ts`](src/config/validate-env.ts)).

## Infraestrutura como Código

Os scripts Terraform para provisionar a infraestrutura na AWS (EC2, RDS PostgreSQL, VPC, security groups) estão na pasta [`/infra`](infra). Veja instruções de uso no README da pasta.

## Autora

Patricia dos Santos Silva
