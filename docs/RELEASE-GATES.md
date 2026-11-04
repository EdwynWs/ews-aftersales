# Critérios para avançar e liberar

## Fechar P0

- [ ] Instalar e migrar em PostgreSQL 16, com API usando role sem superuser/BYPASSRLS.
- [ ] Executar os testes em servidor PostgreSQL real, incluindo duas conexões concorrentes.
- [ ] Validar envio SMTP, verificação, convite, recuperação e acesso administrativo.
- [ ] Configurar Asaas sandbox e homologar a matriz de ASAAS.md.
- [ ] Validar criação parcial, perda de resposta, cancelamento durante criação e reprocessamento de fila.
- [ ] Completar recuperação guiada dos casos incertos e recontratação após cancelamento.
- [ ] Executar Playwright nas cinco larguras e auditar navegação por teclado/contraste.
- [ ] Validar backup/restauração, alarmes, recuperação do worker e segredos.
- [ ] Concluir logo/upload e a parte de onboarding necessária ao primeiro equipamento com a fundação P1.

## Construir P1 após a base verificada

1. Modelos, clientes e unidades com chaves compostas por tenant, limites sob lock e importação com prévia/erros por linha.
2. Tokens públicos aleatórios estáveis e QR PNG/SVG. Respostas públicas devem ser DTOs com allowlist; não retornar o registro inteiro da unidade.
3. S3 privado, upload validado, versionamento, documentos públicos/privados, autorização e URLs temporárias.
4. Peças, kits e compatibilidade explícita por modelo/versão.
5. Solicitações, cotação com itens em centavos, frete/desconto, validade, histórico, acesso seguro e PDF.
6. Aceite separado de confirmação de venda; referência externa e valor confirmado; indicadores derivados do banco.
7. Tickets, responsáveis, mensagens, anexos e notificações com autorização de solicitante.
8. Completar onboarding, dashboard, relatórios e testes operacionais/multiempresa.

## Antes de vender/publicar

- [ ] Requisitos P0/P1 atendidos e nenhuma funcionalidade comercial anunciada como pronta estando apenas na demo.
- [ ] Credenciais finais configuradas somente após autorização de lançamento.
- [ ] Termos, privacidade, cancelamento, dados empresariais e condições de implantação revisados.
- [ ] Suporte, SLA, retenção, incidentes e solicitações de titulares definidos e executáveis.
- [ ] Revisão independente de autorização, RLS, uploads, cobranças, privacidade e dependências.
- [ ] MFA administrativo apropriado, CSP, HTTPS e cookies Secure validados.
- [ ] Rate limiting compartilhado caso haja várias réplicas.
- [ ] Backups externos e restauração exercitada; RPO/RTO registrados.
- [ ] Monitoramento, alertas e operação de dead letters testados.
- [ ] Autorização expressa de Edwyn/EWS para publicar e ativar cobranças reais.

O arquivo de configuração recusa produção nesta versão. A fase atual não autoriza remover o bloqueio nem fazer deploy.
