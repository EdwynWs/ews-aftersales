"use client";
import {
  PageHeading,
  Loading,
  Notice,
  useData,
  ActionForm,
  Field,
  Button,
} from "@/components/ui";
import { api, date } from "@/lib/api";
import { useSession } from "@/components/workspace";
import { useState } from "react";
export default function Team() {
  const { data, error, loading, reload } = useData("/me/team"),
    session = useSession(),
    [notice, setNotice] = useState("");
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        title="Pessoas que fazem acontecer."
        description="Convide sua equipe e mantenha os acessos sob controle."
      />
      {notice && <Notice error>{notice}</Notice>}
      <div className="two-column">
        <section className="panel">
          <h2>Sua equipe</h2>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pessoa</th>
                  <th>Perfil</th>
                  <th>Acesso</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m: any) => (
                  <tr key={m.id}>
                    <td>
                      {m.name}
                      <small>{m.email}</small>
                    </td>
                    <td>{m.role}</td>
                    <td>
                      {m.id !== session.user.id ? (
                        <Button
                          className="secondary"
                          onClick={async () => {
                            if (!confirm(`Remover o acesso de ${m.name}?`))
                              return;
                            try {
                              await api(
                                `/me/team/${m.id}`,
                                undefined,
                                "DELETE",
                              );
                              await reload();
                            } catch (e) {
                              setNotice((e as Error).message);
                            }
                          }}
                        >
                          Remover
                        </Button>
                      ) : (
                        "Você"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ marginTop: 25 }}>Convites pendentes</h3>
          {data.invitations.length ? (
            data.invitations.map((i: any) => (
              <p key={i.id}>
                {i.email} · expira em {date(i.expires_at)}
              </p>
            ))
          ) : (
            <p>Nenhum convite pendente.</p>
          )}
        </section>
        <section className="panel">
          <h2>Convidar uma pessoa</h2>
          <p>
            Convites válidos já reservam uma vaga dentro do limite do plano.
          </p>
          <ActionForm
            success="Convite registrado para envio por e-mail."
            onSubmit={async (v) => {
              await api("/me/team/invite", v);
              await reload();
            }}
          >
            <Field label="E-mail" name="email" type="email" required />
            <label className="field">
              <span>Perfil</span>
              <select name="role">
                <option value="support">Atendimento</option>
                <option value="commercial">Comercial</option>
                <option value="technician">Técnico</option>
                <option value="admin">Administrador da indústria</option>
              </select>
            </label>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
