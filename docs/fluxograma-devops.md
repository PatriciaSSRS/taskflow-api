# Fluxograma do pipeline DevOps — TaskFlow API

Quatro visões complementares do mesmo pipeline, da forma mais simples de explicar para a mais detalhada.

## 1. Visão geral — do commit à produção monitorada

```mermaid
flowchart LR
    A[Commit / PR na main] --> B[CI: lint, testes, cobertura, build]
    B -->|falhou| A
    B -->|passou| C[CD: build + push da imagem no GHCR]
    C --> D[Scan de vulnerabilidades - Trivy]
    D -->|Critical/High| A
    D -->|ok| E[Aprovação manual - GitHub Environment production]
    E --> F[Deploy - docker compose up]
    F --> G[Smoke test - health + CRUD real]
    G -->|falhou| H[Rollback automático]
    H --> A
    G -->|passou| I[Release / tag no GitHub]
    I --> J[Produção monitorada - Prometheus + Grafana]
    J -->|alerta dispara| A

    style A fill:#dbeafe,stroke:#1e3a8a
    style J fill:#dcfce7,stroke:#14532d
    style H fill:#fee2e2,stroke:#7f1d1d
```

## 2. Gatilhos e pontos de decisão do pipeline

```mermaid
flowchart LR
    Push[push/PR na main] --> CI{CI passou?}
    CI -->|não| FimCI[Pipeline para aqui]
    CI -->|sim| Build[Build multi-stage<br/>+ push GHCR]
    Build --> Trivy{Trivy: Critical/High?}
    Trivy -->|sim| FimTrivy[Deploy bloqueado]
    Trivy -->|não| Aprov{Revisor aprovou<br/>o Environment?}
    Aprov -->|não| Espera[Aguarda aprovação]
    Aprov -->|sim| Deploy[deploy.sh:<br/>compose pull + up]
    Deploy --> Smoke{Smoke test<br/>passou?}
    Smoke -->|não| Rollback[rollback.sh]
    Smoke -->|sim| Release[Release/tag<br/>no GitHub]
```

## 3. Arquitetura em runtime (produção)

```mermaid
flowchart TB
    subgraph Internet
        Cliente[Cliente HTTP]
    end

    subgraph "Host de produção - docker compose"
        API["taskflow-api<br/>(container, usuário não-root)"]
        DB[("PostgreSQL<br/>sem porta exposta ao host")]
        Prom[Prometheus]
        Graf[Grafana]
    end

    Cliente -->|":3000 /tasks /health /metrics"| API
    API -->|"5432 - rede interna"| DB
    Prom -->|"scrape /metrics a cada 15s"| API
    Graf -->|"query PromQL"| Prom

    subgraph Segredos
        EnvFile[".env gerado pelo deploy.sh<br/>a partir de GitHub Secrets<br/>permissão 600"]
    end
    EnvFile -.->|injeta em runtime| API
    EnvFile -.->|injeta em runtime| DB
```

## 4. Ciclo DevOps

```mermaid
flowchart LR
    Plan[Plan] --> Code[Code]
    Code --> Build[Build]
    Build --> Test[Test]
    Test --> Release[Release]
    Release --> Deploy[Deploy]
    Deploy --> Operate[Operate]
    Operate --> Monitor[Monitor]
    Monitor -.->|alertas e métricas viram<br/>novos itens de backlog| Plan

    style Plan fill:#f5f5f5
    style Monitor fill:#dcfce7
```

## Como as imagens PNG deste documento foram geradas

Os quatro diagramas acima também estão renderizados como imagem em [`docs/img/`](img), para uso nos slides da apresentação. Foram gerados localmente com o [Mermaid CLI](https://github.com/mermaid-js/mermaid-cli):

```bash
npx -y @mermaid-js/mermaid-cli -i docs/fluxograma-devops.md -o docs/img/fluxograma.png
```
