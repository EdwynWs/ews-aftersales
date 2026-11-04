# Validação da entrega — 24/10/2026

Este registro descreve verificações realmente executadas, sem equivaler a aceite do P0 ou homologação de produção.

| Verificação                          | Resultado                                                                | Limite da evidência                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                     | Aprovado: API, scripts, testes e frontend                                | Verificação estática TypeScript                                                                                |
| `pnpm test`                          | **25 testes aprovados; zero falhas**                                     | API Fastify com PostgreSQL WASM (PGlite), role `ews_app` sem bypass e gateway controlado                       |
| `pnpm build`                         | Aprovado: compilação Next e geração das 23 páginas indicadas no log      | Não implica disponibilidade de API, gateway ou SMTP                                                            |
| `pnpm audit --prod --json`           | Zero vulnerabilidades conhecidas reportadas nas dependências de produção | Consulta pontual ao catálogo; não é auditoria completa de segurança                                            |
| Revisão no navegador                 | Landing e demo navegadas em desktop                                      | Na demo, aceite manteve receita em R$ 0; confirmação da venda alterou para R$ 250                              |
| `pnpm test:e2e`                      | Bloqueado antes de iniciar o navegador                                   | Oito casos escritos; Chromium ausente e instalação retornou arquivo inválido. Nenhum foi marcado como aprovado |
| PostgreSQL 16 / `pnpm test:postgres` | Não executado neste ambiente                                             | Docker/servidor PostgreSQL indisponível; runner isolado entregue para execução local                           |
| Asaas, SMTP e restauração            | Não homologados                                                          | Requerem instalação e configuração conforme README, ASAAS.md e OPERATIONS.md                                   |

## Cobertura dos testes de integração

- Hash de senha com sal, credencial incorreta e CNPJ.
- Cadastro, snapshots de contrato, cookie opaco e ausência de token de e-mail na resposta.
- Confirmação de e-mail de uso único e bloqueio de checkout sem confirmação.
- Origin, CSRF, permissões EWS e isolamento RLS entre duas empresas, inclusive tentativa de escrita e alteração de auditoria.
- Bloqueio de configuração sem assinatura e rejeição de tenant injetado no corpo.
- Checkout repetido, cobranças separadas e impossibilidade de ativação por retorno de URL.
- Webhook com autenticação inválida, repetição e consulta ao estado atual do provedor.
- Pagamento parcial, ativação, estorno, evento atrasado, valores/clientes divergentes e URLs de fatura não permitidas.
- Persistência do onboarding, perda de resposta do provedor, recuperação por referência externa e comando incerto que bloqueia nova criação.
- Contrato imutável após edição de catálogo, limite de usuários, convites e isolamento de aceite.
- Calendário financeiro, inadimplência, primeira fatura ausente, cancelamento e preservação dos dados.
- Confirmação adicional de login EWS; retry de job restrito, auditado e bloqueado para tarefa concluída ou em execução.
- Reset de senha com revogação de sessões, retry da outbox e remoção do token após envio.
- Rejeição do adaptador sem credenciais, conciliação da implantação sem webhook e cancelamento durante o checkout sem assinatura órfã no provedor controlado.

## O que estes testes não demonstram

O adaptador PGlite serializa conexões. Os testes de corrida intercalam operações no código, mas não demonstram comportamento sob múltiplas conexões PostgreSQL ou processos concorrentes. O runner `test:postgres` usa a mesma suíte em um banco local descartável de nome aleatório; cenários adicionais de concorrência e carga ainda são necessários.

Não houve chamadas autenticadas ao Asaas, pagamentos reais, publicação ou compra de infraestrutura. Layout mobile, navegação por teclado, entrega SMTP, backup/restauração e fluxo completo com gateway externo permanecem no checklist. O frontend compilado não representa um MVP industrial completo: o P1 ainda não foi implementado.
