"use client";
import Link from "next/link";
import {
  PageHeading,
  ActionForm,
  Notice,
  useData,
  Loading,
} from "@/components/ui";
import { api, date } from "@/lib/api";
export default function Settings() {
  const { data, error, loading } = useData("/me/audit");
  return (
    <>
      <PageHeading
        title="Configurações e suporte."
        description="Sua empresa, suas solicitações e o histórico de alterações."
      />
      <div className="two-column">
        <section className="panel">
          <h2>Dados públicos da empresa</h2>
          <p>Revise nome, cor e canais de atendimento no onboarding.</p>
          <Link href="/app/onboarding" className="button secondary">
            Editar identidade
          </Link>
          <h2 style={{ marginTop: 30 }}>Precisa de ajuda?</h2>
          <ActionForm
            success="Solicitação registrada. A EWS pode consultá-la no painel administrativo."
            onSubmit={(v) => api("/me/requests", v)}
          >
            <label className="field">
              <span>Assunto</span>
              <select name="kind">
                <option value="support">Suporte</option>
                <option value="upgrade">Mudança de plano</option>
                <option value="privacy">Privacidade e dados</option>
              </select>
            </label>
            <label className="field">
              <span>Como podemos ajudar?</span>
              <textarea
                name="message"
                minLength={10}
                maxLength={2000}
                required
              />
            </label>
          </ActionForm>
        </section>
        <section className="panel">
          <h2>Histórico recente</h2>
          {loading ? (
            <Loading />
          ) : error ? (
            <Notice error>{error}</Notice>
          ) : (
            <ul className="audit-list">
              {data.map((r: any, i: number) => (
                <li key={i}>
                  {r.action}
                  <small>{date(r.created_at)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
