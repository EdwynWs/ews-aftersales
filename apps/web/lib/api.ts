"use client";
let csrf = "";
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public fields?: { field: string; message: string }[],
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const verb = method ?? (body === undefined ? "GET" : "POST");
  if (
    verb !== "GET" &&
    !csrf &&
    !path.startsWith("/auth/") &&
    !path.startsWith("/public/")
  )
    await api("/auth/session");
  const r = await fetch("/api" + path, {
    method: verb,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "x-csrf-token": csrf } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = await r
    .json()
    .catch(() => ({
      message: "Serviço indisponível. Confira se a API está em execução.",
      code: "UNAVAILABLE",
    }));
  if (!r.ok)
    throw new ApiError(
      result.message ?? "Não foi possível concluir.",
      result.code,
      r.status,
      result.fields,
    );
  if (path === "/auth/session") csrf = result.csrf;
  if (path === "/auth/logout") csrf = "";
  return result;
}
export const money = (cents: number | string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(Number(cents) / 100);
export const date = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" })
    : "—";
export const states: Record<string, string> = {
  awaiting_payment: "Aguardando pagamento",
  partially_paid: "Pagamento parcial",
  active: "Ativa",
  past_due: "Em regularização",
  cancel_scheduled: "Cancelamento programado",
  cancelled: "Cancelada",
  suspended: "Suspensa",
  PENDING: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  RECEIVED: "Recebido",
  OVERDUE: "Vencido",
  REFUNDED: "Estornado",
  DELETED: "Cancelado",
};
