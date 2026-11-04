"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Box,
  FileText,
  Headphones,
  ArrowRight,
  RotateCcw,
  ScanLine,
  CheckCircle2,
} from "lucide-react";
import { Nav, Footer } from "@/components/marketing";
import { Button, Field, Notice } from "@/components/ui";
import { money } from "@/lib/api";
type Demo = {
  equipment: string;
  requests: {
    id: number;
    kind: string;
    part: string;
    name: string;
    quantity: number;
    status: string;
    value: number;
  }[];
};
const initial: Demo = { equipment: "Envasadora EV-200", requests: [] };
export default function Demo() {
  const [state, setState] = useState<Demo>(initial),
    [tab, setTab] = useState("portal"),
    [form, setForm] = useState(""),
    [message, setMessage] = useState(""),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ews-isolated-demo");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          typeof parsed.equipment === "string" &&
          Array.isArray(parsed.requests)
        )
          setState(parsed);
      }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded)
      try {
        sessionStorage.setItem("ews-isolated-demo", JSON.stringify(state));
      } catch {}
  }, [state, loaded]);
  function status(id: number, status: string, value?: number) {
    setState({
      ...state,
      requests: state.requests.map((r) =>
        r.id === id ? { ...r, status, value: value ?? r.value } : r,
      ),
    });
  }
  const sold = state.requests.filter((r) => r.status === "confirmed"),
    quotes = state.requests.filter((r) =>
      ["quoted", "accepted", "confirmed"].includes(r.status),
    );
  return (
    <>
      <Nav />
      <div className="demo-bar">
        <span>
          DEMONSTRAÇÃO ISOLADA · Dados fictícios salvos apenas nesta aba. Nenhum
          pagamento ou envio real.
        </span>
        <button
          className="text-button"
          onClick={() => {
            setState(initial);
            setMessage("Demonstração reiniciada.");
            setForm("");
          }}
        >
          <RotateCcw size={13} /> Reiniciar
        </button>
      </div>
      <main id="main" className="container section">
        <div className="section-heading">
          <span className="eyebrow">EXPERIMENTE O FLUXO</span>
          <h1>
            Uma solicitação.
            <br />
            Todo o contexto.
          </h1>
          <p>
            Peça uma peça pelo portal. Depois, alterne para o fabricante e
            acompanhe o caminho até a venda.
          </p>
        </div>
        <div className="demo-tabs">
          {[
            ["portal", "Portal do cliente"],
            ["manufacturer", "Painel do fabricante"],
            ["equipment", "Cadastro de equipamento"],
          ].map(([k, l]) => (
            <button
              className={tab === k ? "active" : ""}
              key={k}
              onClick={() => {
                setTab(k);
                setForm("");
              }}
            >
              {l}
            </button>
          ))}
        </div>
        {message && <Notice>{message}</Notice>}
        <div className="demo-layout">
          <aside className="demo-phone">
            <span className="eyebrow">FABRICANTE EXEMPLO</span>
            <h2>{state.equipment}</h2>
            <p>Unidade demonstrativa · Série DEMO-001</p>
            <div className="demo-machine">
              <Box size={70} />
            </div>
            <span className="badge">
              <ScanLine size={12} /> Equipamento identificado
            </span>
            <p>
              Portal acessado pelo link do QR. Dados privados e propriedade não
              são revelados por esse acesso.
            </p>
            <Button
              className="secondary"
              onClick={() => {
                setTab("portal");
                setForm("manual");
              }}
            >
              <FileText size={16} /> Consultar manual
            </Button>
            <Button
              onClick={() => {
                setTab("portal");
                setForm("part");
              }}
            >
              <Box size={16} /> Solicitar peça
            </Button>
            <Button
              className="secondary"
              onClick={() => {
                setTab("portal");
                setForm("ticket");
              }}
            >
              <Headphones size={16} /> Pedir assistência
            </Button>
          </aside>
          <div>
            {tab === "portal" && (
              <section className="panel">
                <h2>
                  {form === "manual"
                    ? "Manual demonstrativo"
                    : form === "part"
                      ? "Solicitar uma peça"
                      : form === "ticket"
                        ? "Abrir chamado"
                        : "Bem-vindo ao portal do equipamento."}
                </h2>
                {form === "manual" ? (
                  <>
                    <p>
                      Documento ilustrativo, sem instruções de operação. Na
                      versão operacional, o fabricante disponibilizará
                      documentação autorizada e versionada.
                    </p>
                    <p>
                      Modelo: {state.equipment}
                      <br />
                      Versão do documento: demonstração 1.0
                    </p>
                    <Button
                      className="secondary"
                      onClick={() => window.print()}
                    >
                      Imprimir visualização
                    </Button>
                  </>
                ) : form === "part" || form === "ticket" ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const v = Object.fromEntries(
                        new FormData(e.currentTarget),
                      );
                      const entry = {
                        id: Date.now(),
                        kind: form,
                        part: String(v.part ?? v.description),
                        name: String(v.name),
                        quantity: Number(v.quantity ?? 1),
                        status: "new",
                        value: 0,
                      };
                      setState({
                        ...state,
                        requests: [...state.requests, entry],
                      });
                      setMessage(
                        `Protocolo DEMO-${state.requests.length + 1} criado. Veja a solicitação no painel do fabricante.`,
                      );
                      setForm("");
                    }}
                  >
                    <Field
                      label="Nome do solicitante fictício"
                      name="name"
                      required
                      maxLength={80}
                    />
                    {form === "part" ? (
                      <>
                        <label className="field">
                          <span>Peça compatível (exemplo)</span>
                          <select name="part">
                            <option>Kit de vedação EV-200</option>
                            <option>Bico de envase EV-200</option>
                            <option>Correia EV-200</option>
                          </select>
                        </label>
                        <Field
                          label="Quantidade"
                          name="quantity"
                          type="number"
                          min={1}
                          max={100}
                          defaultValue={1}
                          required
                        />
                      </>
                    ) : (
                      <label className="field">
                        <span>Descrição do problema fictício</span>
                        <textarea
                          name="description"
                          required
                          maxLength={1000}
                        />
                      </label>
                    )}
                    <Button>
                      Enviar solicitação demonstrativa <ArrowRight size={15} />
                    </Button>
                  </form>
                ) : (
                  <>
                    <p>
                      Use as ações ao lado para consultar um documento
                      ilustrativo, solicitar uma peça ou abrir um chamado.
                    </p>
                    <div className="empty">
                      <ScanLine size={36} />
                      <h3>Do equipamento ao atendimento.</h3>
                      <p>
                        A identificação da máquina acompanha cada solicitação.
                      </p>
                    </div>
                  </>
                )}
                {state.requests
                  .filter(
                    (r) => r.status === "quoted" || r.status === "accepted",
                  )
                  .map((r) => (
                    <div className="demo-event" key={r.id}>
                      <b>
                        Proposta: {r.part} · {money(r.value)}
                      </b>
                      <span>
                        {r.status === "accepted"
                          ? "Proposta aceita. A venda ainda precisa ser confirmada pelo fabricante."
                          : "Proposta fictícia disponível nesta demonstração."}
                      </span>
                      {r.status === "quoted" && (
                        <Button
                          className="small"
                          onClick={() => status(r.id, "accepted")}
                        >
                          Aceitar proposta de exemplo
                        </Button>
                      )}
                    </div>
                  ))}
              </section>
            )}
            {tab === "manufacturer" && (
              <>
                <div
                  className="stats"
                  style={{ gridTemplateColumns: "repeat(2,1fr)" }}
                >
                  {[
                    ["Solicitações", state.requests.length],
                    ["Cotações", quotes.length],
                    ["Pedidos confirmados", sold.length],
                    [
                      "Vendas confirmadas",
                      money(sold.reduce((sum, r) => sum + r.value, 0)),
                    ],
                  ].map(([k, v]) => (
                    <div className="stat" key={k}>
                      <span>{k}</span>
                      <b>{v}</b>
                      <small>Dados desta demonstração</small>
                    </div>
                  ))}
                </div>
                <section className="panel">
                  <h2>Solicitações recebidas</h2>
                  {!state.requests.length && (
                    <div className="empty">
                      <Box size={32} />
                      <p>
                        Nenhuma solicitação ainda. Abra o portal e envie a
                        primeira.
                      </p>
                      <Button
                        onClick={() => {
                          setTab("portal");
                          setForm("part");
                        }}
                      >
                        Experimentar solicitação
                      </Button>
                    </div>
                  )}
                  {state.requests.map((r) => (
                    <article className="demo-event" key={r.id}>
                      <b>{r.part}</b>
                      <span>
                        {state.equipment} · {r.name} · Quantidade {r.quantity}
                      </span>
                      <p>
                        {
                          (
                            {
                              new: "Nova solicitação",
                              quoted: "Cotação enviada",
                              accepted: "Aceita pelo cliente",
                              confirmed: "Venda confirmada",
                              working: "Em atendimento",
                              closed: "Concluído",
                            } as any
                          )[r.status]
                        }
                      </p>
                      {r.kind === "part" && r.status === "new" && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const v = new FormData(e.currentTarget);
                            status(
                              r.id,
                              "quoted",
                              Math.round(Number(v.get("value")) * 100),
                            );
                            setMessage(
                              "Proposta demonstrativa enviada. No portal, você pode aceitá-la.",
                            );
                          }}
                        >
                          <Field
                            label="Valor total da proposta (R$)"
                            name="value"
                            type="number"
                            min="0.01"
                            step=".01"
                            required
                          />
                          <Button className="small">
                            Enviar cotação de exemplo
                          </Button>
                        </form>
                      )}
                      {r.status === "accepted" && (
                        <Button
                          className="small"
                          onClick={() => status(r.id, "confirmed")}
                        >
                          Registrar venda confirmada
                        </Button>
                      )}
                      {r.kind === "ticket" && r.status === "new" && (
                        <Button
                          className="small"
                          onClick={() => status(r.id, "working")}
                        >
                          Iniciar atendimento
                        </Button>
                      )}
                      {r.kind === "ticket" && r.status === "working" && (
                        <Button
                          className="small"
                          onClick={() => status(r.id, "closed")}
                        >
                          Concluir atendimento
                        </Button>
                      )}
                      {r.status === "confirmed" && (
                        <span className="badge">
                          <CheckCircle2 size={12} /> {money(r.value)}{" "}
                          registrados
                        </span>
                      )}
                    </article>
                  ))}
                </section>
              </>
            )}
            {tab === "equipment" && (
              <section className="panel">
                <h2>Primeiro equipamento</h2>
                <p>
                  Altere o nome da máquina fictícia e veja a identificação
                  refletida no portal.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = String(
                      new FormData(e.currentTarget).get("equipment"),
                    );
                    setState({ ...state, equipment: name });
                    setMessage(
                      "Equipamento demonstrativo atualizado nesta aba.",
                    );
                  }}
                >
                  <Field
                    label="Nome do equipamento"
                    name="equipment"
                    defaultValue={state.equipment}
                    required
                    minLength={3}
                    maxLength={70}
                  />
                  <Button>Salvar na demonstração</Button>
                </form>
              </section>
            )}
            <p className="form-note">
              Esta demonstração é separada do banco de dados e dos ambientes dos
              assinantes. O P1 implementará esse fluxo na operação real.
            </p>
            <Link className="text-link" href="/precos">
              Conhecer os planos <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
