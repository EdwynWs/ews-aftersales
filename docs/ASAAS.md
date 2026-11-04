# Asaas — integração e homologação sandbox

Nenhuma credencial Asaas foi fornecida nesta entrega. A integração foi desenvolvida a partir da documentação oficial consultada em 24/10/2026 e testada com um gateway controlado. **Não foi executada uma contratação em conta Asaas.**

## Configuração

1. Crie ou utilize uma conta em https://sandbox.asaas.com. Sandbox e produção são ambientes separados.
2. Gere a chave de API no ambiente sandbox e configure `ASAAS_API_KEY` no `.env` local. Não a coloque no frontend, GitHub ou chat. O cliente usa somente `https://api-sandbox.asaas.com/v3` e recusa chave de produção.
3. Gere um token aleatório próprio para o webhook, com pelo menos 32 caracteres, e configure `ASAAS_WEBHOOK_TOKEN`. Ele não deve ser a chave da API.
4. Disponibilize a API em uma URL HTTPS de homologação que você controla. Neste trabalho não foi aberto túnel nem publicado serviço.
5. Cadastre o webhook apontando para `/webhooks/asaas` na API, ou `/api/webhooks/asaas` se o endpoint for acessado pelo proxy do frontend. Use a URL final, sem redirects.
6. Configure o `authToken` igual a `ASAAS_WEBHOOK_TOKEN`. O Asaas o envia no header `asaas-access-token`.
7. Selecione eventos de cobranças: criação, confirmação, recebimento, vencimento, atualização, remoção, restauração, recusa, estorno e chargeback; e eventos de alteração/encerramento de assinatura. Use os nomes que a documentação/conta atual oferece.
8. Mantenha API e worker em execução. Só então configure `CHECKOUT_ENABLED=true` e reinicie ambos.
9. `APP_ORIGIN` deve ser a origem exata do frontend, sem barra no final. Para usar domínio de homologação, atualize os links de e-mail e proxy junto.

## Fluxo entregue

O checkout agenda um job único. O worker cria/reconcilia três etapas com referência externa: cliente, assinatura mensal e implantação avulsa. A assinatura gera as mensalidades; a aplicação busca suas cobranças. O vencimento inicial é ancorado no início do checkout mais três dias. A empresa recebe dois links de faturas hospedadas.

Meios implementados: **PIX e BOLETO**, com pagamento manual a cada ciclo. Não foi implementado cartão, tokenização de cartão ou Pix Automático. Não há armazenamento de cartão. Não confundir esta integração por faturas com a API específica de sessões de Checkout Asaas.

Um evento autenticado é registrado antes da resposta HTTP 200. Um job consulta o estado atual da cobrança, confere cliente, valor e vínculo contratual, e recalcula a assinatura. O retorno de uma página de pagamento não muda o estado financeiro. A primeira mensalidade e a implantação precisam estar confirmadas. `CONFIRMED` ou `RECEIVED` qualificam a ativação; a tela financeira só contabiliza `RECEIVED` como recebimento.

A conciliação periódica cobre implantação e mensalidades. As diferenças de eventuais taxas do gateway não são confundidas com o valor de face do contrato. Não há cálculo fiscal ou emissão de NF nesta etapa.

## Roteiro obrigatório de homologação

| Cenário | Resultado esperado |
| --- | --- |
| Criar conta, verificar e-mail e iniciar contratação | Exatamente um cliente, uma assinatura e uma implantação |
| Atualizar página/repetir início | Mesma contratação; nenhuma cobrança inicial duplicada |
| Pagar apenas implantação | `partially_paid`, sem configuração operacional |
| Pagar primeira mensalidade | `active`, e-mail de boas-vindas e onboarding |
| Retornar à aplicação antes do webhook | Não ativa pelo redirecionamento |
| Reentregar mesmo ID de evento | Um evento e um job persistidos |
| Token de webhook inválido | 401, sem evento persistido |
| Entregar evento antigo depois de estorno | Consulta atual mantém suspensão |
| Perder resposta de criação no gateway | Recupera referência existente; se incerto, exige revisão |
| Cobrança com cliente/valor divergente | Não contabiliza nem ativa |
| Cobrança vencida | Prazo de regularização; depois, suspensão sem apagar dados |
| Pagamento regularizado | Estado recalculado sem intervenção que falsifique pagamento |
| Cancelamento | Interrompe recorrência e registra fim do acesso contratado |
| Cancelamento durante checkout | Não deixa assinatura recorrente órfã |
| Worker indisponível | Evento/solicitação permanecem no banco até retomar |
| Provedor indisponível | Retry com backoff; depois, item permanece para intervenção |

Use somente os mecanismos oficiais do sandbox para confirmar pagamentos. Não altere o banco para declarar um pagamento real e não use o FakeGateway fora dos testes. Confira também os logs de entrega do provedor.

## Erros e recuperação

`REVIEW_REQUIRED`: uma chamada pode ter chegado ao Asaas, mas não houve resposta verificável. Procure a `externalReference` da etapa no sandbox. Se existir exatamente um recurso correto, reprocessar o job volta a consultá-lo e o associa sem criar outro. Não limpe a referência nem o estado de comando às cegas.

Se não existir recurso confirmado, **não há botão para resetar automaticamente o comando**. O diagnóstico deve registrar tentativas, logs e evidência do provedor antes de uma intervenção específica. Esta recuperação avançada precisa de roteiro operacional homologado; permanecer bloqueado é preferível a duplicar cobranças.

O console EWS permite consultar erros e reprocessar jobs pendentes com justificativa. Isso reinicia tentativas do job, mas preserva a proteção do comando incerto. Webhooks usam somente a projeção mínima necessária do evento, sem dados completos de cartão ou informações pessoais irrelevantes nos logs.

O cancelamento usa a remoção da assinatura. Segundo a documentação atual, essa operação também remove cobranças pendentes/vencidas vinculadas. A implantação avulsa pendente/vencida é removida separadamente; valores pagos não são reembolsados automaticamente. Homologue os eventos e links de fatura resultantes.

## Fontes oficiais consultadas

- Sandbox: https://docs.asaas.com/docs/sandbox-2
- API e ambientes: https://docs.asaas.com/docs/chaves-de-api
- Recebimento/autenticação: https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
- Eventos de cobrança: https://docs.asaas.com/docs/webhook-para-cobrancas
- Criar assinatura: https://docs.asaas.com/reference/criar-nova-assinatura
- Listar assinaturas e referência externa: https://docs.asaas.com/reference/listar-assinaturas
- Criar cobrança: https://docs.asaas.com/reference/criar-nova-cobranca
- Listar cobranças: https://docs.asaas.com/reference/listar-cobrancas
- Listar clientes: https://docs.asaas.com/reference/listar-clientes
- Remover assinatura: https://docs.asaas.com/reference/remover-assinatura
- Excluir cobrança: https://docs.asaas.com/reference/excluir-cobranca

Rever a documentação ao homologar. Uma referência consultada não comprova que o comportamento da conta foi testado.
