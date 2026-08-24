# TaskFlow API

API REST para gerenciamento de tarefas (to-do list), desenvolvida com NestJS, TypeScript e PostgreSQL, como projeto da disciplina **DevOps na Prática** — Fase 1: Configuração e Automação Inicial.

## Stack

- **Linguagem/Framework:** TypeScript + NestJS
- **Banco de dados:** PostgreSQL (TypeORM)
- **Containers:** Docker / Docker Compose
- **CI:** GitHub Actions
- **IaC:** Terraform (AWS)

## Funcionalidades

- CRUD de tarefas (`/tasks`)
- Filtros por status (`a_fazer`, `em_andamento`, `concluida`) e prioridade (`baixa`, `media`, `alta`)
- Healthcheck (`/health`)

## Rodando localmente

### Com Docker (recomendado)

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` e o banco PostgreSQL em `localhost:5432`.

### Sem Docker

```bash
cp .env.example .env
npm install
npm run start:dev
```

> É necessário ter um PostgreSQL rodando localmente com as credenciais definidas no `.env`.

## Testes

```bash
npm run lint       # lint (ESLint)
npm run test       # testes unitários (Jest)
npm run test:cov   # testes unitários com relatório de cobertura
npm run test:e2e   # testes end-to-end
```

## Endpoints principais

| Método | Rota          | Descrição                          |
|--------|---------------|-------------------------------------|
| GET    | /health       | Verifica se a API está no ar        |
| POST   | /tasks        | Cria uma nova tarefa                |
| GET    | /tasks        | Lista tarefas (filtros opcionais)   |
| GET    | /tasks/:id    | Busca uma tarefa pelo id            |
| PATCH  | /tasks/:id    | Atualiza uma tarefa                 |
| DELETE | /tasks/:id    | Remove uma tarefa                   |

## CI/CD

O pipeline de integração contínua está definido em [`.github/workflows/ci.yml`](.github/workflows/ci.yml) e roda a cada `push` e `pull request` na branch `main`: instalação de dependências, lint, testes automatizados e build.

## Infraestrutura como Código

Os scripts Terraform para provisionar a infraestrutura na AWS (EC2, RDS PostgreSQL, VPC, security groups) estão na pasta [`/infra`](infra). Veja instruções de uso no README da pasta.

## Autora

Patricia dos Santos Silva
