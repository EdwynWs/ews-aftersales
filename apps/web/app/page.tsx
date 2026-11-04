import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  ScanLine,
  Box,
  MessagesSquare,
  FileText,
  MoveUpRight,
  Headphones,
  Check,
} from "lucide-react";
import {
  Nav,
  Footer,
  ProductPreview,
  Pricing,
  Faq,
} from "@/components/marketing";
export default function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <span className="blue-dot" /> PÓS-VENDA INDUSTRIAL, CONECTADO
              </span>
              <h1>
                Sua máquina
                <br />
                foi vendida.
                <br />
                <span>
                  O relacionamento
                  <br />
                  só começou.
                </span>
              </h1>
              <p>
                Transforme equipamentos instalados em um canal direto para
                assistência, venda de peças e relacionamento com seus clientes.
              </p>
              <div className="hero-actions">
                <Link href="/precos" className="button">
                  Conhecer os planos <ArrowUpRight size={18} />
                </Link>
                <Link href="/demo" className="demo-link">
                  <span className="play-icon">▶</span> Explorar demonstração
                </Link>
              </div>
              <div className="hero-proof">
                <span>
                  <Check size={15} /> Sem substituir seu ERP
                </span>
                <span>
                  <Check size={15} /> Sem instalar aplicativo
                </span>
              </div>
            </div>
            <ProductPreview />
          </div>
          <div className="container hero-baseline">
            <span>
              DA FÁBRICA AO CLIENTE.
              <br />
              <b>UMA CONEXÃO QUE CONTINUA.</b>
            </span>
            <div>
              <span>Equipamentos</span>
              <i />
              <span>Peças</span>
              <i />
              <span>Assistência</span>
              <i />
              <span>Relacionamento</span>
            </div>
            <span className="baseline-arrow">↓</span>
          </div>
        </section>
        <section id="solucao" className="section">
          <div className="container">
            <div className="section-heading split">
              <div>
                <span className="eyebrow">01 / O PONTO DE PARTIDA</span>
                <h2>
                  A venda termina.
                  <br />
                  As oportunidades, não.
                </h2>
              </div>
              <p>
                O problema não é faltar mais um sistema. É perder o contexto
                entre a máquina, o cliente e quem precisa atender.
              </p>
            </div>
            <div className="problem-grid">
              {[
                [
                  FileText,
                  "O manual ficou para trás.",
                  "Documentos dispersos e versões diferentes atrasam um atendimento que poderia ser simples.",
                ],
                [
                  Box,
                  "“Preciso dessa peça aqui.”",
                  "Fotos sem modelo ou número de série tornam cada orçamento uma nova investigação.",
                ],
                [
                  MessagesSquare,
                  "Cada conversa em um lugar.",
                  "WhatsApp, telefone e e-mail dificultam acompanhar o que chegou — e o que virou pedido.",
                ],
              ].map(([Icon, title, desc]: any, i) => (
                <article key={title}>
                  <span className="number">0{i + 1}</span>
                  <Icon size={25} />
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="funcionalidades" className="solution-section">
          <div className="container solution-grid">
            <div className="solution-copy">
              <span className="eyebrow">
                02 / DO EQUIPAMENTO À OPORTUNIDADE
              </span>
              <h2>
                Uma máquina.
                <br />
                Um portal.
                <br />
                <span>Mais proximidade.</span>
              </h2>
              <p>
                Um ponto de partida para o cliente. Uma visão organizada para a
                sua equipe.
              </p>
              <Link className="button white" href="/demo">
                Veja o fluxo na prática <ArrowUpRight size={17} />
              </Link>
              <small>Demonstração interativa com dados fictícios.</small>
            </div>
            <div className="feature-list">
              {[
                [
                  ScanLine,
                  "Identifique sem adivinhar",
                  "QR individual e link estável para encontrar a máquina certa.",
                ],
                [
                  FileText,
                  "Informação no lugar certo",
                  "Documentos autorizados, atualizados por modelo e versão.",
                ],
                [
                  Box,
                  "Da peça ao pedido",
                  "Solicitações contextualizadas, cotações e desfechos comerciais.",
                ],
                [
                  Headphones,
                  "Atendimento com continuidade",
                  "Chamados, responsáveis e histórico organizado.",
                ],
              ].map(([Icon, title, desc]: any) => (
                <div key={title}>
                  <span>
                    <Icon size={23} />
                  </span>
                  <div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                  <MoveUpRight size={18} />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="como-funciona" className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">03 / SIMPLES PARA QUEM USA</span>
              <h2>Do QR ao próximo pedido.</h2>
              <p>
                Um fluxo com menos idas e vindas. E mais contexto em cada etapa.
              </p>
            </div>
            <div className="steps">
              {[
                ["Cadastre", "Registre modelos, números de série e clientes."],
                ["Conecte", "Gere e aplique o QR Code de cada equipamento."],
                [
                  "Receba",
                  "Seu cliente consulta o portal e envia a solicitação.",
                ],
                ["Atenda", "Sua equipe confere a demanda e prepara a cotação."],
                [
                  "Acompanhe",
                  "Registre pedidos confirmados e seus resultados.",
                ],
              ].map(([title, desc], i) => (
                <article key={title}>
                  <div>
                    <b>0{i + 1}</b>
                    {i < 4 && <ArrowRight size={18} />}
                  </div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="segments">
          <div className="container">
            <span className="eyebrow">
              PARA QUEM FABRICA. PARA QUEM CONTINUA ATENDENDO.
            </span>
            <div>
              {[
                "Alimentos & bebidas",
                "Embalagens",
                "Cozinhas profissionais",
                "Lavanderias",
                "Máquinas agrícolas",
                "Equipamentos industriais",
              ].map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
          </div>
        </section>
        <section id="precos" className="section">
          <div className="container">
            <div className="section-heading">
              <span className="eyebrow">04 / UMA BASE PARA CADA MOMENTO</span>
              <h2>
                Cresça a sua conexão.
                <br />
                Escolha o seu plano.
              </h2>
              <p>
                Mensalidade + implantação. Sem custos escondidos na contratação.
              </p>
            </div>
            <Pricing />
          </div>
        </section>
        <section id="faq" className="section faq-section">
          <div className="container faq-grid">
            <div className="section-heading">
              <span className="eyebrow">05 / ANTES DE COMEÇAR</span>
              <h2>Vamos esclarecer.</h2>
              <p>
                O que você precisa saber sobre o produto, a implantação e a
                contratação.
              </p>
              <Link href="/contato" className="text-link">
                Falar sobre minha operação <ArrowUpRight size={17} />
              </Link>
            </div>
            <Faq />
          </div>
        </section>
        <section className="final-cta">
          <div className="container">
            <span className="eyebrow">O PRÓXIMO CAPÍTULO COMEÇA AQUI</span>
            <h2>
              Não perca a conexão
              <br />
              depois da entrega.
            </h2>
            <Link href="/precos" className="button white">
              Encontrar meu plano <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
