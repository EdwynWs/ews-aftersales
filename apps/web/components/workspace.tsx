"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  Building2,
  Users,
  LogOut,
  ShieldCheck,
  ChevronRight,
  Inbox,
  ListChecks,
  Activity,
} from "lucide-react";
import { Brand, Loading, Notice } from "./ui";
import { api } from "@/lib/api";
const SessionContext = createContext<any>(null);
export const useSession = () => useContext(SessionContext);
export function Workspace({
  children,
  ews = false,
}: {
  children: React.ReactNode;
  ews?: boolean;
}) {
  const [session, setSession] = useState<any>(null),
    [error, setError] = useState(""),
    path = usePathname(),
    router = useRouter();
  useEffect(() => {
    api("/auth/session")
      .then((s) => {
        if (ews && !s.user.ewsAdmin) {
          setError("Seu usuário não tem acesso ao painel EWS.");
          return;
        }
        if (!ews && s.user.ewsAdmin) {
          router.replace("/ews-admin");
          return;
        }
        if (!s.user.verified) {
          router.replace("/verificar-email");
          return;
        }
        setSession(s);
      })
      .catch(() => router.replace("/entrar"));
  }, [ews, router]);
  async function logout() {
    try {
      await api("/auth/logout", {});
      router.push("/entrar");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const links = ews
    ? [
        [LayoutDashboard, "Visão geral", "/ews-admin"],
        [Building2, "Assinantes", "/ews-admin/empresas"],
        [CreditCard, "Planos", "/ews-admin/planos"],
        [Inbox, "Solicitações", "/ews-admin/solicitacoes"],
        [Activity, "Eventos", "/ews-admin/eventos"],
      ]
    : [
        [LayoutDashboard, "Visão geral", "/app"],
        [ListChecks, "Primeiros passos", "/app/onboarding"],
        ...(session?.role === "admin"
          ? [
              [CreditCard, "Assinatura", "/app/assinatura"],
              [Users, "Equipe", "/app/equipe"],
              [Building2, "Configurações", "/app/configuracoes"],
            ]
          : []),
      ];
  if (error)
    return (
      <main id="main" className="error-screen">
        <div>
          <Notice error>{error}</Notice>
          <Link className="button" href="/app">
            Voltar
          </Link>
          <button className="text-button" onClick={logout}>
            Sair
          </button>
        </div>
      </main>
    );
  if (!session)
    return (
      <main id="main">
        <Loading />
      </main>
    );
  return (
    <SessionContext.Provider value={session}>
      <div className="workspace">
        <aside className="sidebar">
          <Brand light />
          <span className="sidebar-label">
            {ews ? "ADMINISTRAÇÃO EWS" : "SEU AMBIENTE"}
          </span>
          <nav>
            {links.map(([Icon, label, href]: any) => (
              <Link
                key={href}
                href={href}
                className={path === href ? "active" : ""}
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>
          <div className="mobile-workspace-nav">
            <select
              aria-label="Navegar no painel"
              value={path}
              onChange={(e) => router.push(e.target.value)}
            >
              {links.map(([, label, href]: any) => (
                <option key={href} value={href}>
                  {label}
                </option>
              ))}
              <option value="/entrar">Tela de login</option>
            </select>
            <button
              className="text-button"
              style={{ color: "white", marginTop: 10 }}
              onClick={logout}
            >
              Sair
            </button>
          </div>
          <div className="sidebar-bottom">
            <span className="user-name">{session.user.name}</span>
            <span className="user-email">{session.user.email}</span>
            <button className="text-button" onClick={logout}>
              <LogOut size={14} /> Sair da conta
            </button>
          </div>
        </aside>
        <div className="workspace-body">
          <div className="workspace-topbar">
            <span>
              <ShieldCheck size={15} />
              {ews ? "EWS Tech" : "Área da indústria"}
              <ChevronRight size={12} />{" "}
              {(links.find((l) => l[2] === path)?.[1] as string) ?? "Detalhes"}
            </span>
            <span className="sandbox-tag">SANDBOX · SEM COBRANÇAS REAIS</span>
          </div>
          <main id="main" className="workspace-content">
            {children}
          </main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
