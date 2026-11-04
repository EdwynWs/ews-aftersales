"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import {
  PageHeading,
  useData,
  Loading,
  Notice,
  Button,
  External,
  Field,
} from "@/components/ui";
import { api, date, money, states } from "@/lib/api";
export default function Billing() {
  const { data, error, loading, reload } = useData("/me/billing"),
    plans = useData("/public/plans"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [failed, setFailed] = useState(false),
    [type, setType] = useState("PIX"),
    [accepted, setAccepted] = useState(false),
    [cancel, setCancel] = useState(false),
    [reason, setReason] = useState(""),
    [confirmation, setConfirmation] = useState("");
  useEffect(() => {
    if (!data?.subscription.checkout_started_at) return;
    const timer = setInterval(() => void reload(), 15000);
    return () => clearInterval(timer);
  }, [data?.subscription.checkout_started_at]);
  async function act(path: string, body: any, method?: string) {
    setBusy(true);
    setMessage("");
    try {
      const r = await api(path, body, method);
      setMessage(r.message ?? "Solicitação registrada.");
      setFailed(false);
      await reload();
    } catch (e) {
      setFailed(true);
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (loading && !data) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  if (!data) return null;
  const s = data.subscription,
    p = s.plan_snapshot,
    active = ["active", "cancel_scheduled", "past_due"].includes(s.state);
  return (
    <>
      <PageHeading
        eyebrow="CONTRATAÇÃO E COBRANÇA"
        title="Sua assinatura, com clareza."
        description="Implantação e mensalidade separadas. Nenhum valor escondido."
        action={
          <Button
            className="secondary"
            pending={busy}
            onClick={() => act("/me/reconcile", {})}
          >
            <RefreshCw size={15} /> Atualizar pagamentos
          </Button>
        }
      />
      {message && <Notice error={failed}>{message}</Notice>}
      <div className="two-column">
        <section className="panel">
          <div className="status-block">
            <CreditCard size={23} />
            <div>
              <h2 style={{ margin: 0 }}>Plano {p.name}</h2>
              <small className="badge">{states[s.state] ?? s.state}</small>
            </div>
          </div>
          <div className="summary-line">
            <span>
              Mensalidade<small>Recorrência mensal</small>
            </span>
            <b>{money(p.monthly_cents)}</b>
          </div>
          <div className="summary-line">
            <span>
              Implantação<small>Cobrança única</small>
            </span>
            <b>{money(p.setup_cents)}</b>
          </div>
          <div className="summary-line total">
            <span>Total inicial</span>
            <b>{money(p.monthly_cents + p.setup_cents)}</b>
          </div>
          <p className="form-note">
            Até {p.equipment_limit.toLocaleString("pt-BR")} equipamentos e{" "}
            {p.user_limit} usuários internos. Os valores deste contrato são
            preservados mesmo se a tabela pública mudar.
          </p>
          {!s.checkout_started_at ? (
            <>
              <label className="field">
                <span>Quer alterar o plano antes de pagar?</span>
                <select
                  value={s.plan_id}
                  onChange={(e) =>
                    act("/me/plan", { plan: e.target.value }, "PUT")
                  }
                  disabled={busy}
                >
                  {plans.data?.plans.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {money(p.monthly_cents)}/mês
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Forma de pagamento</span>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="PIX">Pix — pagamento manual a cada mês</option>
                  <option value="BOLETO">
                    Boleto — pagamento manual a cada mês
                  </option>
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                />
                <span>
                  Concordo com o total inicial e com a geração de cobranças
                  mensais. Li as{" "}
                  <Link href="/legal/contratacao">
                    condições de contratação e cancelamento
                  </Link>
                  .
                </span>
              </label>
              <Button
                pending={busy}
                disabled={!accepted || !data.checkoutEnabled}
                onClick={() =>
                  act("/me/checkout", { billingType: type, accepted: true })
                }
              >
                Iniciar pagamento sandbox <ArrowRight size={16} />
              </Button>
              {!data.checkoutEnabled && (
                <div className="warning-label">
                  O checkout sandbox ainda não foi configurado. Sua conta e a
                  escolha do plano ficam salvas; nenhuma cobrança será criada.
                </div>
              )}
            </>
          ) : (
            <>
              <p className="form-note">
                Pagamento por {s.billing_type}. Pix comum e boleto exigem
                pagamento manual a cada ciclo.
              </p>
              {active && (
                <Link className="button" href="/app/onboarding">
                  Configurar minha empresa <ArrowRight size={16} />
                </Link>
              )}
            </>
          )}
        </section>
        <section className="panel">
          <h2>
            {active
              ? "Sua assinatura está disponível."
              : "Como o acesso é liberado"}
          </h2>
          <ul className="checklist">
            <li>
              <CheckCircle2 size={19} />
              <span>
                <b>Conta e e-mail confirmados</b>
                <small>Primeira etapa concluída.</small>
              </span>
            </li>
            <li>
              <span className="step-badge">2</span>
              <span>
                <b>Pague implantação e mensalidade</b>
                <small>Cada cobrança aparece separadamente abaixo.</small>
              </span>
            </li>
            <li>
              <span className="step-badge">3</span>
              <span>
                <b>Aguarde a confirmação do provedor</b>
                <small>
                  O retorno da página de pagamento não libera o acesso.
                </small>
              </span>
            </li>
            <li>
              <span className="step-badge">4</span>
              <span>
                <b>Configure sua empresa</b>
                <small>Comece pela identidade e canais de atendimento.</small>
              </span>
            </li>
          </ul>
          <p className="form-note">
            Se apenas uma cobrança for paga, a contratação continua parcial.
            Prazo para regularização das mensalidades: {data.graceDays} dias.
            Dados não são apagados por inadimplência.
          </p>
          {s.cancel_at && (
            <Notice>
              Cancelamento previsto para {date(s.cancel_at)}. Acompanhe a
              confirmação pela EWS.
            </Notice>
          )}
          {data.commands.some((c: any) => c.state === "uncertain") && (
            <Notice error>
              Uma tentativa precisa ser conciliada. Não faça outra contratação;
              entre em contato com a EWS.
            </Notice>
          )}
        </section>
      </div>
      <section className="panel">
        <h2>Cobranças</h2>
        {data.charges.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {data.charges.map((c: any) => (
                  <tr key={c.id}>
                    <td>
                      {c.kind === "setup" ? "Implantação" : "Mensalidade"}
                    </td>
                    <td>{date(c.due_date)}</td>
                    <td>{money(c.amount_cents)}</td>
                    <td>
                      <span className="badge">
                        {states[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>
                      {c.invoice_url ? (
                        <External href={c.invoice_url}>Abrir fatura</External>
                      ) : (
                        "Em conciliação"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <CreditCard size={25} />
            <h3>Nenhuma cobrança criada.</h3>
            <p>
              {s.checkout_started_at
                ? "A contratação foi registrada e aguarda o processamento do worker."
                : "Revise o plano e inicie o checkout quando o sandbox estiver configurado."}
            </p>
          </div>
        )}
      </section>
      <div className="inline-actions">
        <Link href="/app/configuracoes" className="text-link">
          Solicitar upgrade ou suporte
        </Link>
        {s.checkout_started_at && !s.cancel_at && (
          <button className="text-button" onClick={() => setCancel(!cancel)}>
            Solicitar cancelamento
          </button>
        )}
      </div>
      {cancel && (
        <section className="panel" style={{ marginTop: 20 }}>
          <h2>Confirmar cancelamento</h2>
          <p>
            A recorrência será cancelada no provedor. O acesso segue até o fim
            do período pago, quando aplicável. Seus dados serão preservados;
            eventuais reembolsos exigem análise conforme a política aplicável.
          </p>
          <Field
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={5}
          />
          <Field
            label="Digite CANCELAR para confirmar"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />
          <Button
            className="danger"
            pending={busy}
            disabled={confirmation !== "CANCELAR" || reason.length < 5}
            onClick={() => act("/me/cancel", { confirmation, reason })}
          >
            Confirmar cancelamento
          </Button>
        </section>
      )}
    </>
  );
}
