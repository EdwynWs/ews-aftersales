"use client";
import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Mail } from "lucide-react";
import { Brand, Button, Field, Notice, useData } from "./ui";
import { api, ApiError, money } from "@/lib/api";
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="auth-page">
      <aside className="auth-aside">
        <Brand light />
        <div>
          <span className="eyebrow">CONEXÕES QUE CONTINUAM</span>
          <h2>
            O próximo capítulo
            <br />
            da sua máquina.
            <br />
            <span>E do seu negócio.</span>
          </h2>
          <p>
            Um canal direto entre quem fabrica, quem compra e quem cuida de cada
            equipamento.
          </p>
          <ShieldCheck size={31} color="#4c88b3" />
        </div>
        <small>EWS AfterSales · Ambiente de desenvolvimento / sandbox</small>
      </aside>
      <section className="auth-main">
        <div className="auth-content">{children}</div>
      </section>
    </main>
  );
}
export function AuthForm({
  mode,
}: {
  mode: "signup" | "login" | "forgot" | "reset" | "verify" | "admin" | "invite";
}) {
  const router = useRouter(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [secret, setSecret] = useState(""),
    [plan, setPlan] = useState("growth");
  const { data } = useData("/public/plans");
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setPlan(
      ["start", "growth", "industry"].includes(params.get("plano") ?? "")
        ? params.get("plano")!
        : "growth",
    );
    setSecret(new URLSearchParams(location.hash.slice(1)).get("token") ?? "");
    if (location.hash)
      history.replaceState(null, "", location.pathname + location.search);
  }, []);
  const titles = {
    signup: "Vamos conectar sua operação.",
    login: "Bom ter você de volta.",
    forgot: "Recupere seu acesso.",
    reset: "Escolha uma nova senha.",
    verify: "Confirme seu e-mail.",
    admin: "Confirme seu acesso EWS.",
    invite: "Sua equipe está esperando.",
  };
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const b = Object.fromEntries(new FormData(e.currentTarget));
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        await api("/auth/signup", { ...b, plan, terms: b.terms === "on" });
        router.push("/verificar-email");
      }
      if (mode === "login") {
        const r = await api("/auth/login", b);
        if (r.emailChallenge) {
          setMessage(r.message);
        } else {
          await api("/auth/session");
          router.push("/app");
        }
      }
      if (mode === "forgot") {
        const r = await api("/auth/forgot-password", b);
        setMessage(r.message);
      }
      if (mode === "reset") {
        await api("/auth/reset-password", { ...b, token: secret });
        router.push("/entrar?senha=alterada");
      }
      if (mode === "verify") {
        await api("/auth/verify", { token: secret });
        setMessage(
          "E-mail confirmado. Você já pode entrar e revisar a contratação.",
        );
        router.push("/app/assinatura");
      }
      if (mode === "admin") {
        await api("/auth/admin-confirm", { token: secret });
        router.push("/ews-admin");
      }
      if (mode === "invite") {
        await api("/auth/accept-invite", { ...b, token: secret });
        router.push("/app");
      }
      setError(false);
    } catch (e) {
      const a = e as ApiError;
      setError(true);
      setMessage(
        a.fields?.length
          ? a.fields.map((f) => `${f.field}: ${f.message}`).join(" ")
          : a.message,
      );
    } finally {
      setBusy(false);
    }
  }
  const selected = data?.plans.find((p: any) => p.id === plan);
  return (
    <AuthLayout>
      <Link className="auth-back" href="/">
        <ArrowLeft size={14} /> Voltar ao site
      </Link>
      <span className="eyebrow">
        {mode === "signup" ? "01 / CRIE SUA CONTA" : "EWS AFTERSALES"}
      </span>
      <h1>{titles[mode]}</h1>
      <p>
        {mode === "signup"
          ? "Cadastre a empresa e confira todos os valores antes de pagar."
          : mode === "verify"
            ? "Enviamos um link para o e-mail informado. Confira também a caixa de spam."
            : mode === "admin"
              ? "Use o link pessoal enviado após informar sua senha."
              : mode === "invite"
                ? "O convite confirma seu e-mail. Se já possui uma conta, informe sua senha atual."
                : "Sua operação de pós-venda começa por aqui."}
      </p>
      {mode === "signup" && (
        <div className="plan-choice">
          <div>
            <b>Plano {selected?.name ?? plan}</b>
            <small>
              {selected
                ? `${money(selected.monthly_cents)}/mês + ${money(selected.setup_cents)} de implantação`
                : "Carregando condições…"}
            </small>
          </div>
          <Link href="/precos" className="text-button">
            Trocar
          </Link>
        </div>
      )}
      <form onSubmit={submit} className="auth-form">
        <fieldset disabled={busy}>
          {(mode === "signup" || mode === "invite") && (
            <Field
              label="Seu nome"
              name="name"
              autoComplete="name"
              required
              maxLength={120}
            />
          )}
          {["signup", "login", "forgot"].includes(mode) && (
            <Field
              label="E-mail corporativo"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          )}
          {["signup", "login", "reset", "invite"].includes(mode) && (
            <Field
              label={mode === "reset" ? "Nova senha" : "Senha"}
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              minLength={mode === "login" ? 1 : 12}
              maxLength={128}
              required
              hint={
                mode !== "login" ? "Use pelo menos 12 caracteres." : undefined
              }
            />
          )}
          {mode === "signup" && (
            <>
              <Field
                label="Nome da empresa"
                name="company"
                autoComplete="organization"
                required
                maxLength={180}
              />
              <div className="form-row">
                <Field
                  label="CNPJ"
                  name="cnpj"
                  placeholder="00.000.000/0001-00"
                  required
                  maxLength={18}
                />
                <Field
                  label="Telefone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  required
                />
              </div>
              <label className="checkbox">
                <input type="checkbox" name="terms" required />
                <span>
                  Li os{" "}
                  <Link href="/legal/termos" target="_blank">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/legal/privacidade" target="_blank">
                    Política de Privacidade
                  </Link>
                  . Entendo que este ambiente é de testes e os textos aguardam
                  revisão jurídica.
                </span>
              </label>
            </>
          )}
          {mode === "login" && (
            <div style={{ textAlign: "right", marginBottom: 20 }}>
              <Link className="text-button" href="/esqueci-senha">
                Esqueci minha senha
              </Link>
            </div>
          )}
          {(mode !== "verify" && mode !== "admin") || secret ? (
            <Button pending={busy} type="submit">
              {mode === "signup"
                ? "Criar conta"
                : mode === "login"
                  ? "Entrar"
                  : mode === "forgot"
                    ? "Enviar instruções"
                    : mode === "reset"
                      ? "Salvar nova senha"
                      : mode === "invite"
                        ? "Aceitar convite"
                        : "Confirmar e continuar"}
              <ArrowRight size={17} />
            </Button>
          ) : (
            <div className="warning-label">
              <Mail size={19} style={{ marginBottom: 8 }} />
              Abra o link recebido no seu e-mail para continuar.
            </div>
          )}
        </fieldset>
      </form>
      {message && <Notice error={error}>{message}</Notice>}
      {mode === "verify" && (
        <button
          className="text-button"
          style={{ marginTop: 16 }}
          onClick={async () => {
            try {
              await api("/auth/session");
              const r = await api("/auth/resend-verification", {});
              setError(false);
              setMessage(r.message);
            } catch (e) {
              setError(true);
              setMessage((e as Error).message);
            }
          }}
        >
          Reenviar link de verificação
        </button>
      )}
      <div className="auth-switch">
        {mode === "signup" ? (
          <>
            Já tem uma conta? <Link href="/entrar">Entrar</Link>
          </>
        ) : (
          <>
            Ainda não tem conta? <Link href="/precos">Conhecer os planos</Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
