# EWS AFTERSALES — DESENVOLVIMENTO COMPLETO DE PLATAFORMA SAAS B2B

## 1. MISSÃO DO PROJETO

Você será responsável por desenvolver o **EWS AfterSales**, um produto comercial da **EWS Tech**, empresa brasileira de desenvolvimento de softwares, sistemas e soluções digitais.

A referência principal e fonte de requisitos do projeto é o arquivo anexado:

**EWS AfterSales — Dossiê Estratégico Completo — Outubro de 2026 (24 páginas).**

Leia integralmente o PDF antes de começar, incluindo funcionalidades, fluxos, arquitetura, público-alvo, preços, segurança, riscos e critérios de aceite.

Não trate o documento apenas como inspiração visual. Ele é a especificação-base do produto. As instruções abaixo complementam o dossiê, principalmente na parte de comercialização e contratação automática.

### OBJETIVO PRINCIPAL

Desenvolver um SaaS B2B multiempresa, comercializável, no qual:

1. Uma indústria acessa o site público do EWS AfterSales.
2. Conhece a plataforma, seus benefícios e funcionalidades.
3. Visualiza os planos e preços.
4. Seleciona um plano e cria sua conta.
5. Realiza o pagamento por um gateway integrado.
6. Após a confirmação dos pagamentos necessários, o acesso é ativado automaticamente.
7. Configura sua empresa e inicia a utilização.
8. Cadastra máquinas, equipamentos, clientes, manuais e peças.
9. Gera QR Codes exclusivos para seus equipamentos.
10. Seus clientes acessam um portal personalizado e solicitam peças, orçamentos e assistência.
11. A indústria acompanha as solicitações e transforma oportunidades de pós-venda em pedidos.
12. A EWS Tech gerencia todas as indústrias assinantes por um painel administrativo separado.

**Não quero somente um frontend de demonstração. Quero um sistema real, com persistência, autenticação, banco de dados, regras comerciais, segurança, cobrança e integração entre os módulos.**

O sistema será comercializado pela EWS Tech, mas cada indústria terá seu ambiente isolado.

---

# 2. IDENTIDADE DO PRODUTO

Nome comercial: **EWS AfterSales**

Empresa proprietária: **EWS Tech**

Posicionamento:

**Transforme cada equipamento vendido em uma nova oportunidade de negócio.**

Proposta de valor:

Uma plataforma que conecta fabricantes e compradores de equipamentos, centralizando informações técnicas, pedidos de peças, assistência e oportunidades de faturamento após a venda.

### Direção visual

Quero um produto de nível profissional, com qualidade semelhante à de SaaS internacionais consolidados.

Referências de padrão de experiência e organização, sem copiar identidades ou designs:

- Makula.
- PTC ServiceMax.
- Linear.
- Vercel.
- Stripe.
- Ramp.

Usar como base a identidade visual do dossiê:

- Azul-marinho profundo.
- Azul corporativo.
- Azul-ciano para destaques importantes.
- Branco e cinzas neutros para legibilidade.
- Tipografia moderna e profissional.
- Espaçamento consistente.
- Componentes responsivos.
- Ícones discretos e coerentes.
- Gráficos realmente úteis.
- Animações sutis e rápidas.

A landing page pode ter uma identidade mais impactante e tecnológica.

O painel administrativo deve priorizar clareza, produtividade e rapidez.

**Evite aparência de projeto acadêmico, templates genéricos, excesso de cards, emojis decorativos, gradientes exagerados, métricas inventadas ou conteúdo fictício apresentado como real.**

Criar um design system reutilizável com tokens, estados de loading, mensagens de erro, estados vazios, tabelas, formulários e acessibilidade.

---

# 3. ARQUITETURA GERAL DO SAAS

O produto terá quatro superfícies principais.

## A. Site público da EWS AfterSales

Destinado a visitantes, indústrias interessadas e compradores dos planos.

## B. Painel da indústria

Destinado à indústria assinante e seus funcionários autorizados.

## C. Portal dos equipamentos

Destinado aos compradores e operadores das máquinas cadastradas pelas indústrias.

## D. Painel administrativo da EWS

Destinado exclusivamente aos administradores autorizados da EWS Tech.

Os quatro ambientes fazem parte de um único produto integrado, mas precisam possuir rotas, autenticação, permissões e experiências próprias.

Não criar bancos de dados isolados manualmente para cada cliente. Construir uma arquitetura SaaS multi-tenant com segregação forte entre organizações.

---

# 4. SITE PÚBLICO — LANDING PAGE PROFISSIONAL

Criar uma landing page comercial completa, responsiva e otimizada para conversão.

O objetivo não é somente apresentar uma interface bonita. É explicar claramente o problema, despertar interesse e conduzir o visitante à contratação.

## 4.1. Menu superior

- Logo EWS AfterSales.
- Solução.
- Funcionalidades.
- Como funciona.
- Preços.
- Perguntas frequentes.
- Entrar.
- Botão em destaque: **Começar agora**.

A navegação deve funcionar no computador e no celular.

## 4.2. Hero principal

Título sugerido:

**Sua máquina foi vendida. O relacionamento com o cliente está só começando.**

Subtítulo:

**Transforme equipamentos instalados em um canal direto para assistência técnica, venda de peças e relacionamento com seus clientes.**

Botões:

- Conhecer os planos.
- Ver como funciona.

Do lado direito, apresentar um mockup de alta qualidade do próprio produto, preferencialmente construído com componentes reais da interface.

Evitar imagens aleatórias de bancos de imagem que não correspondam ao sistema.

## 4.3. Problemas que resolvemos

Mostrar dificuldades comuns de fabricantes:

- Clientes não encontram o manual correto.
- Solicitações de peças chegam sem modelo ou número de série.
- Chamados estão espalhados por e-mail, telefone e WhatsApp.
- A empresa não consegue acompanhar facilmente o andamento comercial das solicitações.
- A equipe perde tempo identificando equipamentos.
- O fabricante não possui uma visão centralizada de sua base instalada.

Não afirmar resultados financeiros sem evidências.

## 4.4. Apresentação da solução

Mostrar como o EWS AfterSales resolve esses problemas:

- QR Code individual por equipamento.
- Portal personalizado com a marca do fabricante.
- Documentação técnica atualizada.
- Catálogo de peças compatíveis.
- Solicitação de orçamentos.
- Assistência técnica.
- Acompanhamento do atendimento.
- Painel comercial de pós-venda.
- Relatórios de conversão.

## 4.5. Seção "Como funciona"

Criar uma experiência visual em etapas:

**1. Cadastre seus equipamentos**

A indústria registra modelos, números de série e clientes.

**2. Gere os QR Codes**

O sistema disponibiliza etiquetas e links individuais.

**3. Seu cliente acessa o portal**

Ao escanear o QR Code, encontra manuais, peças e assistência.

**4. Sua equipe recebe as solicitações**

Os pedidos chegam organizados e associados ao equipamento.

**5. Transforme oportunidades em vendas**

A indústria envia propostas e registra quais solicitações resultaram em pedidos.

## 4.6. Demonstração interativa

Criar uma demonstração pública navegável e isolada dos dados reais, com informações claramente identificadas como fictícias.

Demonstrar:

- Painel do fabricante.
- Cadastro de equipamento.
- Portal acessado por QR.
- Solicitação de peça.
- Abertura de chamado.
- Recebimento da solicitação.
- Envio de orçamento.

A demonstração deve realmente funcionar em modo demonstrativo, sem alterar dados de empresas reais.

Não criar botões visivelmente clicáveis que não façam nada.

## 4.7. Público-alvo

Apresentar segmentos como:

- Fabricantes de máquinas para alimentos.
- Fabricantes de máquinas de embalagem.
- Equipamentos para cozinhas profissionais.
- Equipamentos de lavanderia.
- Máquinas agrícolas especializadas.
- Equipamentos comerciais e industriais.

## 4.8. Benefícios

Comunicação direcionada a resultados:

- Identifique melhor as máquinas atendidas.
- Centralize a demanda de peças.
- Organize os chamados técnicos.
- Reduza retrabalho na coleta de informações.
- Acompanhe o funil comercial.
- Melhore a experiência de pós-venda.

Não criar depoimentos, empresas clientes, números de faturamento, logotipos de parceiros ou avaliações fictícias.

## 4.9. FAQ

Incluir respostas para:

- Preciso substituir meu ERP?
- É necessário instalar um aplicativo?
- Posso utilizar minha própria marca?
- Como funciona o QR Code?
- Como meus clientes solicitam peças?
- Preciso cadastrar todas as máquinas inicialmente?
- Como funciona a implantação?
- Como funciona o pagamento mensal?
- Posso mudar de plano?
- O que acontece se cancelar?
- Como meus dados são protegidos?
- A plataforma também realiza pagamentos das peças?

Esclarecer que, no MVP, o pagamento das peças entre fabricante e comprador permanece fora do EWS AfterSales. A integração financeira desenvolvida inicialmente é para a cobrança das assinaturas da EWS.

## 4.10. Rodapé

- EWS Tech.
- Produto EWS AfterSales.
- Contato comercial configurável.
- Política de Privacidade.
- Termos de Uso.
- Política de contratação e cancelamento.
- Links institucionais.

Não inventar endereço, CNPJ, dados empresariais ou contatos.

---

# 5. PLANOS E PREÇOS

Usar inicialmente as faixas definidas no dossiê.

## START

**R$ 449/mês**

Até 150 equipamentos.

Até 3 usuários internos.

Funcionalidades essenciais:

- Cadastro de equipamentos.
- QR Codes individuais.
- Portal básico.
- Manuais e documentos.
- Recebimento de solicitações.
- Painel essencial.

Implantação de referência: R$ 1.500 a R$ 3.000.

## GROWTH

**R$ 990/mês**

Até 1.000 equipamentos.

Até 10 usuários internos.

Inclui recursos do Start, além de:

- Catálogo de peças.
- Cotações.
- Tickets de assistência.
- Acompanhamento comercial.
- Relatórios de pós-venda.
- Configurações adicionais.

Implantação de referência: R$ 3.000 a R$ 6.000.

## INDUSTRY

**R$ 2.190/mês**

Até 5.000 equipamentos.

Até 30 usuários internos.

Inclui recursos anteriores, além de:

- Permissões de equipe mais avançadas.
- Fluxos internos.
- Relatórios ampliados.
- Configurações operacionais adicionais.
- Condições de suporte e SLA acordadas comercialmente.

Implantação de referência: R$ 6.000 a R$ 15.000.

## ENTERPRISE

Valor sob consulta.

Para fabricantes que precisam de:

- Volumes maiores.
- Integrações específicas.
- Requisitos personalizados de segurança.
- Contratos especiais.
- Suporte e SLA negociados.

Botão: **Solicitar proposta**.

### Regras comerciais obrigatórias

Os preços precisam ser configuráveis pelo painel da EWS, não espalhados como números fixos pelo código.

Para viabilizar uma contratação automática inicial, usar como implantação-padrão o limite inferior de cada faixa:

- Start: R$ 1.500.
- Growth: R$ 3.000.
- Industry: R$ 6.000.

Esses valores são sugestões iniciais e deverão poder ser alterados antes da comercialização.

No checkout, apresentar claramente:

- Plano selecionado.
- Valor mensal.
- Valor único de implantação.
- Total devido inicialmente, com cada cobrança identificada.
- Condições de recorrência.
- Condições de cancelamento.

Não cobrar valores escondidos.

O Enterprise não terá checkout automático até existir proposta comercial aprovada.

Não oferecer plano vitalício.

Não criar descontos ou promoções fictícias.

As funcionalidades devem respeitar as permissões do plano. Uma organização não pode alterar seu plano localmente para desbloquear módulos ou limites.

---

# 6. CADASTRO E CONTRATAÇÃO

Este é um dos pontos mais importantes do projeto.

O cliente precisa conseguir contratar de forma simples, sem intervenção manual da EWS nos planos autocontratáveis.

## Fluxo completo

### Etapa 1 — Escolher plano

Ao clicar em "Começar agora" ou "Contratar", o plano deve ser selecionado e persistido no fluxo de contratação.

### Etapa 2 — Criar conta

Solicitar:

- Nome do responsável.
- E-mail corporativo.
- Senha segura.
- Nome da empresa.
- CNPJ.
- Telefone.
- Aceite dos Termos de Uso e Política de Privacidade.

Validar as informações e verificar o e-mail.

Não armazenar senhas em texto puro.

### Etapa 3 — Revisar contratação

Exibir o resumo completo da contratação e o custo inicial.

Permitir voltar e alterar o plano antes da confirmação.

### Etapa 4 — Pagamento

Integrar um provedor brasileiro de pagamento.

**Preferência técnica: Asaas.**

Consultar a documentação oficial atual antes de implementar:

https://docs.asaas.com/

Usar exclusivamente o sandbox durante o desenvolvimento.

Implementar cobrança recorrente e cobrança inicial de implantação conforme os recursos efetivamente disponíveis no gateway.

Preferir checkout hospedado pelo provedor para não armazenar dados de cartão.

Aceitar os meios de pagamento realmente suportados pela integração escolhida, como cartão, Pix ou boleto, apresentando diferenças entre cobrança recorrente automática e cobrança que depende de pagamento manual a cada período.

Não afirmar que Pix comum representa débito automático.

### Etapa 5 — Confirmação segura

**Nunca ativar uma assinatura apenas porque o usuário foi redirecionado para uma página de sucesso.**

A confirmação precisa acontecer no backend por meio de eventos autenticados do provedor, com verificação do estado real das cobranças.

Implementar:

- Webhook seguro.
- Verificação de autenticidade conforme documentação.
- Idempotência por identificador do evento.
- Persistência do evento recebido.
- Identificação da contratação.
- Conciliação do pagamento.
- Prevenção contra cobrança duplicada.
- Tratamento de eventos repetidos ou fora de ordem.
- Tratamento de pagamentos cancelados, estornados ou recusados.
- Logs de auditoria.

Como existem implantação e mensalidade, tratar as duas obrigações financeiras separadamente.

Para a contratação automática padrão, liberar o uso somente após confirmação dos pagamentos inicialmente exigidos.

Se apenas um pagamento for confirmado, manter o pedido em estado parcial e permitir que o cliente conclua o restante. Exibir suporte e política de reembolso quando aplicável.

Não criar múltiplas assinaturas quando o usuário atualizar a página ou repetir a tentativa.

### Etapa 6 — Ativação da organização

Após a confirmação:

1. Ativar a assinatura.
2. Aplicar os limites e recursos do plano.
3. Ativar a organização.
4. Conceder acesso ao administrador.
5. Enviar e-mail de boas-vindas.
6. Disponibilizar o onboarding.
7. Registrar a ativação no painel da EWS.

### Etapa 7 — Tela de boas-vindas

Mensagem:

**Bem-vindo ao EWS AfterSales! Vamos preparar sua empresa para começar a atender seus clientes.**

Botão:

**Configurar minha empresa**

### Estados de assinatura

Implementar pelo menos:

- Aguardando pagamento.
- Pagamento parcialmente confirmado.
- Ativa.
- Vencida/em regularização.
- Cancelamento programado.
- Cancelada.
- Suspensa.

Definir uma política de prazo para regularização configurável.

Não apagar os dados do fabricante automaticamente por inadimplência.

Permitir que a empresa regularize os pagamentos e recupere o acesso.

---

# 7. ONBOARDING DA INDÚSTRIA

O cliente pagou e entrou na plataforma.

Agora ele precisa conseguir começar a usar o produto, sem ficar perdido diante de um painel vazio.

Criar um onboarding em etapas com progresso visual.

## Etapa 1 — Identidade da empresa

- Nome fantasia.
- Logo.
- Cor principal.
- Telefone de atendimento.
- E-mail de suporte.
- Horário de atendimento.
- Dados públicos permitidos.

Exibir prévia visual do portal personalizado.

## Etapa 2 — Primeiro modelo de equipamento

Cadastrar:

- Nome do equipamento.
- Código do modelo.
- Categoria.
- Descrição.
- Imagem.
- Versão, quando aplicável.

## Etapa 3 — Primeiro equipamento vendido

Cadastrar:

- Modelo.
- Número de série.
- Cliente associado, opcional inicialmente.
- Data da venda, se conhecida.
- Data de instalação, se conhecida.
- Informações relevantes para o suporte.

## Etapa 4 — Documentos

Permitir subir:

- Manual de operação.
- Manual técnico autorizado.
- Catálogo.
- Documentos adicionais.

Aplicar versionamento e classificação público/privado.

## Etapa 5 — Primeiras peças

Permitir cadastrar inicialmente as peças mais solicitadas.

## Etapa 6 — Gerar o primeiro QR Code

Gerar um link estável para o equipamento.

Apresentar:

- Visualização do QR.
- Copiar link.
- Baixar QR Code.
- Visualizar portal.
- Imprimir etiqueta.

## Etapa 7 — Concluir

Mensagem:

**Seu portal de pós-venda está pronto para começar!**

Apresentar sugestões de próximas ações:

- Importar equipamentos.
- Cadastrar peças.
- Convidar funcionários.
- Testar uma solicitação.

O onboarding deve permitir retomar etapas sem perder informações.

---

# 8. PAINEL PRINCIPAL DO FABRICANTE

Criar dashboard profissional baseado na proposta visual da página 9 do dossiê.

Menu lateral:

- Visão geral.
- Equipamentos.
- Clientes.
- Peças e kits.
- Cotações.
- Assistência.
- Relatórios.
- Configurações.

### Indicadores

- Total de equipamentos cadastrados.
- Solicitações recebidas.
- Cotações emitidas.
- Pedidos confirmados.
- Valor de vendas confirmadas registradas.
- Chamados em aberto.
- Tempo médio até o primeiro atendimento útil, quando houver dados.

Utilizar dados reais do banco.

Quando não existir dado, mostrar zero e estados vazios úteis.

Nunca deixar cards com valores inventados.

### Funil comercial

Solicitação → Qualificação → Cotação → Proposta aceita → Venda confirmada.

Diferenciar claramente:

- Oportunidade.
- Orçamento.
- Pedido aceito.
- Venda efetivamente confirmada.

Não contabilizar orçamentos como faturamento.

Exibir valores monetários com formatação brasileira.

---

# 9. GESTÃO DE EQUIPAMENTOS

Desenvolver um módulo funcional para cadastrar e organizar a base instalada do fabricante.

## Modelos de equipamento

CRUD completo de modelos, com:

- Nome.
- Código.
- Categoria.
- Descrição.
- Imagens.
- Versão.
- Estado de publicação.

## Equipamentos individuais

Cada unidade física deve possuir:

- Identificador interno.
- Modelo.
- Número de série.
- Cliente associado.
- Local de instalação autorizado.
- Datas relevantes.
- Status.
- Identificador público opaco.
- QR Code.
- Documentação aplicável.
- Histórico de solicitações.

Impedir duplicidade indevida de número de série dentro do mesmo fabricante.

### Importação em lote

Implementar CSV e XLSX:

- Baixar modelo de planilha.
- Fazer upload.
- Mapear ou validar colunas.
- Pré-visualizar registros.
- Mostrar erros por linha.
- Confirmar importação.
- Retornar resumo de sucesso e falhas.

Não importar linhas inválidas silenciosamente.

Validar limites do plano.

---

# 10. QR CODE POR EQUIPAMENTO

Cada equipamento terá um QR Code único que direciona ao portal correto.

O código precisa continuar válido mesmo quando o fabricante atualizar manuais, peças ou identidade visual.

Requisitos:

- Identificador público não sequencial.
- URL estável.
- QR em PNG e SVG, se viável.
- Download individual.
- Geração em lote.
- Opção de impressão.
- Prévia da etiqueta.
- Logo e identificação do fabricante.
- Modelo e dados seguros para exibição.

**Segurança obrigatória: o QR não comprova propriedade e não deve conceder acesso a dados privados.**

Nunca expor pelo QR:

- CPF de clientes.
- Endereço privado.
- Credenciais.
- Contratos restritos.
- Histórico técnico confidencial.
- Informações comerciais sigilosas.

Acesso a recursos privados exige autenticação e autorização adequada.

---

# 11. PORTAL DO CLIENTE FINAL

Esta é uma das partes mais importantes do produto.

Quando alguém escanear o QR Code, deverá acessar um portal responsivo, com a identidade visual do fabricante.

Não mostrar a marca EWS de maneira dominante no ambiente white-label.

O fabricante deve ser claramente identificado.

## Página principal do equipamento

Exibir apenas dados públicos autorizados:

- Marca.
- Modelo.
- Foto.
- Descrição.
- Identificação pública.
- Manuais disponíveis.
- Botões de atendimento.

### Ações principais

**Consultar manuais**

Exibir documentação autorizada.

**Solicitar peça**

Abrir fluxo de solicitação vinculado ao equipamento.

**Pedir assistência**

Abrir chamado técnico.

**Solicitar manutenção**

Criar solicitação de atendimento/manutenção, sem prometer agendamento automático de técnicos no MVP.

**Acompanhar solicitação**

Exibir status somente após autenticação ou validação segura da identidade do solicitante.

### Experiência

O portal deve funcionar perfeitamente em celular.

Não exigir que o cliente instale um aplicativo.

Permitir iniciar solicitações com poucos campos, respeitando medidas contra spam e abuso.

Acompanhar informações privadas deve exigir verificação apropriada.

---

# 12. CATÁLOGO DE PEÇAS E KITS

O fabricante poderá gerenciar peças compatíveis com seus equipamentos.

Campos:

- Código SKU.
- Nome.
- Descrição.
- Imagens.
- Categoria.
- Unidade.
- Modelos compatíveis.
- Versões compatíveis.
- Preço de referência opcional.
- Disponibilidade informativa opcional.
- Status ativo/inativo.

Criar relacionamento entre peças e modelos.

Não indicar compatibilidade por suposição.

Quando necessário, deixar a seleção sujeita à aprovação humana do fabricante.

## Fluxo para solicitar peças

1. Cliente acessa o equipamento.
2. Visualiza peças compatíveis autorizadas.
3. Seleciona uma ou mais peças.
4. Informa quantidade.
5. Preenche contato.
6. Acrescenta observações ou fotos.
7. Envia solicitação.
8. Recebe protocolo.
9. Fabricante recebe no painel.
10. Equipe confere e responde.

Nenhum pagamento de peça precisa ser realizado dentro da plataforma no MVP.

---

# 13. COTAÇÕES E VENDAS PÓS-VENDA

Construir um módulo comercial completo para acompanhar solicitações recebidas.

### Pipeline

- Nova solicitação.
- Em análise.
- Aguardando informações.
- Cotação enviada.
- Aceita.
- Perdida/cancelada.
- Venda confirmada.

Permitir:

- Identificar o solicitante.
- Consultar máquina e modelo.
- Visualizar peças solicitadas.
- Ajustar quantidade.
- Informar preços manualmente.
- Informar frete e condições.
- Aplicar descontos autorizados.
- Gerar proposta.
- Enviar link/PDF.
- Atualizar status.
- Registrar motivo de perda.
- Registrar referência de pedido ou nota externa.
- Registrar valor realmente confirmado.

O orçamento deve ter identificação, validade e histórico.

O cliente poderá visualizar sua proposta com acesso seguro.

O fabricante é responsável por confirmar preço, estoque, compatibilidade e condições.

A EWS não realiza a venda física de peças em nome da indústria.

### Relatórios comerciais

- Solicitações por período.
- Cotações enviadas.
- Taxa de conversão.
- Pedidos confirmados.
- Valores confirmados.
- Peças mais solicitadas.
- Modelos com maior demanda.
- Motivos de perda.

Não afirmar que toda venda registrada foi causada exclusivamente pelo EWS AfterSales.

---

# 14. ASSISTÊNCIA TÉCNICA

Desenvolver um módulo simples e confiável de chamados técnicos.

### Abertura

Cliente informa:

- Equipamento.
- Descrição do problema.
- Urgência solicitada.
- Nome e contato.
- Fotos e anexos.
- Local de atendimento, quando necessário e permitido.

Gerar protocolo.

### Painel da indústria

Cada ticket terá:

- Identificador.
- Equipamento.
- Cliente.
- Data de abertura.
- Prioridade.
- Situação.
- Responsável.
- Conversas ou atualizações.
- Anexos.
- Histórico.

### Status

- Aberto.
- Aguardando informações.
- Em atendimento.
- Aguardando peça.
- Concluído.
- Cancelado.

Permitir atribuir responsável e registrar atualizações.

### Garantia

Mostrar informações disponíveis, mas não decidir cobertura automaticamente apenas por uma data.

Deixar decisão de garantia sujeita às políticas aplicáveis e à análise humana.

Não criar orientações de intervenção elétrica, mecânica ou industrial perigosa para usuários não autorizados.

Não prometer suporte 24 horas sem estrutura contratada.

---

# 15. CADASTRO DE CLIENTES DAS INDÚSTRIAS

Cada fabricante precisa manter sua própria carteira de clientes.

Campos:

- Nome ou razão social.
- Identificador empresarial quando aplicável.
- E-mail.
- Telefone.
- Endereço autorizado.
- Contatos responsáveis.
- Observações internas.
- Equipamentos vinculados.

Tela de detalhes:

- Equipamentos relacionados.
- Solicitações de peças.
- Cotações.
- Chamados técnicos.
- Histórico permitido.

Os dados pertencentes a um fabricante nunca podem ser visualizados por outro.

---

# 16. USUÁRIOS E PERMISSÕES

Perfis sugeridos:

### EWS Superadmin
Gerencia o SaaS inteiro, com ações privilegiadas auditadas.

### Administrador da indústria
Gerencia sua organização, equipe, plano e configurações.

### Comercial
Gerencia peças, orçamentos e solicitações comerciais.

### Atendimento
Gerencia solicitações e chamados.

### Técnico
Acessa tickets e equipamentos associados às suas responsabilidades.

### Cliente final
Acessa somente informações e solicitações autorizadas.

Aplicar autorização no backend e no banco, não apenas esconder botões no frontend.

Convites de funcionários devem respeitar o limite contratado.

---

# 17. PAINEL ADMINISTRATIVO DA EWS TECH

Criar uma área administrativa completamente separada da visão do fabricante.

Sugestão de rota:

/ews-admin

Acesso exclusivamente para usuários autorizados da EWS, com segurança reforçada e MFA quando viável.

## Visão geral

Indicadores reais:

- Empresas cadastradas.
- Empresas com assinatura ativa.
- Assinaturas aguardando pagamento.
- Assinaturas atrasadas.
- Cancelamentos.
- Receita recorrente mensal contratada (MRR).
- Receita recebida, separada do MRR.
- Receita de implantação.
- Uso da plataforma.
- Chamados de suporte da EWS.

## Gestão de assinantes

Visualizar:

- Empresa.
- CNPJ.
- Responsável.
- Plano.
- Data de contratação.
- Status da assinatura.
- Próxima cobrança.
- Limites de uso.
- Histórico de pagamentos.
- Atividade recente.

### Ações administrativas

- Consultar organização.
- Visualizar plano.
- Ajustar limites por ação autorizada.
- Criar proposta comercial.
- Suspender acesso conforme política.
- Reativar após regularização.
- Consultar falhas de pagamento.
- Reprocessar conciliação de forma segura.
- Consultar eventos.
- Acompanhar suporte.

Não permitir ativar assinatura paga falsamente sem registro de uma autorização administrativa explícita.

## Gestão de planos

Criar interface para atualizar:

- Valor mensal.
- Implantação.
- Limite de equipamentos.
- Limite de usuários.
- Recursos habilitados.
- Status comercial do plano.

Alterações de preço em contratos existentes devem respeitar as condições acordadas. Não alterar cobranças já pactuadas silenciosamente.

## Relatórios

- MRR.
- Novas assinaturas.
- Cancelamentos.
- Inadimplência.
- Receita recebida.
- Receita de implantação.
- Uso por fabricante.
- Limites atingidos.

---

# 18. CONFIGURAÇÕES DA INDÚSTRIA

Cada assinante deve poder gerenciar:

- Dados da empresa.
- Marca e cores do portal.
- Contatos de suporte.
- Equipe.
- Permissões.
- Preferências de notificação.
- Política de documentos.
- Plano contratado.
- Cobranças e faturas.
- Solicitação de mudança de plano.
- Solicitação de cancelamento.

Exibir claramente o plano atual, limite de equipamentos e usuários utilizados.

Ao atingir limites, não excluir dados existentes.

Oferecer opção de upgrade, sem fazer cobrança automática não autorizada.

---

# 19. TECNOLOGIAS E ORGANIZAÇÃO DO PROJETO

Usar como base a arquitetura recomendada no dossiê.

### Frontend
- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- Componentes acessíveis e reutilizáveis.
- React Hook Form e Zod ou alternativas justificadas.
- Biblioteca de gráficos adequada.
- Layouts responsivos.
- SEO nas páginas públicas.

### Backend
- Node.js.
- Fastify.
- TypeScript.
- API REST documentada.
- Validação de entrada.
- Autenticação segura.
- Controle de acesso.
- Tratamento padronizado de erros.

### Banco
- PostgreSQL.
- ORM/migrations com Prisma, Drizzle ou solução equivalente.
- Restrições e índices apropriados.
- Integridade referencial.
- Migrações versionadas.

### Arquivos
- Storage S3 compatível.
- Upload seguro.
- Arquivos privados protegidos.
- URLs temporárias autorizadas.
- Versionamento de documentos.

### Serviços complementares
- E-mails transacionais.
- Fila persistente para tarefas assíncronas.
- Logs estruturados.
- Auditoria.
- Monitoramento de erros.
- Backups e teste de restauração.

### Organização

Preferência por monorepo:

- apps/web
- apps/api
- packages/db
- packages/shared
- packages/ui, se fizer sentido
- docs
- tests

Usar pnpm como gerenciador de pacotes.

Escolher versões estáveis e compatíveis consultando a documentação atual.

Não adicionar bibliotecas desnecessárias.

---

# 20. MODELO DE BANCO DE DADOS

Planejar e implementar entidades para pelo menos:

### SaaS EWS
- organizations/tenants
- users
- memberships
- roles e permissões
- plans
- plan_features
- subscriptions
- subscription_events
- invoices/charges
- payments
- checkout_sessions
- onboarding_progress
- audit_logs

### Fabricantes
- customers
- customer_contacts
- equipment_models
- equipment_units
- installed_locations
- equipment_public_tokens
- documents
- document_versions
- parts
- part_model_compatibility
- kits

### Atendimento e vendas
- part_requests
- part_request_items
- quotations
- quotation_items
- quotation_events
- confirmed_orders
- service_tickets
- ticket_messages
- ticket_attachments
- ticket_events
- notifications

Ajustar nomes conforme o domínio e evitar tabelas supérfluas.

Todas as entidades pertencentes à indústria devem ter segregação por organização no modelo de dados e na autorização.

Aplicar regras fortes contra acesso entre tenants.

Os identificadores internos não podem ser usados para contornar permissões.

---

# 21. SEGURANÇA, LGPD E QUALIDADE

Segurança é requisito obrigatório, não melhoria futura.

Implementar:

- Autenticação por sessão segura.
- Cookies HttpOnly, Secure em produção e SameSite adequado.
- Proteção contra CSRF quando aplicável.
- Senhas com hash forte.
- Recuperação de senha segura.
- Verificação de e-mail.
- Rate limiting.
- Validação de todos os inputs.
- Proteção contra acesso indevido a arquivos.
- Autorização por organização e perfil.
- Logs de auditoria.
- Validação de uploads.
- Limite de tamanho de arquivos.
- Tratamento de dados pessoais.
- Política de retenção e exclusão.
- Segredos somente no ambiente.
- Proteção contra injeção SQL.
- HTTPS.
- Backups automatizáveis.
- Verificação de restauração.

Não utilizar chave do gateway no navegador.

Não registrar dados sensíveis de pagamento nos logs.

Não armazenar dados completos de cartão.

A EWS deve distinguir suas responsabilidades das responsabilidades do fabricante sobre os dados tratados.

Criar páginas e estruturas para Termos e Privacidade, marcando textos jurídicos pendentes de revisão profissional quando necessário.

Considerar as questões de propriedade intelectual do produto: desenvolver código original para EWS Tech sem aproveitar código, dados ou documentação proprietários de terceiros.

---

# 22. EXPERIÊNCIA DO PRODUTO

Todas as telas precisam estar conectadas aos dados reais.

### Não aceitar

- Dashboard estático.
- Botões sem ação.
- Formulários que apenas exibem toast e não salvam.
- Cartões com números inventados.
- Links quebrados.
- Rotas simuladas como se fossem funcionais.
- Checkout falso apresentado como pagamento real.
- Arquivos salvos só em memória.
- Usuário acessando dados de outra empresa.
- Página de sucesso liberando acesso sem pagamento confirmado.

### Exigir

- CRUDs completos e funcionais.
- Loading e skeleton adequados.
- Tratamento de erro.
- Validações amigáveis.
- Paginação em listas extensas.
- Busca e filtros úteis.
- Persistência no PostgreSQL.
- Estados vazios com ações claras.
- Feedback de sucesso real.
- Interface fluida.
- Acessibilidade.
- Layout consistente.

A landing page precisa ser excepcional visualmente, mas a qualidade operacional do painel tem a mesma prioridade.

---

# 23. IMPLEMENTAÇÃO POR PRIORIDADES

O objetivo é desenvolver uma base sólida e comercializável, sem transformar o MVP em um ERP industrial.

Organize o trabalho por fases e implemente de maneira progressiva.

## P0 — Fundação e contratação

Entregas obrigatórias:

- Estrutura do projeto.
- Design system.
- Landing page completa.
- Página de preços.
- Cadastro e login.
- Multi-tenancy.
- Banco PostgreSQL.
- Planos.
- Fluxo de contratação.
- Integração com sandbox Asaas.
- Webhooks.
- Ativação segura.
- Onboarding.
- Painel EWS básico.
- Permissões essenciais.

## P1 — Produto industrial vendável

Entregas obrigatórias:

- Dashboard do fabricante.
- Clientes.
- Modelos de equipamento.
- Equipamentos individuais.
- Importação CSV/XLSX.
- QR Codes.
- Portal de equipamento.
- Upload e consulta de manuais.
- Catálogo de peças.
- Solicitação de peças.
- Cotação.
- Tickets de assistência.
- Notificações por e-mail.
- Relatórios essenciais.

## P2 — Evolução controlada

Somente depois da base principal estar funcional:

- Relatórios ampliados.
- Permissões avançadas.
- Personalização adicional.
- Melhorias de experiência.
- Exportações.
- Recursos administrativos complementares.

Deixar para uma versão posterior, salvo necessidade técnica comprovada:

- Integração com CLP.
- Diagnóstico industrial por IA.
- Manutenção preditiva.
- Aplicativos nativos.
- Estoque em tempo real.
- Integração universal com ERPs.
- Pagamentos de peças dentro do portal.
- Roteirização de técnicos.
- Marketplace.
- Automação complexa de contratos de manutenção.

---

# 24. TESTES OBRIGATÓRIOS

Criar testes automatizados para os fluxos principais, utilizando Playwright no frontend e testes de integração na API.

### Fluxo comercial

1. Acessar landing page.
2. Abrir preços.
3. Selecionar plano.
4. Criar conta.
5. Verificar e-mail.
6. Iniciar checkout sandbox.
7. Simular pagamento pelo provedor em ambiente de testes.
8. Receber webhook válido.
9. Confirmar pagamentos iniciais.
10. Ativar organização.
11. Entrar no onboarding.

### Segurança financeira

Testar:

- Webhook duplicado.
- Webhook inválido.
- Pagamento recusado.
- Checkout abandonado.
- Atualização da página durante checkout.
- Cobrança parcialmente paga.
- Pagamento estornado.
- Assinatura vencida.
- Cancelamento.
- Reativação.

### Fluxo operacional

1. Criar primeiro modelo.
2. Cadastrar equipamento.
3. Associar cliente.
4. Subir manual.
5. Cadastrar peça compatível.
6. Gerar QR Code.
7. Abrir link do QR.
8. Consultar dados públicos.
9. Solicitar peça.
10. Visualizar solicitação no painel.
11. Criar cotação.
12. Enviar proposta.
13. Registrar pedido confirmado.
14. Conferir relatório.
15. Abrir chamado técnico.
16. Atualizar e concluir chamado.

### Isolamento multiempresa

Criar duas empresas de teste.

Confirmar que:

- Empresa A não acessa equipamentos da B.
- Empresa B não acessa clientes da A.
- Usuário A não consulta cotações de B.
- Documentos privados não vazam entre empresas.
- Alterar identificadores nas requisições não contorna autorização.
- O QR público não concede permissões privadas.

### Responsividade

Testar larguras:

- 360 px.
- 390 px.
- 768 px.
- 1024 px.
- 1440 px.

Testar em navegador real e corrigir overflow, problemas de navegação e formulários.

---

# 25. AMBIENTE LOCAL E DEPLOY

Quero conseguir executar o produto localmente e depois publicar.

Entregar:

- README completo.
- .env.example sem segredos.
- Migrations.
- Docker Compose para serviços locais.
- Comandos de instalação.
- Comandos para iniciar frontend e backend.
- Instruções de criação do banco.
- Instruções de sandbox Asaas.
- Instruções de configuração dos webhooks.
- Instruções de storage.
- Instruções de e-mail.
- Instruções de testes.
- Orientação para backups e restauração.
- Checklist de produção.

Sugestão de arquitetura de publicação:

- Frontend Next.js na Vercel.
- Backend Node.js em serviço persistente adequado.
- PostgreSQL gerenciado.
- Storage S3 compatível.
- Gateway Asaas.
- Serviço de e-mail transacional.

A decisão final de infraestrutura deve considerar custos, segurança, confiabilidade e suporte a workers.

Não depender de processos persistentes ou jobs longos em ambiente serverless inadequado.

Não publicar em produção, não ativar cobranças reais e não comprar infraestrutura sem minha autorização.

Se faltarem credenciais externas, implemente a integração em sandbox e documente precisamente o que precisa ser configurado. Nunca substitua confirmação real por um sucesso simulado no ambiente de produção.

---

# 26. REPOSITÓRIO E ENTREGA

Este projeto pertence à EWS Tech e deve ficar isolado dos projetos de terceiros.

Nome sugerido do repositório:

**ews-aftersales**

Se houver acesso autorizado ao GitHub, criar o repositório ou trabalhar no repositório existente correto, preferindo uma branch de desenvolvimento.

Não alterar projetos da JCortiça, AR Calhas, AgroIntelligence ou outros clientes.

Se não houver permissão de publicação, entregar o código completo e executável no ambiente de trabalho, com instruções para eu enviá-lo ao GitHub.

Ao finalizar cada etapa:

- Informar o que realmente foi implementado.
- Informar os arquivos principais.
- Executar os testes correspondentes.
- Corrigir erros identificados.
- Informar o que ainda depende de credenciais ou decisões externas.
- Diferenciar funcionalidades completas, parciais e pendentes.

Não afirmar que uma integração está funcionando em produção se ela só foi testada localmente.

---

# 27. CRITÉRIOS DE ACEITAÇÃO FINAL

Considerarei o MVP funcional quando:

1. O site público estiver completo e profissional.
2. O visitante conseguir conhecer e comparar os planos.
3. Uma empresa conseguir criar uma conta.
4. Uma contratação puder ser concluída no sandbox.
5. A confirmação de pagamento atualizar a assinatura com segurança.
6. A empresa contratante puder realizar onboarding.
7. Cada fabricante possuir dados isolados.
8. O fabricante conseguir cadastrar máquinas e gerar QR Codes.
9. O comprador conseguir acessar o portal de um equipamento.
10. O comprador conseguir solicitar uma peça.
11. A fábrica receber e responder à solicitação.
12. A fábrica conseguir criar uma cotação e registrar seu desfecho.
13. O cliente conseguir abrir um chamado de assistência.
14. O painel apresentar indicadores reais.
15. A EWS conseguir visualizar e administrar assinantes.
16. As regras de acesso e limites de planos funcionarem.
17. Os testes essenciais passarem.
18. O projeto puder ser executado localmente e estiver documentado.

O checkout real só poderá ser publicado depois da configuração das credenciais definitivas, das condições jurídicas e comerciais e da autorização de lançamento.

---

# 28. DIRETRIZ FINAL — EXECUTE, NÃO ENTREGUE APENAS UM PLANO

Quero que você atue como uma equipe de engenharia de software responsável pela construção do produto.

Antes de programar, leia o PDF completo e estabeleça a arquitetura. Depois implemente o projeto de maneira progressiva.

Não gaste todo o trabalho apenas criando documentos de planejamento.

**Desenvolva o código real.**

Priorize um fluxo ponta a ponta funcionando antes de expandir módulos: contratação → ativação → primeira máquina → QR Code → pedido de peça → cotação → venda confirmada.

Se houver limitação de contexto ou execução, preserve o trabalho implementado e documente os próximos passos, sem alegar que o produto está completo.

A interface precisa ser excelente, mas nenhuma decisão visual pode comprometer a segurança, o funcionamento ou a qualidade do sistema.

## VISÃO DO PRODUTO

O fabricante paga para utilizar o EWS AfterSales.

O cliente final do fabricante usa o portal de maneira simples, sem precisar contratar um plano da EWS.

A indústria mantém seus processos comerciais, preços e decisões de assistência.

A EWS Tech fornece e administra a plataforma tecnológica.

O SaaS deve conseguir atender desde os primeiros dois fabricantes até uma operação com centenas de organizações, sem precisar recriar a arquitetura.

**O objetivo é criar um produto original, profissional, vendável e escalável, pertencente à EWS Tech.**

Comece pela implementação do P0 e avance ao P1 após verificar os critérios de aceitação da fase anterior. Não fique somente no planejamento.