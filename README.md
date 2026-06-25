# Sistema de Controle de Contratos & Gestão Orçamentária

SaaS local **multi-tenant** para todo o ciclo de vida de contratos — da criação e assinatura eletrônica ao acompanhamento financeiro e operacional de obras e manutenções — com geração de ordens de compra.

## Stack

| Camada | Tecnologia |
|---|---|
| Front-end | React + Vite + TypeScript |
| Estilização | TailwindCSS |
| Estado global | Zustand |
| Back-end | Node.js + Express (API REST) |
| ORM | Prisma |
| Banco | PostgreSQL + pgvector |
| Auth | JWT (multi-tenant por empresa) |
| Gráficos / Ícones | Recharts / Lucide |

## Arquitetura

Monorepo com duas aplicações:

```
solidy_sccgo/
├── backend/      # API REST (Express + Prisma)
│   ├── prisma/   # schema, migrations e seed
│   └── src/
│       ├── config/        # env, prisma client
│       ├── middlewares/   # auth, validate, errorHandler
│       ├── modules/       # auth, contracts, templates, signatures,
│       │                  # obras, purchase-orders, uploads,
│       │                  # dashboard, config, users
│       ├── routes/        # agregador de rotas
│       └── utils/         # erros, audit, vigência
├── frontend/     # SPA React + Vite
│   └── src/
│       ├── components/    # Layout, UI compartilhada
│       ├── pages/         # uma página por tela
│       ├── store/         # Zustand (auth)
│       └── lib/           # api client, tipos, formatadores
└── docker-compose.yml     # PostgreSQL + pgvector
```

Padrão de camadas no back-end: `routes → controller → service → Prisma`, com isolamento multi-tenant (`companyId` injetado via JWT em todas as queries) e log de auditoria.

## Pré-requisitos

- Node.js 20+ (testado em 22)
- pnpm (ou npm/yarn)
- Docker + Docker Compose (para o PostgreSQL com pgvector) — ou um PostgreSQL local com a extensão `vector`

## Passo a passo (execução local)

### 1. Subir o banco de dados

```bash
docker compose up -d
```

Isso sobe um PostgreSQL 16 com a extensão `pgvector` em `localhost:5432`.

### 2. Back-end

```bash
cd backend
cp .env.example .env          # ajuste se necessário
pnpm install
pnpm prisma:migrate           # aplica as migrations
pnpm db:seed                  # popula dados de exemplo
pnpm dev                      # API em http://localhost:4000/api
```

### 3. Front-end

```bash
cd frontend
cp .env.example .env
pnpm install
pnpm dev                      # SPA em http://localhost:5173
```

Acesse **http://localhost:5173**.

## Credenciais de demonstração

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@solidy.com.br` | `123456` |
| Gestor | `gestor@solidy.com.br` | `123456` |
| Operador | `operador@solidy.com.br` | `123456` |

Também é possível **criar uma nova empresa** na tela de login (aba "Criar empresa"), demonstrando o multi-tenant.

## Módulos e funcionalidades

- **Gestão de Contratos** — listagem com filtros/busca, biblioteca de templates, campos dinâmicos por template, criação guiada (template ou do zero), visualização completa.
- **Assinatura Eletrônica** — envio por E-mail, WhatsApp ou ambos; status visual (Aguardando / Assinado / Expirado); página pública de assinatura via token; ao assinar, o contrato é movido automaticamente para vigentes; histórico de envios/tentativas.
- **Gerenciador de Contratos** — painel com parte relacionada, tipo, valor, datas, **vigência restante calculada automaticamente**, status e ações rápidas (Visualizar, Renovar, Encerrar, Gerar aditivo).
- **Gestão de Obras** — roteiro por fases (planejamento/execução/entrega), controle orçamentário previsto vs. realizado, vistoria inicial e final com registro fotográfico, registro de manutenções, controle de custos por categoria, geração de Ordem de Compra com **CNPJ pagador**, e vínculo com o contrato de origem.
- **Dashboard** — KPIs e gráficos com métricas reais do banco + alertas de contratos vencendo.
- **Relatórios** — orçamento por obra, custos por categoria e exportação CSV.
- **Parametrização** — dados da empresa, CNPJs pagadores e log de auditoria.
- **Gestão de Usuários** — usuários por empresa com perfis (multi-tenant).

## Fluxo ponta a ponta

1. Criar contrato (template ou do zero) → salvo como **Rascunho**.
2. Preencher campos parametrizáveis.
3. Enviar para assinatura (e-mail e/ou WhatsApp) → status **Aguardando assinatura**.
4. A parte abre o link (`/assinar/:token`) e assina.
5. Sistema marca como **Assinado/Ativo** e arquiva nos vigentes.
6. Vincular uma obra ao contrato e acompanhar o roteiro: vistoria inicial → custos → O.C. → vistoria final.
7. Dashboard e relatórios consolidam tudo.

## Sobre a assinatura eletrônica (ambiente local)

Como o ambiente é local, o disparo por e-mail/WhatsApp é **simulado**: ao enviar, o sistema gera e registra um link de assinatura (`signature_requests`) e o exibe na interface (e no log do servidor). O link é totalmente funcional e atualiza o status real no banco quando acessado, preservando a rastreabilidade exigida.

## Banco de dados

13 tabelas principais (Prisma): `companies`, `users`, `contract_templates`, `contract_template_fields`, `contracts`, `signature_requests`, `obras`, `obra_steps`, `obra_vistorias`, `obra_custos`, `purchase_orders`, `uploads`, `audit_logs` (+ `payer_companies` para os CNPJs pagadores).

Comandos úteis:

```bash
pnpm prisma:studio     # explorar o banco visualmente
pnpm prisma:migrate    # criar/aplicar migrations
pnpm db:seed           # repopular dados de exemplo
```

## Variáveis de ambiente

**backend/.env**

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/contratos_orcamentos?schema=public
PORT=4000
JWT_SECRET=...
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
UPLOAD_DIR=uploads
APP_PUBLIC_URL=http://localhost:5173
```

**frontend/.env**

```
VITE_API_URL=/api
```
