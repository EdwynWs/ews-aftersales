EWS AfterSales — fundação P0
Código original para EWS Tech. Next.js, TypeScript, Fastify e PostgreSQL, em monorepo pnpm. Esta entrega é uma implementação parcial do projeto completo, concentrada no P0. Não é um MVP pronto para venda.

O site público, autenticação, contratos, isolamento por empresa, cobrança assíncrona, equipe, identidade da empresa e administração EWS possuem implementação real. A integração Asaas está escrita para o sandbox, mas não foi homologada com credenciais reais. O fluxo industrial aparece somente na demonstração isolada. Leia [o status de entrega](docs/STATUS.md) antes de apresentar o sistema como funcional a clientes.
✅ Checklist de desenvolvimento e lançamento
Revisão do código da main em 04/11/2026. [x] = implementação identificada ou evidência local registrada; não significa homologação em produção. [ ] = pendente, incompleta ou não validada no ambiente exigido. Use P0 para fundação e segurança, P1 para o produto industrial e P2 para evolução.

Situação: fundação P0 parcial, recursos industriais P1 não implementados e lançamento comercial bloqueado. A experiência em /demo usa sessionStorage e dados fictícios; não se conecta ao fluxo operacional nem gera receita real.

1. Estrutura e banco de dados — P0
Responsável: A definir
- [x] Organizar monorepo pnpm com apps/api, apps/web, packages/db e packages/shared.
- [x] Criar API Fastify/TypeScript, Next.js/React e worker separado.
- [x] Modelar empresas, usuários, memberships, planos, contratos, sessões e pagamentos no PostgreSQL.
- [x] Criar migrações versionadas, índices e scripts de inicialização.
- [x] Implementar isolamento multiempresa com FORCE Row Level Security (RLS).
- [x] Criar Docker Compose de desenvolvimento com PostgreSQL 16 e Mailpit.
- [ ] Instalar, migrar e executar os testes em um servidor PostgreSQL 16 real com role sem BYPASSRLS.
- [ ] Validar transações e operações simultâneas em conexões reais.
- [ ] Preparar migrações e tabelas industriais de P1 com isolamento multiempresa.
2. Contas, permissões e segurança — P0
Responsável: A definir
- [x] Implementar cadastro de fabricante com plano selecionado e validação de CNPJ.
- [x] Implementar login, logout e sessões opacas com cookie HttpOnly/SameSite.
- [x] Implementar verificação de e-mail, recuperação de senha e revogação de sessões.
- [x] Implementar convite de usuários, aceite e controle de vagas por plano.
- [x] Proteger rotas com validação de Origin, CSRF e rate limiting.
- [x] Implementar papéis de acesso, troca de organização e auditoria.
- [x] Separar usuário administrador EWS dos usuários das empresas.
- [ ] Homologar SMTP real e fluxos completos de e-mail, convites e recuperação.
- [ ] Implementar MFA forte para o administrador (TOTP/WebAuthn).
- [ ] Validar segurança de cookies, proxy, CSP, HTTPS e permissões em homologação.
- [ ] Fazer revisão independente de autenticação, autorização, RLS e dados pessoais.
3. Planos, contratação e cobrança Asaas — P0
Responsável: A definir
- [x] Criar catálogo de planos e snapshots imutáveis de preços e condições contratadas.
- [x] Criar tela de assinatura, escolha/troca de plano antes do checkout e limites de usuários.
- [x] Implementar adaptador Asaas sandbox (sem credenciais reais homologadas).
- [x] Implementar cobrança mensal e implantação avulsa como obrigações separadas.
- [x] Gerar fluxo de faturas hospedadas Pix/boleto (conforme integração sandbox).
- [x] Implementar webhook autenticado, eventos únicos e consulta ao estado atual do provedor.
- [x] Implementar worker persistente, jobs com tentativas, conciliação e prevenção de duplicidades.
- [x] Modelar ativação após pagamentos exigidos, inadimplência, estorno e cancelamento.
- [ ] Configurar conta/chaves Asaas sandbox, endpoint HTTPS de webhook e habilitar checkout apenas em homologação.
- [ ] Homologar ponta a ponta cadastro → e-mail → cobrança → webhook → ativação.
- [ ] Testar perda de resposta, pagamentos parciais, estornos, reprocessamento e falhas do worker com Asaas real de sandbox.
- [ ] Implementar recuperação guiada de comandos financeiros incertos e recontratação após cancelamento.
- [ ] Implementar mudanças automáticas de plano e concessões/negociações Enterprise, se aprovadas.
- [ ] Revisar políticas de cobrança, impostos, notas fiscais e reembolsos antes de produção.
4. Landing, cadastro e experiência web — P0/P1
Responsável: A definir
- [x] Criar landing page institucional, páginas de preços, contato, FAQ e textos jurídicos preliminares.
- [x] Criar telas de cadastro, entrada, verificação de e-mail e recuperação de senha.
- [x] Criar área autenticada com visão inicial, assinatura, equipe e configurações.
- [x] Criar onboarding básico com nome, cor, canais e horário da empresa.
- [x] Criar demonstração navegável isolada em /demo com dados fictícios.
- [ ] Implementar upload seguro de logo da empresa e completar identidade visual no onboarding.
- [ ] Integrar o onboarding aos equipamentos, documentos e QR Codes reais do P1.
- [ ] Executar testes Playwright em Chromium e conferir responsividade nas larguras previstas.
- [ ] Auditar navegação por teclado, contraste, acessibilidade e fluxos em dispositivos reais.
- [ ] Revisar a comunicação do site para não anunciar recursos da demo como prontos.
5. Console administrativo EWS — P0
Responsável: A definir
- [x] Criar acesso e painel administrativo separado da área dos fabricantes.
- [x] Criar visão de empresas, assinantes, contratos, indicadores e MRR.
- [x] Criar gestão de catálogo de planos, suspensão administrativa e trilhas de auditoria.
- [x] Criar visualização de webhooks, jobs, solicitações e conciliação.
- [x] Implementar rotina de criação segura de administrador sem conta padrão.
- [ ] Homologar confirmação administrativa por e-mail e implementar MFA forte.
- [ ] Criar procedimento auditável para recuperação de falhas financeiras e tarefas mortas.
- [ ] Testar permissões administrativas em infraestrutura real e monitorar eventos suspeitos.
6. Módulos industriais do produto — P1 (a construir)
Responsável: A definir
- [ ] Cadastrar clientes, modelos de equipamentos e unidades vendidas por fabricante.
- [ ] Implementar importação CSV/XLSX com prévia, validação e erros por linha.
- [ ] Gerar QR Code real por unidade/lote com token público aleatório e seguro.
- [ ] Criar portal público real de cada equipamento com dados controlados.
- [ ] Implementar armazenamento S3 privado, upload de documentos e arquivos versionados.
- [ ] Cadastrar manuais e documentos públicos/privados com controle de acesso.
- [ ] Cadastrar peças, kits, estoque/compatibilidade por modelo e versão, conforme escopo.
- [ ] Implementar pedidos de peças e solicitações reais de pós-venda.
- [ ] Criar cotações com itens, frete, desconto, validade, histórico e PDF.
- [ ] Diferenciar aceite de proposta de venda confirmada, com histórico e métricas reais.
- [ ] Implementar chamados de assistência, responsáveis, mensagens, anexos e notificações.
- [ ] Criar dashboard operacional e relatórios baseados em dados reais.
- [ ] Testar isolamento e limites de plano em cada novo módulo.
- [ ] Integrar toda a jornada fabricante → cliente → QR → solicitação → cotação → atendimento.
7. Qualidade, testes e validação — P0/P1
Responsável: A definir
- [x] Criar testes automatizados de autenticação, contratos, cobrança e segregação por empresa.
- [x] Registrar 25 testes aprovados em PGlite e pnpm typecheck sem erros (evidência de 24/10/2026).
- [x] Registrar pnpm build aprovado com páginas Next.js compiladas.
- [x] Escrever suíte Playwright para marketing, demo e acesso restrito.
- [x] Criar runner test:postgres para banco nativo descartável.
- [ ] Executar novamente a suíte no código atual e salvar log/commit/ambiente.
- [ ] Executar a suíte Playwright: 8 cenários escritos, ainda sem execução aprovada na entrega revisada.
- [ ] Rodar testes em PostgreSQL 16 nativo com concorrência e cargas representativas.
- [ ] Homologar e-mails reais, Asaas sandbox e restore do banco.
- [ ] Implementar CI com verificações obrigatórias em Pull Requests.
- [ ] Fazer testes de regressão completos após a implantação dos módulos P1.
8. Infraestrutura, LGPD e lançamento — P1
Responsável: A definir
- [x] Preparar exemplos de ambiente, orientações de operação e backup com pg_dump.
- [x] Criar endpoints de saúde/prontidão e documentação de API, arquitetura e critérios de liberação.
- [x] Manter bloqueio explícito de produção no apps/api/src/config.ts durante a fase P0.
- [ ] Definir hospedagem real da web, API persistente, worker e PostgreSQL gerenciado.
- [ ] Configurar HTTPS, DNS, segredos e separação entre dev/homologação/produção.
- [ ] Automatizar backup criptografado fora da infraestrutura e comprovar restauração (RPO/RTO).
- [ ] Configurar monitoramento, alertas, logs seguros e tratamento de jobs com falhas.
- [ ] Finalizar termos, LGPD, política de privacidade, retenção, suporte e contratos comerciais.
- [ ] Fazer revisão independente de segurança, privacidade, dependências e faturamento.
- [ ] Concluir todo o P0, os módulos mínimos do P1 e o fluxo integral de homologação.
- [ ] Obter autorização expressa da EWS Tech para retirar o bloqueio de produção.
- [ ] Fazer piloto controlado com clientes de teste antes de vender/publicar.
Referências de status e evidências: [STATUS](docs/STATUS.md) · [VALIDATION](docs/VALIDATION.md) · [RELEASE-GATES](docs/RELEASE-GATES.md) · [ASAAS](docs/ASAAS.md).
Para dar [x] em uma validação: anotar o resultado, ambiente, data, evidência e commit. Nenhum item acima autoriza cobrança real ou uso de dados de clientes.
Começar no Windows / PowerShell
Instale Node.js 24 LTS, pnpm 11.25.0 e Docker Desktop. Abra um terminal dentro da pasta ews-aftersales, onde está o package.json.
corepack enable
corepack prepare pnpm@11.25.0 --activate
Copy-Item .env.example .env
pnpm install --frozen-lockfile
docker compose up -d --wait
pnpm db:migrate
Se corepack não estiver instalado, instale o pnpm pela instrução oficial em https://pnpm.io/installation. As senhas do Compose são exclusivamente de desenvolvimento e as portas são vinculadas ao localhost.

Em três terminais, sempre na raiz do projeto:
# Terminal 1 — API
pnpm dev:api

# Terminal 2 — e-mails, checkout e conciliação
pnpm worker

# Terminal 3 — frontend
pnpm dev
Abra http://localhost:3000. A API está em http://localhost:4000 e a caixa de e-mails de desenvolvimento em http://localhost:8025 (Mailpit). O navegador conversa com /api/... no mesmo domínio; o Next encaminha as requisições ao Fastify. Por isso as sessões não dependem de cookies entre domínios.

Sem Docker: use um PostgreSQL 16 disponível, crie o banco e uma role ews_app com LOGIN NOSUPERUSER NOBYPASSRLS, configure URLs distintas de migração e aplicação no .env e execute pnpm db:migrate. A role precisa existir antes da primeira migração. Nunca use a role superuser na API.
Testar a criação de conta
1. Abra Preços, escolha um plano e cadastre uma empresa de teste.
2. No Mailpit, abra o e-mail de confirmação. Sem o worker, o e-mail fica aguardando na fila do banco.
3. Confirme o e-mail e revise os valores em Assinatura.
4. O checkout vem desabilitado. Para habilitá-lo, configure o sandbox conforme [ASAAS.md](docs/ASAAS.md).
5. Pague as duas cobranças usando os mecanismos de simulação do próprio Asaas. A confirmação por webhook + consulta ao provedor libera a configuração.
Não existe botão ou endpoint para simular pagamento na aplicação. O provedor falso existe somente nos testes automatizados. Não há usuário, senha ou conta administrativa padrão.
Criar seu administrador EWS
pnpm admin:create
O comando pede nome, e-mail e senha sem exibi-la. Ele cria um usuário EWS separado dos usuários de fabricantes. Entre em /entrar; após a senha, um link de confirmação administrativa será enviado ao e-mail. O painel fica em /ews-admin. Em desenvolvimento, leia esse link no Mailpit. Confirmação por e-mail não equivale a MFA resistente a phishing; TOTP/WebAuthn permanece no checklist de lançamento.
O que há em cada pasta
Caminho	Responsabilidade
apps/web/app	Landing, preços, autenticação, demo, painel da empresa e console EWS
apps/web/components	Componentes, formulários, navegação e design system
apps/api/src/app.ts	API REST, autenticação, autorização e rotas P0
apps/api/src/billing.ts	Obrigações separadas, criação segura, conciliação e estados
apps/api/src/asaas.ts	Cliente HTTP exclusivo do sandbox
apps/api/src/jobs.ts	Fila persistente, tentativas e processamento
packages/db/migrations	Schema, constraints, RLS e índices versionados
packages/shared/validation.ts	Validações compartilháveis, CNPJ e formulários
tests/integration.test.ts	Cenários de segurança e cobrança com PostgreSQL WASM
tests/e2e/product.spec.ts	Testes Playwright de interface
docs	Arquitetura, API, integração, operação e pendências


SQL parametrizado e migrations SQL foram usados no lugar de ORM para tornar políticas de isolamento e transações explícitas. Não há concatenação de valores de usuário em SQL. As dependências resolvidas estão fixadas no pnpm-lock.yaml.
Verificações
pnpm typecheck
pnpm test
# Com o PostgreSQL local ativo: cria e remove somente um banco de teste aleatório
pnpm test:postgres
pnpm build

# Com frontend, API e banco em execução:
pnpm exec playwright install chromium
pnpm test:e2e
Os testes da API usam PGlite, motor PostgreSQL em WASM, sem Docker. Executam as migrations e usam a role ews_app sem bypass de RLS. Não substituem a homologação em um servidor PostgreSQL 16, testes de carga/concurrency ou o sandbox externo.

O Playwright requer seu Chromium instalado. Neste ambiente de entrega, a instalação do navegador falhou; a suíte foi entregue, mas não foi aprovada como executada. A landing e o fluxo demonstrativo foram revisados no navegador remoto. Veja o registro exato em [VALIDATION.md](docs/VALIDATION.md).
Demonstração
/demo é uma experiência local isolada por sessionStorage: cadastro ilustrativo de equipamento, pedido de peça, cotação, aceite, confirmação de venda e chamado. Usa dados fictícios e não chama a API operacional. Aceite de proposta não contabiliza venda; somente a confirmação do fabricante altera o valor demonstrativo. Não use essa demo para afirmar que o P1 está implementado.
Publicação futura
Nada foi publicado, nenhuma infraestrutura foi comprada e nenhuma cobrança real foi criada. config.ts recusa NODE_ENV=production e chaves Asaas de produção nesta etapa. O frontend pode ser compilado para auditoria, mas a API tem bloqueio explícito de lançamento.

Após concluir os critérios em [RELEASE-GATES.md](docs/RELEASE-GATES.md), revisar a implementação e receber autorização, a arquitetura permite Next na Vercel, API e worker em serviço persistente, PostgreSQL gerenciado e storage S3 para o P1. O proxy /api deve preservar o domínio da aplicação, e APP_ORIGIN deve ser o domínio HTTPS exato.
Atualizar o repositório no GitHub
Repositório: https://github.com/EdwynWs/ews-aftersales. Para mudanças de código, use branches e Pull Requests. Atualize os checkboxes apenas após implementação e validação, indicando a evidência.

Não envie .env, .local, node_modules, backups, chaves de API ou relatórios com informações privadas.
