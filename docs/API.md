# API REST P0

Base local: `http://localhost:4000`. Pelo navegador: `/api` no domínio Next.

Todas as rotas mutáveis, exceto o webhook, exigem `Origin` igual a `APP_ORIGIN`. Rotas autenticadas mutáveis também exigem `x-csrf-token` retornado por `GET /auth/session`. Autenticação por cookie `ews_session`; o frontend nunca armazena um bearer token.

Erros usam `{code, message}`; validações incluem `fields: [{field, message}]`. Códigos HTTP: 400 validação, 401 sessão/credencial, 402 assinatura, 403 autorização/origem/CSRF, 404 inexistente, 409 conflito, 429 limite, 5xx falha de integração/serviço. Valores monetários de resposta estão em centavos, salvo as chamadas internas do adaptador Asaas.

## Rotas

| Método | Rota                                | Acesso                                              |
| ------ | ----------------------------------- | --------------------------------------------------- |
| GET    | `/health`                           | Público                                             |
| GET    | `/ready`                            | Público                                             |
| GET    | `/public/plans`                     | Público                                             |
| POST   | `/public/contact`                   | Público                                             |
| POST   | `/auth/signup`                      | Público                                             |
| POST   | `/auth/login`                       | Público                                             |
| GET    | `/auth/session`                     | Sessão autenticada                                  |
| POST   | `/auth/logout`                      | Sessão autenticada                                  |
| POST   | `/auth/verify`                      | Token de confirmação                                |
| POST   | `/auth/admin-confirm`               | Token administrativo após senha                     |
| POST   | `/auth/resend-verification`         | Sessão autenticada                                  |
| POST   | `/auth/forgot-password`             | Público                                             |
| POST   | `/auth/reset-password`              | Token de recuperação                                |
| GET    | `/auth/organizations`               | Sessão autenticada                                  |
| POST   | `/auth/organization`                | Sessão autenticada                                  |
| GET    | `/me/billing`                       | Admin verificado da empresa                         |
| PUT    | `/me/plan`                          | Admin verificado da empresa                         |
| POST   | `/me/checkout`                      | Admin verificado da empresa                         |
| POST   | `/me/reconcile`                     | Admin verificado da empresa                         |
| POST   | `/me/cancel`                        | Admin verificado da empresa                         |
| GET    | `/me/organization`                  | Membro verificado da empresa                        |
| PUT    | `/me/organization`                  | Admin verificado; assinatura com acesso operacional |
| POST   | `/me/onboarding/complete`           | Admin verificado; assinatura com acesso operacional |
| GET    | `/me/team`                          | Admin verificado da empresa                         |
| POST   | `/me/team/invite`                   | Admin verificado; assinatura com acesso operacional |
| POST   | `/auth/accept-invite`               | Token de convite e credenciais                      |
| DELETE | `/me/team/:id`                      | Admin verificado; assinatura com acesso operacional |
| POST   | `/me/requests`                      | Admin verificado da empresa                         |
| GET    | `/me/audit`                         | Admin verificado da empresa                         |
| POST   | `/webhooks/asaas`                   | Token de webhook                                    |
| GET    | `/ews/overview`                     | EWS admin                                           |
| GET    | `/ews/organizations`                | EWS admin                                           |
| GET    | `/ews/organizations/:id`            | EWS admin                                           |
| POST   | `/ews/organizations/:id/suspension` | EWS admin                                           |
| POST   | `/ews/organizations/:id/reconcile`  | EWS admin                                           |
| GET    | `/ews/plans`                        | EWS admin                                           |
| PUT    | `/ews/plans/:plan`                  | EWS admin                                           |
| GET    | `/ews/inbox`                        | EWS admin                                           |
| GET    | `/ews/events`                       | EWS admin                                           |
| GET    | `/ews/jobs`                         | EWS admin                                           |
| POST   | `/ews/jobs/:id/retry`               | EWS admin                                           |

`/auth/session`, logout, reenvio de verificação e troca/listagem de organizações exigem sessão, apesar de estarem no grupo `/auth`. Verificação, recuperação e convite usam seus próprios tokens de uso único. As rotas da empresa exigem membership na organização da sessão; não há parâmetro livre de tenant.

## Payloads principais

### Cadastro

`POST /auth/signup`: `{name, email, password, company, cnpj, phone, plan, terms:true}`. Senha entre 12 e 128 caracteres. `plan`: start/growth/industry. CNPJ normalizado, com DV validado. Retorna mensagem e cookie de sessão; não retorna token de verificação. Cliente confirma pelo e-mail enviado pela fila.

### Login e tokens

`POST /auth/login`: `{email,password}`. Retorna `{ok:true}` ou `{emailChallenge:true,message}` para EWS. Login EWS não define sessão antes da confirmação adicional.

`POST /auth/verify` e `/auth/admin-confirm`: `{token}`. `POST /auth/forgot-password`: `{email}`. `POST /auth/reset-password`: `{token,password}`; invalida sessões e todos os tokens anteriores. Links usam fragmento no navegador e são removidos da barra antes do POST.

`POST /auth/organization`: `{orgId}`. ID precisa pertencer a um membership do usuário atual. Não autoriza uma empresa arbitrária.

### Contratação

`PUT /me/plan`: `{plan}`; somente antes de `checkout_started_at`.

`POST /me/checkout`: `{billingType:'PIX'|'BOLETO',accepted:true}`; exige e-mail verificado, admin e gateway habilitado. Persiste autorização e job único. Resposta não representa pagamento.

`GET /me/billing`: snapshot de contrato, status, cobranças, links de fatura permitidos, comandos e informação de habilitação do sandbox.

`POST /me/reconcile`: `{}`. Agenda sincronização, sem fabricar confirmação.

`POST /me/cancel`: `{confirmation:'CANCELAR',reason}`; motivo com pelo menos cinco caracteres. Registra data e solicitação de remoção no provedor; não apaga dados nem reembolsa automaticamente.

### Organização, onboarding e equipe

`PUT /me/organization`: `{brandName,brandColor,supportEmail,supportPhone,hours}`. `brandColor` precisa ser hexadecimal de seis posições. Requer assinatura autorizada e admin. `POST /me/onboarding/complete`: `{}`, somente depois de salvar identidade.

`POST /me/team/invite`: `{email,role}`. Perfis: admin/commercial/support/technician. Conta convites pendentes no limite do plano sob lock. `POST /auth/accept-invite`: `{token,name,password}`; para conta existente, exige a senha atual. `DELETE /me/team/:id` remove o membership da própria empresa e suas sessões; autoexclusão não é permitida.

`POST /me/requests`: `{kind:'upgrade'|'support'|'privacy',message}`. Não altera contrato nem cobra upgrade; registra solicitação para a EWS.

### Console EWS

`GET /ews/organizations`: `?page=1&q=texto`, 30 por página. `/ews/organizations/:id` retorna dados, cobranças e auditoria daquela organização. Requer usuário EWS, não basta ser admin de fabricante.

`POST /ews/organizations/:id/suspension`: `{suspended:boolean,reason}` com motivo de pelo menos dez caracteres. Remover suspensão administrativa recalcula o estado financeiro; não sobrepõe inadimplência.

`PUT /ews/plans/:plan`: `{monthly_cents,setup_cents,equipment_limit,user_limit,active,features,reason}`. Recursos permitidos: equipment/documents/requests/parts/quotes/tickets/reports/advanced_roles. Altera catálogo e revisão; contratos permanecem no snapshot anterior.

`POST /ews/jobs/:id/retry`: `{reason}`. Exige job pendente sem lease ativo e registra auditoria. Reinicia tentativas, sem resetar comandos financeiros incertos.

### Webhook

Header `asaas-access-token` com token dedicado. Corpo mínimo: `{id,event,payment:{id}}` ou `{id,event,subscription:{id}}`. Campos desconhecidos são ignorados, e o ID do evento deve ser único. Responde 200 só após persistência transacional do evento e do job. Falha de autenticação: 401. A regra de ativação depende da consulta ao provedor.

## Contrato máquina legível

`openapi.json` é um inventário OpenAPI 3.1 das rotas implementadas. Os corpos são documentados acima; o JSON não reproduz todos os refinamentos Zod. A validação executável autoritativa está em `app.ts` e `packages/shared/validation.ts`.
