"use client";
import { useState } from "react";
import {
  PageHeading,
  useData,
  Loading,
  Notice,
  Button,
  ActionForm,
  Field,
} from "./ui";
import { api, date, money, states } from "@/lib/api";
export function AdminOverview() {
  const { data, error, loading } = useData("/ews/overview");
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        eyebrow="EWS TECH · ADMINISTRAÇÃO"
        title="O pulso da plataforma."
        description="Contratos, recebimentos e processamento. Dados reais, separados por natureza."
      />
      <div className="stats">
        {[
          ["Empresas cadastradas", data.stats.organizations],
          ["Assinaturas ativas", data.stats.active],
          ["Aguardando pagamento", data.stats.pending],
          ["MRR contratado", money(data.stats.mrr)],
        ].map(([l, v]) => (
          <div className="stat" key={l}>
            <span>{l}</span>
            <b>{v}</b>
          </div>
        ))}
      </div>
      <div className="two-column">
        <section className="panel">
          <h2>Receita efetivamente recebida</h2>
          <div className="summary-line">
            <span>Mensalidades</span>
            <b>{money(data.receipts.recurring)}</b>
          </div>
          <div className="summary-line">
            <span>Implantações</span>
            <b>{money(data.receipts.setup)}</b>
          </div>
          <p className="form-note" style={{ marginTop: 15 }}>
            Acumulado de cobranças com estado RECEIVED no provedor. MRR não é
            caixa. Apenas dados de sandbox nesta entrega.
          </p>
        </section>
        <section className="panel">
          <h2>Fila de processamento</h2>
          {data.queue.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Pendentes</th>
                    <th>Último erro</th>
                  </tr>
                </thead>
                <tbody>
                  {data.queue.map((j: any, i: number) => (
                    <tr key={i}>
                      <td>{j.kind}</td>
                      <td>{j.total}</td>
                      <td>{j.error_code ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Nenhum processamento pendente.</p>
          )}
        </section>
      </div>
      <JobQueue />
    </>
  );
}
function JobQueue() {
  const { data, error, loading, reload } = useData("/ews/jobs"),
    [message, setMessage] = useState("");
  return (
    <section className="panel">
      <h2>Processamentos pendentes</h2>
      {message && <Notice>{message}</Notice>}
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : !data.length ? (
        <p>Nenhum item pendente.</p>
      ) : (
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Tentativas</th>
                <th>Erro</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.map((j: any) => (
                <tr key={j.id}>
                  <td>
                    {j.kind}
                    <small>{j.id}</small>
                  </td>
                  <td>{j.attempts}/8</td>
                  <td>{j.error_code ?? "—"}</td>
                  <td>
                    <Button
                      className="secondary"
                      disabled={!!j.locked_at}
                      onClick={async () => {
                        const reason = prompt(
                          "Justifique o reprocessamento (mínimo 10 caracteres):",
                        );
                        if (!reason) return;
                        try {
                          await api(`/ews/jobs/${j.id}/retry`, { reason });
                          setMessage(
                            "Reprocessamento registrado, sem liberar recriação de cobranças incertas.",
                          );
                          await reload();
                        } catch (e) {
                          setMessage((e as Error).message);
                        }
                      }}
                    >
                      Reprocessar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
export function AdminCompanies() {
  const [q, setQ] = useState(""),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    { data, error, loading, reload } = useData(
      `/ews/organizations?q=${encodeURIComponent(search)}&page=${page}`,
    ),
    [detail, setDetail] = useState<any>(null),
    [message, setMessage] = useState("");
  return (
    <>
      <PageHeading
        title="Empresas assinantes."
        description="Consulte contratos e execute ações com justificativa e auditoria."
      />
      <form
        className="inline-actions"
        style={{ marginBottom: 22 }}
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q);
          setPage(1);
        }}
      >
        <input
          className="search"
          style={{ maxWidth: 330 }}
          placeholder="Buscar empresa pelo nome"
          aria-label="Buscar empresa"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button>Buscar</Button>
      </form>
      {message && <Notice>{message}</Notice>}
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Assinatura</th>
                  <th>Cadastro</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {data.map((o: any) => (
                  <tr key={o.id}>
                    <td>
                      {o.name}
                      <small>{o.cnpj}</small>
                    </td>
                    <td>{o.plan_id}</td>
                    <td>
                      <span className="badge">{states[o.state]}</span>
                    </td>
                    <td>{date(o.created_at)}</td>
                    <td>
                      <Button
                        className="secondary"
                        onClick={async () => {
                          try {
                            setDetail(await api(`/ews/organizations/${o.id}`));
                          } catch (e) {
                            setMessage((e as Error).message);
                          }
                        }}
                      >
                        Consultar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.length && (
              <div className="empty">
                <p>Nenhuma empresa encontrada.</p>
              </div>
            )}
          </div>
          <div className="inline-actions">
            <Button
              className="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span>Página {page}</span>
            <Button
              className="secondary"
              disabled={data.length < 30}
              onClick={() => setPage(page + 1)}
            >
              Próxima
            </Button>
          </div>
        </section>
      )}
      {detail && (
        <section className="panel">
          <h2>{detail.organization.name}</h2>
          <p>
            {states[detail.organization.state]} ·{" "}
            {money(detail.organization.plan_snapshot.monthly_cents)}/mês
          </p>
          <div className="inline-actions">
            <Button
              className="secondary"
              onClick={async () => {
                try {
                  await api(
                    `/ews/organizations/${detail.organization.id}/reconcile`,
                    {},
                  );
                  setMessage("Conciliação adicionada à fila.");
                } catch (e) {
                  setMessage((e as Error).message);
                }
              }}
            >
              Reprocessar conciliação
            </Button>
            <Button className="secondary" onClick={() => setDetail(null)}>
              Fechar detalhes
            </Button>
          </div>
          <ActionForm
            className="section"
            success="Restrição administrativa atualizada. O estado financeiro continua sendo verificado."
            onSubmit={async (v) => {
              await api(
                `/ews/organizations/${detail.organization.id}/suspension`,
                { suspended: v.suspended === "true", reason: v.reason },
              );
              await reload();
              setDetail(
                await api(`/ews/organizations/${detail.organization.id}`),
              );
            }}
          >
            <label className="field">
              <span>Restrição administrativa</span>
              <select
                name="suspended"
                defaultValue={String(detail.organization.admin_suspended)}
              >
                <option value="true">Suspender acesso</option>
                <option value="false">Remover suspensão administrativa</option>
              </select>
            </label>
            <Field
              label="Justificativa obrigatória"
              name="reason"
              minLength={10}
              required
            />
          </ActionForm>
          <h3>Auditoria recente</h3>
          <ul className="audit-list">
            {detail.audit.map((a: any, i: number) => (
              <li key={i}>
                {a.action}
                <small>{date(a.created_at)}</small>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
function PlanEditor({
  plan,
  onDone,
}: {
  plan: any;
  onDone: () => Promise<void>;
}) {
  const featureOptions = [
    ["equipment", "Equipamentos e QR"],
    ["documents", "Documentos"],
    ["requests", "Solicitações"],
    ["parts", "Peças"],
    ["quotes", "Cotações"],
    ["tickets", "Assistência"],
    ["reports", "Relatórios"],
    ["advanced_roles", "Permissões avançadas"],
  ];
  return (
    <section className="panel">
      <h2>{plan.name}</h2>
      <ActionForm
        onSubmit={async (v) => {
          await api(
            `/ews/plans/${plan.id}`,
            {
              monthly_cents: Math.round(Number(v.monthly) * 100),
              setup_cents: Math.round(Number(v.setup) * 100),
              equipment_limit: Number(v.equipment),
              user_limit: Number(v.users),
              active: v.active === "true",
              features: featureOptions
                .filter(([key]) => v["feature_" + key] === "on")
                .map(([key]) => key),
              reason: v.reason,
            },
            "PUT",
          );
          await onDone();
        }}
      >
        <div className="form-row">
          <Field
            label="Mensalidade (R$)"
            name="monthly"
            type="number"
            min="1"
            step=".01"
            defaultValue={plan.monthly_cents / 100}
            required
          />
          <Field
            label="Implantação (R$)"
            name="setup"
            type="number"
            min="1"
            step=".01"
            defaultValue={plan.setup_cents / 100}
            required
          />
        </div>
        <div className="form-row">
          <Field
            label="Limite de equipamentos"
            name="equipment"
            type="number"
            min="1"
            defaultValue={plan.equipment_limit}
            required
          />
          <Field
            label="Limite de usuários"
            name="users"
            type="number"
            min="1"
            defaultValue={plan.user_limit}
            required
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <h3>Recursos previstos no plano</h3>
          {featureOptions.map(([key, label]) => (
            <label className="checkbox" key={key}>
              <input
                type="checkbox"
                name={"feature_" + key}
                defaultChecked={plan.features.includes(key)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <label className="field">
          <span>Disponibilidade</span>
          <select name="active" defaultValue={String(plan.active)}>
            <option value="true">Disponível para novas contas</option>
            <option value="false">Indisponível para novas contas</option>
          </select>
        </label>
        <Field
          name="reason"
          label="Motivo da alteração"
          required
          minLength={10}
        />
        <p className="form-note">
          Recursos configurados: {plan.features.join(", ")}. Revisão{" "}
          {plan.revision}.
        </p>
      </ActionForm>
    </section>
  );
}
export function AdminPlans() {
  const { data, error, loading, reload } = useData("/ews/plans");
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        title="Planos e condições."
        description="Alterações valem para novas seleções de plano. Contratos existentes preservam seus valores e limites."
      />
      <div className="two-column">
        {data.map((p: any) => (
          <PlanEditor key={p.id + ":" + p.revision} plan={p} onDone={reload} />
        ))}
      </div>
    </>
  );
}
export function AdminInbox() {
  const { data, error, loading } = useData("/ews/inbox");
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        title="Solicitações recebidas."
        description="Propostas Enterprise, suporte, privacidade e mudanças de plano."
      />
      <div className="two-column">
        <section className="panel">
          <h2>Contato comercial</h2>
          {data.leads.length ? (
            data.leads.map((l: any) => (
              <article className="demo-event" key={l.id}>
                <b>
                  {l.company} · {l.name}
                </b>
                <span>
                  {l.email} · {date(l.created_at)}
                </span>
                <p>{l.message}</p>
              </article>
            ))
          ) : (
            <p>Nenhum contato recebido.</p>
          )}
        </section>
        <section className="panel">
          <h2>Empresas assinantes</h2>
          {data.requests.length ? (
            data.requests.map((r: any) => (
              <article className="demo-event" key={r.id}>
                <b>
                  {r.organization} · {r.kind}
                </b>
                <span>
                  {date(r.created_at)} · {r.id}
                </span>
                <p>{r.message}</p>
              </article>
            ))
          ) : (
            <p>Nenhuma solicitação recebida.</p>
          )}
        </section>
      </div>
    </>
  );
}
export function AdminEvents() {
  const { data, error, loading, reload } = useData("/ews/events");
  return (
    <>
      <PageHeading
        title="Eventos do provedor."
        description="Eventos autenticados, persistidos e processados pela fila."
        action={
          <Button className="secondary" onClick={reload}>
            Atualizar
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : (
        <section className="panel">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Recebido</th>
                  <th>Processamento</th>
                </tr>
              </thead>
              <tbody>
                {data.map((e: any) => (
                  <tr key={e.id}>
                    <td>
                      {e.event}
                      <small>{e.id}</small>
                    </td>
                    <td>{date(e.received_at)}</td>
                    <td>{e.processed_at ? "Processado" : "Pendente"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.length && (
              <p style={{ padding: 20 }}>Nenhum evento recebido.</p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
