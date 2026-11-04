"use client";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Box,
  ShieldCheck,
} from "lucide-react";
import { useData, Loading, Notice, PageHeading } from "@/components/ui";
import { useSession } from "@/components/workspace";
export default function Overview() {
  const session = useSession(),
    { data, error, loading } = useData("/me/organization");
  if (loading) return <Loading />;
  if (error) return <Notice error>{error}</Notice>;
  return (
    <>
      <PageHeading
        eyebrow="SEU AMBIENTE EWS AFTERSALES"
        title={`Olá, ${session.user.name.split(" ")[0]}.`}
        description="Vamos preparar uma base organizada para o seu pós-venda."
      />
      <div className="two-column">
        <section className="panel">
          <h2>O primeiro passo é conectar sua empresa.</h2>
          <p>
            Conclua a contratação e configure como seus clientes vão reconhecer
            você.
          </p>
          <div className="progress-track">
            <i
              style={{
                width:
                  data.onboarding_step === 2
                    ? "100%"
                    : data.onboarding_step === 1
                      ? "66%"
                      : "33%",
              }}
            />
          </div>
          <ul className="checklist">
            <li>
              <CheckCircle2 size={21} />
              <span>
                <b>Conta criada e e-mail verificado</b>
                <small>Seu acesso está protegido.</small>
              </span>
            </li>
            <li>
              {data.onboarding_step >= 1 ? (
                <CheckCircle2 size={21} />
              ) : (
                <Circle className="status-muted" size={21} />
              )}
              <span>
                <b>Configurar identidade e atendimento</b>
                <small>Nome público, cor e canais de contato.</small>
              </span>
            </li>
            <li>
              {data.onboarding_step === 2 ? (
                <CheckCircle2 size={21} />
              ) : (
                <Circle className="status-muted" size={21} />
              )}
              <span>
                <b>Revisar a configuração inicial</b>
                <small>Confira a prévia e finalize esta etapa.</small>
              </span>
            </li>
          </ul>
          {session.role === "admin" && (
            <Link className="button" href="/app/onboarding">
              Configurar minha empresa <ArrowRight size={16} />
            </Link>
          )}
        </section>
        <section className="panel">
          <ShieldCheck size={30} color="#2163e8" />
          <h2 style={{ marginTop: 20 }}>Um ambiente para a sua empresa.</h2>
          <p>{data.name}</p>
          <p>
            Seus dados são separados por organização. Somente pessoas
            autorizadas entram na equipe.
          </p>
          {session.role === "admin" && (
            <Link href="/app/assinatura" className="text-link">
              Acompanhar contratação <ArrowRight size={15} />
            </Link>
          )}
        </section>
      </div>
      <section className="panel">
        <div className="empty">
          <Box size={33} />
          <h3>A operação industrial é a próxima fase.</h3>
          <p>
            Equipamentos, QR Codes, peças, cotações e assistência estão
            previstos no P1, após a homologação da contratação. Esta entrega
            contém a fundação P0.
          </p>
          <Link href="/demo" className="text-link">
            Experimentar o fluxo demonstrativo <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
