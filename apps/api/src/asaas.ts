import { Problem } from "./security.ts";
export type RemotePayment = {
  id: string;
  customer: string;
  subscription?: string;
  externalReference?: string;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  deleted?: boolean;
  paymentDate?: string;
  confirmedDate?: string;
  netValue?: number;
};
export interface Gateway {
  get<T = any>(path: string): Promise<T>;
  post<T = any>(path: string, body: Record<string, unknown>): Promise<T>;
  remove(path: string): Promise<void>;
}
export class Asaas implements Gateway {
  private readonly base = "https://api-sandbox.asaas.com/v3";
  constructor(private key: string) {}
  async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    if (!this.key)
      throw new Problem(
        503,
        "GATEWAY_NOT_CONFIGURED",
        "Configure o Asaas sandbox antes de iniciar cobranças.",
      );
    if (!path.startsWith("/") || path.startsWith("//"))
      throw new Error("Invalid gateway path");
    const r = await fetch(this.base + path, {
      method,
      headers: {
        access_token: this.key,
        "User-Agent": "EWS-AfterSales-Sandbox/0.1",
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok)
      throw new Problem(
        502,
        `ASAAS_HTTP_${r.status}`,
        "O provedor não concluiu a operação. A tentativa será conciliada antes de uma nova cobrança.",
      );
    return (await r.json()) as T;
  }
  get<T = any>(p: string) {
    return this.request<T>("GET", p);
  }
  post<T = any>(p: string, b: Record<string, unknown>) {
    return this.request<T>("POST", p, b);
  }
  async remove(p: string) {
    await this.request("DELETE", p);
  }
}
export function safeInvoiceUrl(value: string | undefined) {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === "https:" &&
      (u.hostname === "sandbox.asaas.com" ||
        u.hostname === "www.asaas.com" ||
        u.hostname === "asaas.com")
      ? u.href
      : null;
  } catch {
    return null;
  }
}
