# Prompt — Geração do Sistema de Controle de Contratos & Gestão Orçamentária

> Cole este prompt em um agente de codificação (Cascade, Claude, GPT etc.) para gerar o projeto completo.
> Ele foi construído a partir do edital `Teste_Desenvolvedor_Contratos_Orcamentos.pdf` e cobre 100% dos requisitos e critérios de avaliação.

---

## 1. Papel e Objetivo

Você é um(a) engenheiro(a) full-stack sênior. Construa, do zero e de forma **totalmente funcional**, um sistema **SaaS local multi-tenant** chamado **"Sistema de Controle de Contratos & Gestão Orçamentária"**.

O sistema cobre todo o ciclo de vida de contratos — da criação e assinatura eletrônica ao acompanhamento financeiro e operacional de obras e manutenções — integrando, em uma única plataforma:

- Fluxo de assinatura eletrônica (e-mail e WhatsApp)
- Gerenciamento documental
- Controle orçamentário
- Geração de ordens de compra

A entrega final deve estar **rodando localmente, pronta para demonstração**, com repositório Git, README, migrations Prisma e `.env.example`.

---

## 2. Stack Obrigatória (não substituir)

| Camada | Tecnologia |
|---|---|
| Front-end | **React + Vite** (SPA responsiva) |
| Estilização | **TailwindCSS** (design system consistente) |
| Estado Global | **Zustand** |
| Back-end | **Node.js + Express** (API REST) |
| ORM | **Prisma** (mapeamento + migrations) |
| Banco de Dados | **PostgreSQL + pgvector** (busca semântica) |
| Autenticação | **JWT / Sessions** com controle de acesso multi-tenant |

Bibliotecas recomendadas (livres para uso): React Router, Lucide (ícones), shadcn/ui ou componentes próprios, Zod (validação), React Hook Form, Recharts (gráficos do dashboard), bcrypt, multer (uploads).

---

## 3. Arquitetura e Organização (critério de peso ALTO)

- **Clean code**, separação clara de responsabilidades e estrutura de pastas escalável.
- **Multi-tenant**: isolamento total de dados por empresa (`company_id` em toda entidade; middleware que injeta e força o tenant em todas as queries).
- **Camadas no back-end**: `routes → controllers → services → repositories (Prisma)`, com middlewares de auth, validação e tratamento de erros centralizado.
- **Integração entre módulos**: contrato ↔ obra ↔ ordem de compra deve fluir corretamente.
- **Audit log** de ações para rastreabilidade.

### Estrutura de pastas sugerida
```
/contratos-orcamentos
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/            # env, prisma client, logger
│   │   ├── middlewares/       # auth, tenant, errorHandler, validate
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── companies/
│   │   │   ├── users/
│   │   │   ├── contracts/
│   │   │   ├── templates/
│   │   │   ├── signatures/
│   │   │   ├── obras/
│   │   │   ├── purchase-orders/
│   │   │   ├── uploads/
│   │   │   └── dashboard/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # UI reutilizável
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── store/             # Zustand
│   │   ├── services/          # axios/api client
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 4. Modelagem de Dados (Prisma + PostgreSQL) — peso ALTO

Crie o `schema.prisma` com relacionamentos normalizados, migrations funcionais e seed. Todas as tabelas de negócio carregam `companyId` (multi-tenant). Habilite `pgvector` para busca semântica em contratos/templates.

| Tabela | Descrição |
|---|---|
| `companies` | Entidades multi-tenant (empresas) |
| `users` | Usuários por empresa com controle de perfil/role |
| `contracts` | Contratos com status, datas e vínculos |
| `contract_templates` | Templates base com campos parametrizáveis |
| `contract_template_fields` | Campos editáveis por template |
| `signature_requests` | Solicitações de assinatura por canal (e-mail/WhatsApp) |
| `obras` | Projetos de obra vinculados a empresa e contrato |
| `obra_steps` | Etapas do roteiro de obra |
| `obra_vistorias` | Registros de vistoria (inicial/final) com fotos |
| `obra_custos` | Lançamentos de custo por obra |
| `purchase_orders` | Ordens de compra vinculadas a obras |
| `uploads` | Arquivos e imagens por entidade |
| `audit_logs` | Log de ações para rastreabilidade |

**Enums sugeridos:** `ContractStatus` (RASCUNHO, AGUARDANDO_ASSINATURA, ASSINADO, ATIVO, VENCENDO, ENCERRADO, EXPIRADO), `SignatureChannel` (EMAIL, WHATSAPP, AMBOS), `SignatureStatus` (AGUARDANDO, ASSINADO, EXPIRADO), `ObraStepStatus` (PENDENTE, EM_ANDAMENTO, CONCLUIDO), `VistoriaTipo` (INICIAL, FINAL), `UserRole` (ADMIN, GESTOR, OPERADOR).

---

## 5. Módulos do Sistema (funcionalidades obrigatórias)

### 5.1 Gestão de Contratos (módulo central)
- Listagem de todos os contratos da empresa com **filtros e busca** (incluindo busca semântica via pgvector).
- **Biblioteca de templates**: prestação de serviço, contrato de trabalho, contrato de obra, contrato de locação, entre outros.
- **Campos dinâmicos editáveis por template**: horários, endereços, partes relacionadas, valores e campos de assinatura.
- Criação de novo contrato a partir de template com **preenchimento guiado** (ou do zero).
- **Visualização completa** do contrato antes de encaminhar para assinatura.

### 5.2 Assinatura Eletrônica
- Envio do link de assinatura por **E-mail** (obrigatório).
- Envio via **WhatsApp** — link ou mensagem (obrigatório).
- **Ambos** — disparo simultâneo nos dois canais (obrigatório).
- **Sinalizador visual de status**: Aguardando assinatura / Assinado / Expirado.
- **Notificação automática** ao sistema quando o contrato for assinado.
- Contrato assinado **movido automaticamente** para repositório de contratos vigentes.
- **Histórico** de envios e tentativas de assinatura por contrato.

> Para ambiente local, simule os disparos de e-mail/WhatsApp (ex.: log, mailhog ou registro em `signature_requests`) gerando um link de assinatura acessível que atualiza o status — mantendo rastreabilidade real no banco.

### 5.3 Gerenciador de Contratos (Painel de Acompanhamento)
Tela consolidada com os campos:

| Campo | Descrição |
|---|---|
| Parte Relacionada | Nome/Razão social do contratado ou contratante |
| Tipo de Contrato | Categoria (trabalho, obra, locação, serviço, etc.) |
| Valor do Contrato | Valor total ou mensal pactuado |
| Data de Início | Início da vigência |
| Data de Encerramento | Término previsto da vigência |
| Vigência Restante | **Cálculo automático** em dias/meses até o vencimento |
| Status | Ativo / Vencendo / Encerrado / Aguardando assinatura |
| Ações Rápidas | Visualizar, Renovar, Encerrar, Gerar aditivo |

Inclua **alertas automáticos** de vencimento (status "Vencendo").

### 5.4 Gestão de Obras
> **ATENÇÃO:** NÃO consultar time interno sobre processos de obra. Pesquise boas práticas de mercado e aplique os pontos gerenciais mais relevantes.

- **Roteiro de obra**: checklist de etapas e marcos por fase (planejamento, execução, entrega).
- **Controle orçamentário**: orçamento previsto vs. realizado por obra.
- **Vistoria inicial**: registro fotográfico e descritivo do estado antes da obra.
- **Vistoria final**: comparativo com estado inicial e registro de conclusão.
- **Registro de manutenções**: histórico de intervenções no local.
- **Controle de custos**: lançamento e categorização de despesas por obra.
- **Geração de Ordem de Compra**: emissão de O.C. vinculada à obra, com seleção do **CNPJ pagador**.
- **Vinculação com contrato**: associar a obra ao contrato de locação ou serviço de origem.

---

## 6. Fluxo Esperado da Aplicação (implementar ponta a ponta)

1. Usuário cria contrato a partir de um template ou do zero.
2. Preenche campos parametrizáveis (partes, valores, datas, assinaturas).
3. Sistema salva o contrato com status **'Rascunho'**.
4. Usuário encaminha para assinatura via e-mail e/ou WhatsApp.
5. Partes recebem link e realizam a assinatura.
6. Sistema atualiza status para **'Assinado'** com sinalizador visual.
7. Contrato assinado é arquivado e visível no Gerenciador.
8. Usuário pode vincular obra ao contrato e iniciar gestão de obra.
9. Obra segue roteiro: vistoria inicial → execução → custos → O.C. → vistoria final.
10. Dashboard consolida métricas de contratos e obras.

---

## 7. Páginas e Navegação (UX/UI responsiva e moderna)

**Contratos & Assinaturas**
- Dashboard Principal — KPIs de contratos e obras (com **métricas reais do banco**).
- Contratos — Listagem e filtros avançados.
- Templates — Biblioteca de modelos.
- Novo Contrato — Criação e preenchimento guiado.
- Assinaturas — Fila e status de assinaturas pendentes.
- Gerenciador de Contratos — Contratos ativos com vigência.

**Obras & Configurações**
- Obras — Listagem de projetos de obra.
- Detalhe de Obra — Roteiro, custos, vistorias, O.C.
- Ordens de Compra — Emissão e acompanhamento.
- Relatórios — Exportação e consultas.
- Parametrização — Configurações do sistema.
- Gestão de Usuários — Multi-tenant por empresa.

---

## 8. Diferenciais Técnicos a Implementar

- Arquitetura multi-tenant (isolamento por empresa).
- Modelagem de dados normalizada e escalável.
- Integração entre módulos (contrato ↔ obra ↔ O.C.).
- Cálculo automático de vigência e alertas.
- Upload de arquivos (fotos de vistoria, documentos).
- Dashboard com métricas reais do banco.
- Fluxo de assinatura com rastreabilidade.
- Geração de Ordem de Compra com CNPJ pagador.
- Menu de relatórios e parametrização.
- Pesquisa e conformidade com práticas de mercado (módulo de obras).

---

## 9. Critérios de Avaliação (otimize para estes pesos)

| Critério | Peso | O que será avaliado |
|---|---|---|
| Arquitetura e Organização | Alto | Clean code, separação de responsabilidades, estrutura de pastas |
| Modelagem de Dados | Alto | Banco bem estruturado, relacionamentos corretos, migrations Prisma |
| Fluxo de Contratos | Alto | Templates, preenchimento, envio e status de assinatura funcionais |
| Gestão de Obras | Alto | Roteiro, vistorias, custos e O.C. com vinculação ao contrato |
| Pesquisa e Conformidade | Médio | Boas práticas de mercado aplicadas ao módulo de obras |
| UX/UI | Médio | Interface clara, responsiva e com boa usabilidade |
| Dashboard e Relatórios | Médio | Métricas relevantes e menu de relatórios funcional |
| Integração entre Módulos | Médio | Dados fluem corretamente entre contratos, obras e O.C. |

---

## 10. Entrega Esperada (checklist final)

- [ ] Repositório Git completo com **histórico de commits organizado** (commits pequenos e semânticos).
- [ ] **README** com instruções de instalação, configuração e execução local.
- [ ] Banco configurado via **Prisma com migrations funcionais** + seed de dados de exemplo.
- [ ] Arquivo **`.env.example`** (back e front) com todas as variáveis necessárias.
- [ ] Sistema **funcional rodando localmente**, pronto para demonstração.
- [ ] Comandos `docker-compose` (opcional) para subir PostgreSQL + pgvector facilmente.

---

## 11. Instruções de Execução para o Agente

1. **Confirme o plano** em alto nível e a estrutura de pastas antes de gerar grandes volumes de código.
2. Comece pelo **back-end**: `schema.prisma` → migrations → seed → módulos (auth/tenant primeiro).
3. Implemente a **API REST** módulo a módulo, com validação (Zod) e tratamento de erros.
4. Em seguida, o **front-end**: layout/navegação → store Zustand → páginas na ordem do fluxo (Seção 6).
5. Garanta que **cada fluxo da Seção 6 funcione ponta a ponta** com dados reais do banco.
6. Para e-mail/WhatsApp em ambiente local, **simule o disparo** mantendo rastreabilidade no banco e um link de assinatura funcional.
7. Para o módulo de obras, **pesquise e aplique boas práticas de mercado** (não invente sem base).
8. Escreva o **README** e o **`.env.example`** ao final, validando que `npm install` + migrations + seed + `npm run dev` sobem o sistema.
9. Não use dados mockados onde o requisito pede dados reais (dashboard, gerenciador, relatórios).
10. Entregue código **imediatamente executável**, com todas as dependências declaradas.
