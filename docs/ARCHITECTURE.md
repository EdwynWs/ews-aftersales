# Arquitetura e decisões

O navegador acessa Next.js. Requisições a `/api/*` são encaminhadas à API Fastify. A API usa `node-postgres`; o worker é um processo Node persistente separado, com acesso ao mesmo banco. Não existem chamadas ao gateway no frontend.

## Identidade e segregação

O cookie contém 32 bytes aleatórios, e somente seu SHA-256 é persistido em `sessions`. Uma sessão expira em 12 horas; sua organização é selecionada no servidor e precisa ter membership. O frontend nunca escolhe livremente um tenant para leitura/escrita. Mudança de organização valida membership e altera apenas a sessão do solicitante.

Todas as operações de tenant usam uma transação com `SET LOCAL` via `set_config`. As políticas `FORCE ROW LEVEL SECURITY` usam o contexto da transação. As rotas também filtram pela organização; o banco fornece uma segunda barreira. A aplicação recusa roles superuser/BYPASSRLS no startup. Autenticação, worker e rotas administrativas verificadas usam contexto de sistema explícito. Esse contexto é privilégio do serviço, não do usuário, e não protege contra comprometimento completo do servidor ou da credencial de banco.

Senhas usam scrypt N=32768, r=8, p=1, salt aleatório de 16 bytes e saída de 64 bytes. Tokens de verificação, recuperação, convite e acesso EWS são aleatórios, têm expiração e são consumidos uma única vez. A recuperação revoga todas as sessões e tokens do usuário. A fila guarda o link necessário ao envio; após envio bem-sucedido seu payload de e-mail é apagado. O banco e seus backups precisam ser tratados como confidenciais.

POST/PUT/DELETE exigem Origin exato. Rotas autenticadas também exigem token CSRF da sessão. O webhook usa credencial própria, não cookie. `trustProxy=false` por padrão: habilitar proxies exige configuração explícita dos hops/endereço confiável, nunca confiar indiscriminadamente em `X-Forwarded-For`.

## Contratos e dinheiro

`plans` é catálogo; `subscriptions.plan_snapshot` é a condição contratada. Modificar o catálogo não altera contratos existentes. Os valores são inteiros em centavos. Implantação e mensalidade possuem cobranças distintas. Recursos e limites vêm do snapshot no backend. O limite de usuários é aplicado com lock da assinatura, contando memberships e convites válidos. O limite de equipamentos e os recursos industriais aguardam os endpoints P1; não são apresentados como implementados.

`gateway_commands` registra uma intenção **antes** de uma chamada de criação. Cada etapa tem uma `externalReference` estável. Em recuperação, o sistema procura o recurso existente no provedor. Se o resultado anterior foi incerto e não há correspondência confirmada, falha fechado: não reenvia POST e não duplica cobrança. Uma falha anterior ao POST pode também exigir revisão, um custo deliberado para privilegiar ausência de duplicação.

Não se presume suporte a uma chave genérica de idempotência no Asaas. Busca por `externalReference` não é, isoladamente, garantia de unicidade externa: são usados comandos únicos, estado durável e bloqueio após incerteza. Mais de uma correspondência vai para revisão.

Eventos são persistidos por ID único antes de responder 200. O payload retido é uma projeção mínima validada (ID, tipo e ID do recurso), sem copiar dados pessoais/cartão desnecessários. O worker consulta a API do provedor; o status do corpo recebido não libera acesso. Conciliação de uma cobrança é serializada por advisory lock e assinatura bloqueada durante a atualização. Há conferência de ID, cliente, contrato e valor. Uma mensalidade futura isolada não substitui a primeira obrigação.

Ativação exige implantação + primeira mensalidade confirmadas/recebidas. `CONFIRMED` pode liberar acesso, mas somente `RECEIVED` é exibido como receita recebida. Estorno/disputa suspende o acesso. Inadimplência não exclui os dados. Remover suspensão administrativa não fabrica um pagamento: o estado financeiro é recalculado.

## Fila e disponibilidade

`jobs` usa `FOR UPDATE SKIP LOCKED`, lease de dez minutos, ID do executor, oito tentativas e backoff exponencial limitado a uma hora. Jobs relacionados à mesma organização não são iniciados em paralelo enquanto há lease válido. A operação remota é tratada como pelo menos uma vez, portanto handlers precisam ser idempotentes. E-mail pode ser entregue mais de uma vez se o processo cair depois do SMTP aceitar e antes do commit; links são single-use.

Uma manutenção por minuto recalcula regularização e agenda uma conciliação por organização/hora. Essa rotina reconcilia tanto a implantação quanto mensalidades, cobrindo perda de webhook. Após oito falhas, a entrada permanece visível para intervenção; não é descartada. A instalação precisa monitorar fila e idade do evento mais antigo, além de disponibilidade HTTP.

`audit_logs` permite INSERT/SELECT, mas não UPDATE/DELETE para a role da aplicação. Isso não é armazenamento WORM nem impede um administrador do banco de alterar registros. Para garantias maiores, adicionar exportação para destino imutável.

## Limites desta arquitetura inicial

Rate limiting está em memória por processo; múltiplas réplicas exigem store compartilhado. Não há S3, arquivos, métricas de carga, política final de retenção ou SSO nesta etapa. As roles comercial/atendimento/técnico existem, mas suas regras operacionais só serão implementadas com os módulos P1. O frontend protege navegação por UX; toda segurança efetiva é aplicada na API.
