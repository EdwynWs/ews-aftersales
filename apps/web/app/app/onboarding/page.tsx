"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  PageHeading,
  useData,
  Loading,
  Notice,
  ActionForm,
  Field,
  Button,
} from "@/components/ui";
import { api } from "@/lib/api";
export default function Onboarding() {
  const { data, error, loading, reload } = useData("/me/organization"),
    [preview, setPreview] = useState({
      brandName: "Sua empresa",
      brandColor: "#2163e8",
    }),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        eyebrow="PRIMEIROS PASSOS · FUNDAÇÃO"
        title="Vamos preparar sua empresa."
        description="Configure sua identidade e confira como seus clientes reconhecerão sua marca."
      />
      <div className="two-column">
        <section className="panel">
          <h2>1. Identidade e atendimento</h2>
          <p>
            A configuração é liberada depois da confirmação dos dois pagamentos
            iniciais.
          </p>
          <ActionForm
            onSubmit={async (v) => {
              await api("/me/organization", v, "PUT");
              await reload();
            }}
          >
            <Field
              label="Nome público da empresa"
              name="brandName"
              defaultValue={data.brand_name || data.name}
              required
              maxLength={100}
              onChange={(e) =>
                setPreview({ ...preview, brandName: e.target.value })
              }
            />
            <Field
              label="Cor principal"
              name="brandColor"
              type="color"
              defaultValue={data.brand_color}
              onChange={(e) =>
                setPreview({ ...preview, brandColor: e.target.value })
              }
            />
            <Field
              label="E-mail de suporte"
              name="supportEmail"
              type="email"
              defaultValue={data.support_email}
              required
            />
            <Field
              label="Telefone de atendimento"
              name="supportPhone"
              defaultValue={data.support_phone}
              required
              minLength={10}
            />
            <Field
              label="Horário de atendimento"
              name="hours"
              defaultValue={data.hours}
              placeholder="Segunda a sexta, das 8h às 18h"
              required
            />
          </ActionForm>
        </section>
        <div>
          <section className="panel">
            <h2>Prévia da identidade</h2>
            <p>
              Uma referência visual dos dados públicos. O portal operacional
              será implementado no P1.
            </p>
            <div className="brand-preview">
              <header>
                <span style={{ background: preview.brandColor }}>
                  <Building2 size={20} />
                </span>
                <b>
                  {preview.brandName === "Sua empresa"
                    ? data.brand_name || data.name
                    : preview.brandName}
                </b>
              </header>
              <p>Atendimento do fabricante</p>
              <small>{data.support_email || "E-mail de suporte"}</small>
              <small>{data.support_phone || "Telefone de atendimento"}</small>
              <small>{data.hours || "Horário de atendimento"}</small>
            </div>
          </section>
          <section className="panel">
            <h2>2. Revisar e concluir</h2>
            <p>
              Confira os canais acima antes de concluir a configuração inicial.
            </p>
            <Button
              pending={busy}
              disabled={data.onboarding_step < 1}
              onClick={async () => {
                setBusy(true);
                try {
                  await api("/me/onboarding/complete", {});
                  setMessage("Configuração inicial concluída.");
                  await reload();
                } catch (e) {
                  setMessage((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {data.onboarding_step === 2 ? <CheckCircle2 size={17} /> : null}
              Concluir configuração
            </Button>
            {message && <Notice>{message}</Notice>}
          </section>
        </div>
      </div>
      <section className="panel">
        <h2>Próximas etapas do produto</h2>
        <p>
          Modelo → equipamento vendido → documentos → peças → QR Code. Essas
          etapas pertencem ao P1 e ainda não estão disponíveis nesta entrega.
        </p>
        <Link href="/demo" className="text-link">
          Explorar demonstração isolada <ArrowRight size={15} />
        </Link>
      </section>
    </>
  );
}
