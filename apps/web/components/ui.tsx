"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Layers3,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { api, ApiError } from "@/lib/api";
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`brand ${light ? "light" : ""}`}
      aria-label="EWS AfterSales, início"
    >
      <span className="brand-icon">
        <Layers3 size={22} />
      </span>
      <span>
        <b>AfterSales</b>
        <small>by EWS TECH</small>
      </span>
    </Link>
  );
}
export function Button({
  children,
  pending = false,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean }) {
  return (
    <button
      {...props}
      disabled={pending || props.disabled}
      className={`button ${props.className ?? ""}`}
    >
      {pending ? <LoaderCircle size={17} className="spin" /> : null}
      {children}
    </button>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
      <span>{children}</span>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={22} /> Carregando dados…
    </div>
  );
}
export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function useData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  async function reload() {
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, [path]);
  return { data, error, loading, reload };
}
export function ActionForm({
  children,
  onSubmit,
  success = "Alterações salvas.",
  className = "",
}: {
  children: ReactNode;
  onSubmit: (values: Record<string, any>) => Promise<unknown>;
  success?: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onSubmit(values);
      setError(false);
      setMessage(success);
    } catch (e) {
      setError(true);
      const a = e as ApiError;
      setMessage(
        a.fields?.length ? a.fields.map((f) => f.message).join(" ") : a.message,
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={`form ${className}`}>
      <fieldset disabled={busy}>
        {children}
        <Button type="submit" pending={busy}>
          Salvar e continuar <ArrowRight size={17} />
        </Button>
      </fieldset>
      {message && <Notice error={error}>{message}</Notice>}
    </form>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-heading">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function External({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="button secondary"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={16} />
    </a>
  );
}
