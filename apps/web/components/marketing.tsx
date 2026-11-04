"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  Check,
  Box,
  ScanLine,
  FileText,
  Headphones,
  ChevronRight,
  Activity,
  Layers3,
} from "lucide-react";
import { Brand, Loading, Notice, useData } from "./ui";
import { money } from "@/lib/api";
export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <div className="container nav-inner">
        <Brand />
        <button
          className="menu-toggle"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav
          aria-label="Principal"
          className={open ? "open" : ""}
          onClick={() => setOpen(false)}
        >
          <Link href="/#solucao">Solução</Link>
          <Link href="/#funcionalidades">Funcionalidades</Link>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/precos">Preços</Link>
          <Link href="/#faq">FAQ</Link>
          <Link href="/entrar" className="login-link">
            Entrar
          </Link>
          <Link href="/precos" className="button small">
            Começar agora <ArrowUpRight size={15} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <Brand light />
          <p>
            O próximo capítulo
            <br />
            de cada equipamento.
          </p>
          <Link href="/contato">
            Fale com a EWS <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} EWS Tech</span>
          <div>
            <Link href="/legal/privacidade">Privacidade</Link>
            <Link href="/legal/termos">Termos de uso</Link>
            <Link href="/legal/contratacao">Contratação e cancelamento</Link>
          </div>
          <span>Feito para conectar.</span>
        </div>
      </div>
    </footer>
  );
}
export function ProductPreview() {
  return (
    <div
      className="product-scene"
      aria-label="Ilustração do produto com dados demonstrativos"
    >
      <div className="scene-top">
        <span>
          <span className="live-dot" /> UM NOVO CANAL DE PÓS-VENDA
        </span>
        <span>01 / 03</span>
      </div>
      <div className="mini-dashboard">
        <div className="mini-sidebar">
          <div className="mini-brand">
            <Layers3 size={16} /> AfterSales
          </div>
          <span className="selected">
            <Activity size={13} /> Visão geral
          </span>
          <span>
            <Box size={13} /> Equipamentos
          </span>
          <span>
            <FileText size={13} /> Cotações
          </span>
          <span>
            <Headphones size={13} /> Assistência
          </span>
          <div className="mini-avatar">
            FE <small>Fabricante exemplo</small>
          </div>
        </div>
        <div className="mini-main">
          <div className="mini-top">
            <span>Visão de pós-venda</span>
            <small>DEMONSTRAÇÃO</small>
          </div>
          <p>O relacionamento continua por aqui.</p>
          <div className="mini-stats">
            <div>
              <small>Equipamentos</small>
              <b>128</b>
              <span>Base conectada</span>
            </div>
            <div>
              <small>Solicitações</small>
              <b>24</b>
              <span>Últimos 30 dias</span>
            </div>
            <div>
              <small>Em atendimento</small>
              <b>08</b>
              <span>Equipe de suporte</span>
            </div>
          </div>
          <div className="mini-chart">
            <div>
              <b>Da solicitação ao pedido</b>
              <span>Exemplo ilustrativo</span>
            </div>
            {[
              ["Solicitações", 100, "24"],
              ["Cotações", 66, "16"],
              ["Pedidos confirmados", 33, "8"],
            ].map(([label, width, count]) => (
              <div className="funnel-row" key={label}>
                <small>{label}</small>
                <div>
                  <i style={{ width: width + "%" }} />
                </div>
                <b>{count}</b>
              </div>
            ))}
          </div>
          <div className="mini-list">
            <span>
              <div className="icon-square">
                <Box size={16} />
              </div>
              <div>
                Envasadora EV-200<small>Solicitação de peça · há 5 min</small>
              </div>
            </span>
            <span className="badge">Nova solicitação</span>
          </div>
        </div>
      </div>
      <div className="portal-float">
        <div className="portal-head">
          <span className="logo-example">F/</span>
          <span>
            FABRICANTE EXEMPLO<small>Seu portal de atendimento</small>
          </span>
          <ScanLine size={20} />
        </div>
        <div className="machine-drawing">
          <svg viewBox="0 0 260 110" fill="none" aria-hidden="true">
            <path d="M35 76 113 100 229 65 152 41Z" fill="#dfe8ee" />
            <path d="m70 36 68 20v31L70 66Z" fill="#9aaebf" />
            <path d="m138 56 65-21v31l-65 21Z" fill="#c2ced8" />
            <path d="M70 36 137 15l66 20-65 21Z" fill="#eef2f6" />
            <path d="M87 42v16l31 9V51Z" fill="#132e4e" />
            <path d="m157 55 27-8v16l-27 8Z" fill="#e8f5ff" />
            <path
              d="M85 70v17m96-15v12M137 23v15"
              stroke="#637f94"
              strokeWidth="5"
            />
            <path d="M127 29h20v13l-10 4-10-4Z" fill="#27afc3" />
          </svg>
          <span>EV-200</span>
        </div>
        <div className="portal-actions">
          <span>
            <FileText size={14} /> Manuais
            <ChevronRight size={13} />
          </span>
          <span className="accent">
            <Box size={14} /> Solicitar peça
            <ChevronRight size={13} />
          </span>
        </div>
      </div>
      <div className="scene-foot">
        <span>Máquina identificada.</span>
        <span>
          Conversa contextualizada. <ArrowUpRight size={14} />
        </span>
      </div>
    </div>
  );
}
const featureLabels: Record<string, string> = {
  equipment: "Equipamentos e QR Codes",
  documents: "Manuais e documentos",
  requests: "Recebimento de solicitações",
  parts: "Catálogo de peças",
  quotes: "Cotações e funil comercial",
  tickets: "Assistência técnica",
  reports: "Relatórios de pós-venda",
  advanced_roles: "Permissões avançadas",
};
export function Pricing() {
  const { data, error, loading, reload } = useData("/public/plans");
  if (loading) return <Loading />;
  if (error)
    return (
      <>
        <Notice error>{error}</Notice>
        <button className="text-button" onClick={reload}>
          Tentar carregar planos novamente
        </button>
      </>
    );
  return (
    <>
      <div className="pricing-grid">
        {data.plans.map((p: any) => (
          <article
            className={`plan ${p.id === "growth" ? "featured" : ""}`}
            key={p.id}
          >
            {p.id === "growth" && (
              <div className="plan-ribbon">
                PARA CONECTAR PEÇAS E ASSISTÊNCIA
              </div>
            )}
            <span className="eyebrow">{p.name}</span>
            <p className="plan-description">
              {p.id === "start"
                ? "O primeiro passo para conectar sua base."
                : p.id === "growth"
                  ? "Seu pós-venda, de ponta a ponta."
                  : "Mais estrutura para a sua operação."}
            </p>
            <div className="price">
              {money(p.monthly_cents).replace(",00", "")}
              <small>/ mês</small>
            </div>
            <p className="setup">
              + {money(p.setup_cents)} de implantação única
            </p>
            <Link
              href={`/cadastro?plano=${p.id}`}
              className={`button ${p.id === "growth" ? "" : "secondary"}`}
            >
              Escolher {p.name}
              <ArrowRight size={16} />
            </Link>
            <div className="plan-limits">
              <b>
                Até {p.equipment_limit.toLocaleString("pt-BR")} equipamentos
              </b>
              <span>{p.user_limit} usuários internos</span>
            </div>
            <ul>
              {p.features.map((f: string) => (
                <li key={f}>
                  <Check size={15} />
                  {featureLabels[f] ?? f}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="enterprise">
        <div>
          <span className="eyebrow">ENTERPRISE</span>
          <h3>Sua operação pede algo a mais?</h3>
          <p>
            Volumes maiores, integrações e condições específicas. Vamos definir
            o escopo juntos.
          </p>
        </div>
        <Link className="button secondary" href="/contato">
          Solicitar proposta <ArrowUpRight size={16} />
        </Link>
      </div>
      <p className="pricing-note">
        Valores iniciais configuráveis. Ambiente de desenvolvimento: contratação
        e pagamentos somente em sandbox. Os recursos operacionais descritos
        compõem o escopo do produto e ainda aguardam a fase P1.
      </p>
    </>
  );
}
export function Faq() {
  const items = [
    [
      "Preciso substituir meu ERP?",
      "Não. A proposta é organizar o canal de pós-venda. Pedidos, estoque e faturamento podem continuar nos seus sistemas atuais. Integrações são projetos separados.",
    ],
    [
      "É necessário instalar um aplicativo?",
      "Não. A equipe e os clientes acessam pelo navegador, no computador ou no celular.",
    ],
    [
      "Posso utilizar minha própria marca?",
      "Sim. O portal foi planejado com a identidade do fabricante. A configuração de nome, cor e canais de atendimento faz parte do onboarding.",
    ],
    [
      "Como funciona o QR Code?",
      "O código leva ao portal de um equipamento. Ele identifica a máquina, mas não comprova propriedade nem libera informações privadas. O módulo operacional será entregue na fase P1.",
    ],
    [
      "Como meus clientes solicitam peças?",
      "No fluxo planejado, o cliente acessa a máquina, seleciona peças compatíveis e envia seu contato. Sua equipe confere preço e compatibilidade antes de cotar. Experimente a demonstração isolada.",
    ],
    [
      "Preciso cadastrar todas as máquinas inicialmente?",
      "Não. Você pode começar com um grupo pequeno e ampliar aos poucos, respeitando os limites do plano.",
    ],
    [
      "Como funciona a implantação?",
      "A contratação inclui uma cobrança única de implantação, separada da mensalidade. O escopo deve ser acordado antes do lançamento comercial.",
    ],
    [
      "Como funciona o pagamento mensal?",
      "Nesta primeira integração sandbox, as cobranças de Pix e boleto são geradas mensalmente e exigem pagamento a cada período. Pix comum não é débito automático.",
    ],
    [
      "Posso mudar de plano?",
      "Antes de iniciar o pagamento, você pode trocar o plano. Depois, a mudança é solicitada à EWS para revisão de limites e condições, sem cobrança adicional automática.",
    ],
    [
      "O que acontece se cancelar?",
      "O pedido de cancelamento fica registrado e a recorrência é encerrada no provedor. O acesso segue até o fim do período já pago, quando aplicável. Não há exclusão automática de dados; condições e retenção estão sujeitas à revisão contratual.",
    ],
    [
      "Como meus dados são protegidos?",
      "A fundação inclui sessões protegidas, permissões por empresa, segregação no PostgreSQL e auditoria. A liberação comercial depende de homologação e revisão de segurança.",
    ],
    [
      "A plataforma também realiza pagamentos das peças?",
      "Não no MVP. O fabricante e o comprador combinam o pagamento fora da plataforma. A integração financeira da EWS é voltada à assinatura do software.",
    ],
  ];
  return (
    <div className="faq-list">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>
            {q}
            <span>+</span>
          </summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}
