# Status verificável — 24/10/2026

## Implementado em código

- Landing responsiva, preços lidos do banco, FAQ, contato Enterprise persistido, minutas jurídicas e demonstração isolada navegável.
- Cadastro de empresa e responsável, escolha de plano, validação de CNPJ, hash scrypt, verificação de e-mail, login, recuperação de senha e revogação de sessões.
- Sessões opacas no banco, cookies HttpOnly/SameSite, validação de Origin e token CSRF, rate limiting e erros sem segredos.
- Organizações, memberships, contratos, snapshots de preços/limites/recursos e RLS forçada nas tabelas de tenant.
- Seleção/troca de plano antes do checkout e bloqueio após o início da contratação.
- Adaptador Asaas **sandbox**, criação de cliente, assinatura mensal e implantação avulsa. Faturas hospedadas para **Pix e boleto**.
- Comandos remotos duráveis, referências externas, bloqueio de recriação após resultado incerto, eventos únicos e conciliação consultando estado atual do provedor.
- Pagamentos separados, estado parcial, ativação após ambas as obrigações, vencimento, prazo de regularização, estorno, cancelamento e suspensão administrativa auditada.
- Fila no PostgreSQL com claim, lease, tentativas, backoff e processamento de e-mail/checkout/webhook/sync/cancelamento.
- Onboarding inicial de identidade: nome, cor, canais e horário, prévia e retomada. **Não inclui logo/upload, máquina, documentos, peças e QR.**
- Convites, aceite, perfis, reserva de vagas, limites de usuários e remoção de acesso.
- Console EWS: indicadores, MRR separado de recebimentos, assinantes, consulta/auditoria, planos, suspensão, conciliação, eventos e solicitações.
- Migrations, Compose PostgreSQL/Mailpit, exemplos de ambiente, script administrativo, backup e documentação.

## Implementado, mas ainda sem homologação externa

- Asaas: código e testes com provedor controlado. **Nenhuma chamada autenticada foi validada em conta Asaas nesta entrega.** São necessárias credenciais de sandbox, URL de webhook e execução dos cenários do documento de integração.
- PostgreSQL: migrations e RLS testadas no motor PostgreSQL WASM. Servidor PostgreSQL 16 em Docker não foi executado aqui.
- E-mails: outbox e retry testados com transporte controlado; envio via SMTP/Mailpit precisa ser validado na instalação local.
- Backup/restauração: roteiro e backup script entregues; restauração real não executada.
- Playwright: oito casos escritos. Execução bloqueada pela ausência do Chromium; tentativa de download retornou arquivo inválido. Não confundir com oito cenários de aplicação reprovados: o navegador não chegou a iniciar.

## P0 parcial / pendente

- Homologação ponta a ponta: cadastro → e-mail → pagamento sandbox → webhook → ativação → onboarding.
- Upload seguro de logo e onboarding industrial completo; depende da fundação de storage/documentos/equipamentos no P1.
- Login administrativo por TOTP/WebAuthn; hoje há senha e confirmação adicional por e-mail.
- Mudança automática de plano, recontratação após cancelamento, concessões especiais, propostas Enterprise aprovadas e reembolso automatizado. As solicitações comerciais já são registradas; essas operações ainda precisam de implementação.
- Conciliação manual guiada de comandos incertos. O console permite ver e reprocessar jobs pendentes com auditoria; reset de comandos financeiros incertos continua bloqueado para evitar duplicação.
- Políticas finais de suporte, retenção, privacidade, implantação e contrato.

## P1 e P2 não implementados

CRUDs industriais de clientes, modelos e unidades; importação CSV/XLSX; QR real individual/lote; portal público real por equipamento; uploads S3 e documentos privados/versionados; peças/kits e compatibilidade; solicitações reais; cotações/PDF; confirmação real de vendas; tickets, anexos e relatórios operacionais. Não existem endpoints de mentira para esses recursos. A demo não usa registros de assinantes.

O pedido exige verificar P0 antes de avançar P1. A entrega preserva essa ordem e **não marca P0 como concluído nem o MVP como comercializável**. Próxima etapa concreta: homologar a fundação no ambiente local/sandbox, corrigir divergências do gateway e então executar o roteiro P1.
