# Operação local, backup e publicação futura

## Processos

Frontend: `pnpm dev`; API: `pnpm dev:api`; worker: `pnpm worker`. API e worker usam o `.env` da raiz. O Next usa `apps/web/.env.local` quando for necessário sobrescrever `API_INTERNAL_URL`; o valor padrão é `http://127.0.0.1:4000`.

`/health` informa processo vivo; `/ready` faz consulta simples ao banco. Nenhum deles prova que o gateway ou SMTP está disponível. Verifique também o console de fila, cobrança mais antiga não conciliada, falhas de autenticação e espaço do banco.

Em infraestrutura futura, API e worker precisam de processos persistentes. Não executar o worker em uma função serverless curta. Supervisão deve reiniciar processos, registrar apenas códigos de erro seguros e alertar sobre jobs que atingem oito tentativas.

## Migrações

`pnpm db:migrate` usa a role de migração, advisory lock e transação por arquivo. `schema_migrations` impede aplicação repetida. As roles são separadas; `ews_app` precisa existir antes da primeira migração. O Compose prepara a role no primeiro boot do volume. Alterar o SQL de inicialização não muda volumes já existentes.

Não apagar o volume para consertar uma migração em ambiente com dados úteis. Faça backup e corrija com uma nova migração versionada. Para ambientes de teste descartáveis, recriar banco exige decisão explícita de quem o administra.

## Backups

Instale os clientes PostgreSQL da versão compatível. Configure `BACKUP_DATABASE_URL` para uma credencial própria com acesso de leitura suficiente a todos os tenants. Em desenvolvimento, o script pode usar `MIGRATION_DATABASE_URL`. Execute:

```sh
pnpm backup
```

O script chama `pg_dump --format=custom --no-owner`, passa a senha em variável de ambiente do processo, salva em `backups` com permissão restrita e não inclui credenciais no nome do arquivo. Defina `BACKUP_DIRECTORY` para outro diretório. O backup não inclui roles globais nem objetos S3 futuros.

Para agendar, use o agendador do sistema ou provedor em uma máquina com credenciais restritas, retenção definida e cópia criptografada fora do servidor. Não foi criada uma automação de backup nesta entrega. Não confunda dump local com backup recuperável.

## Teste de restauração obrigatório

1. Crie uma instância ou banco **novo e isolado**, nunca a URL de produção.
2. Crie a role `ews_app` sem superuser/BYPASSRLS.
3. Use `pg_restore --no-owner --exit-on-error --dbname <banco-de-restauracao> <arquivo.dump>` com credenciais via ambiente/arquivo protegido. Não use `--clean` contra um banco compartilhado.
4. Aponte uma instância separada da API para o banco restaurado, mantenha o checkout desabilitado e não execute o worker com credenciais externas.
5. Compare contagens de organizações, memberships, contratos, cobranças e eventos; confirme constraints e migrations.
6. Teste login com conta descartável, isolamento A/B, leitura de auditoria e ausência de dados privados em respostas públicas.
7. Registre data, duração, responsável, RPO/RTO observados e evidência. Só depois descarte o ambiente isolado conforme a política.

A restauração **não foi executada** neste ambiente. Precisa ser concluída antes do lançamento.

## Hospedagem após autorização

Separar Next, API, worker, banco e storage. O proxy de `/api` deve manter cookies em primeira parte. `APP_ORIGIN` precisa corresponder ao domínio HTTPS final. Aplicar cookie Secure, HTTPS/HSTS apropriado, política CSP com nonce compatível com Next e armazenamento centralizado do rate limiting antes de múltiplas réplicas.

A API possui bloqueio de produção intencional nesta etapa. Remover esse bloqueio não torna o produto pronto: exige revisão dos gates e autorização expressa. Storage S3 ainda não foi implementado; no P1, usar bucket privado, validação de assinatura/tipo/tamanho, autorização por tenant e URLs assinadas curtas. Nunca confiar apenas em MIME ou extensão enviados pelo cliente.

## Ambiente de QA adicional

`pnpm dev:qa` é um harness de revisão: sobe a build Next e uma API com banco PGlite persistente em `.local`, checkout desabilitado e captura de e-mails para arquivo local. Requer `pnpm build` antes. Configure a origem local em `.local/qa-origin` se não usar localhost:3000. Esse modo não é o ambiente de instalação principal e não testa SMTP, Postgres via rede ou Asaas. Nunca exponha `.local`, e-mails ou esse harness publicamente.
