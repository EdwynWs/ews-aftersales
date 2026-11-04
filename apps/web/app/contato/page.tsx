"use client";
import { Nav, Footer } from "@/components/marketing";
import { ActionForm, Field } from "@/components/ui";
import { api } from "@/lib/api";
export default function Contact() {
  return (
    <>
      <Nav />
      <main id="main" className="container section">
        <div className="two-column">
          <div className="section-heading">
            <span className="eyebrow">CONVERSE COM A EWS</span>
            <h1>
              O seu pós-venda
              <br />
              tem suas particularidades.
            </h1>
            <p>
              Conte um pouco sobre a base instalada, a equipe e o que você quer
              organizar. Sua solicitação fica registrada no painel comercial da
              EWS.
            </p>
            <p>
              Não é necessário compartilhar informações confidenciais de
              clientes ou equipamentos.
            </p>
          </div>
          <section className="panel">
            <ActionForm
              success="Solicitação salva. A equipe EWS poderá consultá-la no painel administrativo."
              onSubmit={(v) =>
                api("/public/contact", { ...v, consent: v.consent === "on" })
              }
            >
              <Field
                label="Nome"
                name="name"
                required
                minLength={2}
                maxLength={120}
              />
              <Field label="E-mail" name="email" type="email" required />
              <Field
                label="Empresa"
                name="company"
                required
                minLength={2}
                maxLength={180}
              />
              <label className="field">
                <span>Conte sobre sua operação</span>
                <textarea
                  name="message"
                  minLength={10}
                  maxLength={2000}
                  required
                />
              </label>
              <label className="checkbox">
                <input type="checkbox" name="consent" required />
                <span>
                  Autorizo o contato sobre esta solicitação e li a Política de
                  Privacidade.
                </span>
              </label>
            </ActionForm>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
