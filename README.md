# EWS AfterSales — fundação P0

Código original para EWS Tech. Next.js, TypeScript, Fastify e PostgreSQL, em monorepo pnpm. **Esta entrega é uma implementação parcial do projeto completo, concentrada no P0. Não é um MVP pronto para venda.**

O site público, autenticação, contratos, isolamento por empresa, cobrança assíncrona, equipe, identidade da empresa e administração EWS possuem implementação real. A integração Asaas está escrita para o sandbox, mas não foi homologada com credenciais reais. O fluxo industrial aparece somente na demonstração isolada. Leia [o status de entrega](docs/STATUS.md) antes de apresentar o sistema como funcional a clientes.

## Começar no Windows / PowerShell

Instale Node.js 24 LTS, pnpm 11.25.0 e Docker Desktop. Abra um terminal **dentro da pasta `ews-aftersales`**, onde está o `package.json`.

```powershell
corepack enable
corepack prepare pnpm@11.25.0 --activate
Copy-Item .env.example .env
pnpm install --frozen-lockfile
docker compose up -d --wait
pnpm db:migrate
```

Se `corepack` não estiver instalado, instale o pnpm pela instrução oficial em https://pnpm.io/installation. As senhas do Compose são exclusivamente de desenvolvimento e as portas são vinculadas ao localhost.

Em três terminais, sempre na raiz do projeto:

```powershell
# Terminal 1 — API
pnpm dev:api

# Terminal 2 — e-mails, checkout e conciliação
pnpm worker

# Terminal 3 — frontend
pnpm dev
```

Abra http://localhost:3000. A API está em http://localhost:4000 e a caixa de e-mails de desenvolvimento em http://localhost:8025 (Mailpit). O navegador conversa com `/api/...` no mesmo domínio; o Next encaminha as requisições ao Fastify. Por isso as sessões não dependem de cookies entre domínios.

**Sem Docker:** use um PostgreSQL 16 disponível, crie o banco e uma role `ews_app` com `LOGIN NOSUPERUSER NOBYPASSRLS`, configure URLs distintas de migração e aplicação no `.env` e execute `pnpm db:migrate`. A role precisa existir antes da primeira migração. Nunca use a role superuser na API.

## Testar a criação de conta

1. Abra Preços, escolha um plano e cadastre uma empresa de teste.
2. No Mailpit, abra o e-mail de confirmação. Sem o worker, o e-mail fica aguardando na fila do banco.
3. Confirme o e-mail e revise os valores em Assinatura.
4. O checkout vem **desabilitado**. Para habilitá-lo, configure o sandbox conforme [ASAAS.md](docs/ASAAS.md).
5. Pague as duas cobranças usando os mecanismos de simulação do próprio Asaas. A confirmação por webhook + consulta ao provedor libera a configuração.

Não existe botão ou endpoint para simular pagamento na aplicação. O provedor falso existe somente nos testes automatizados. Não há usuário, senha ou conta administrativa padrão.

## Criar seu administrador EWS

```powershell
pnpm admin:create
```

O comando pede nome, e-mail e senha sem exibi-la. Ele cria um usuário EWS separado dos usuários de fabricantes. Entre em `/entrar`; após a senha, um link de confirmação administrativa será enviado ao e-mail. O painel fica em `/ews-admin`. Em desenvolvimento, leia esse link no Mailpit. Confirmação por e-mail não equivale a MFA resistente a phishing; TOTP/WebAuthn permanece no checklist de lançamento.

## O que há em cada pasta

| Caminho                         | Responsabilidade                                                     |
| ------------------------------- | -------------------------------------------------------------------- |
| `apps/web/app`                  | Landing, preços, autenticação, demo, painel da empresa e console EWS |
| `apps/web/components`           | Componentes, formulários, navegação e design system                  |
| `apps/api/src/app.ts`           | API REST, autenticação, autorização e rotas P0                       |
| `apps/api/src/billing.ts`       | Obrigações separadas, criação segura, conciliação e estados          |
| `apps/api/src/asaas.ts`         | Cliente HTTP exclusivo do sandbox                                    |
| `apps/api/src/jobs.ts`          | Fila persistente, tentativas e processamento                         |
| `packages/db/migrations`        | Schema, constraints, RLS e índices versionados                       |
| `packages/shared/validation.ts` | Validações compartilháveis, CNPJ e formulários                       |
| `tests/integration.test.ts`     | Cenários de segurança e cobrança com PostgreSQL WASM                 |
| `tests/e2e/product.spec.ts`     | Testes Playwright de interface                                       |
| `docs`                          | Arquitetura, API, integração, operação e pendências                  |

SQL parametrizado e migrations SQL foram usados no lugar de ORM para tornar políticas de isolamento e transações explícitas. Não há concatenação de valores de usuário em SQL. As dependências resolvidas estão fixadas no `pnpm-lock.yaml`.

## Verificações

```powershell
pnpm typecheck
pnpm test
# Com o PostgreSQL local ativo: cria e remove somente um banco de teste aleatório
pnpm test:postgres
pnpm build

# Com frontend, API e banco em execução:
pnpm exec playwright install chromium
pnpm test:e2e
```

Os testes da API usam **PGlite, motor PostgreSQL em WASM**, sem Docker. Executam as migrations e usam a role `ews_app` sem bypass de RLS. Não substituem a homologação em um servidor PostgreSQL 16, testes de carga/concurrency ou o sandbox externo.

O Playwright requer seu Chromium instalado. Neste ambiente de entrega, a instalação do navegador falhou; a suíte foi entregue, mas não foi aprovada como executada. A landing e o fluxo demonstrativo foram revisados no navegador remoto. Veja o registro exato em [VALIDATION.md](docs/VALIDATION.md).

## Demonstração

`/demo` é uma experiência local isolada por `sessionStorage`: cadastro ilustrativo de equipamento, pedido de peça, cotação, aceite, confirmação de venda e chamado. Usa dados fictícios e não chama a API operacional. Aceite de proposta **não** contabiliza venda; somente a confirmação do fabricante altera o valor demonstrativo. Não use essa demo para afirmar que o P1 está implementado.

## Publicação futura

Nada foi publicado, nenhuma infraestrutura foi comprada e nenhuma cobrança real foi criada. `config.ts` recusa `NODE_ENV=production` e chaves Asaas de produção nesta etapa. O frontend pode ser compilado para auditoria, mas a API tem bloqueio explícito de lançamento.

Após concluir os critérios em [RELEASE-GATES.md](docs/RELEASE-GATES.md), revisar a implementação e receber autorização, a arquitetura permite Next na Vercel, API e worker em serviço persistente, PostgreSQL gerenciado e storage S3 para o P1. O proxy `/api` deve preservar o domínio da aplicação, e `APP_ORIGIN` deve ser o domínio HTTPS exato.

## Enviar ao seu GitHub

Crie um repositório privado vazio chamado `ews-aftersales`. No código extraído:

```powershell
git init -b feat/p0-foundation
git add .
git commit -m "feat: add AfterSales P0 foundation"
git remote add origin https://github.com/EdwynWs/ews-aftersales.git
git push -u origin feat/p0-foundation
```

Não envie `.env`, `.local`, `node_modules`, backups ou relatórios com informações privadas. O ZIP contém o código e as instruções, sem credenciais, dependências instaladas ou dados da revisão local.
