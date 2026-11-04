import { z } from "zod";
export type Config = {
  origin: string;
  production: boolean;
  checkoutEnabled: boolean;
  legalVersion: string;
  asaasKey: string;
  webhookToken: string;
  graceDays: number;
  port: number;
};
export function config(): Config {
  const e = z
    .object({
      APP_ORIGIN: z.url().default("http://localhost:3000"),
      NODE_ENV: z.string().default("development"),
      CHECKOUT_ENABLED: z.enum(["true", "false"]).default("false"),
      LEGAL_VERSION: z.string().default("2026-10-draft"),
      ASAAS_API_KEY: z.string().default(""),
      ASAAS_WEBHOOK_TOKEN: z.string().default(""),
      GRACE_DAYS: z.coerce.number().int().min(0).max(30).default(7),
      PORT: z.coerce.number().default(4000),
    })
    .parse(process.env);
  if (e.NODE_ENV === "production")
    throw new Error(
      "Production launch is intentionally blocked in P0. Complete docs/RELEASE-GATES.md and obtain launch authorization before removing this gate.",
    );
  if (e.ASAAS_API_KEY && !e.ASAAS_API_KEY.startsWith("$aact_hmlg_"))
    throw new Error("Only Asaas sandbox keys are accepted.");
  if (
    e.CHECKOUT_ENABLED === "true" &&
    (!e.ASAAS_API_KEY || e.ASAAS_WEBHOOK_TOKEN.length < 32)
  )
    throw new Error(
      "Sandbox checkout requires API key and webhook token >=32 characters.",
    );
  return {
    origin: new URL(e.APP_ORIGIN).origin,
    production: false,
    checkoutEnabled: e.CHECKOUT_ENABLED === "true",
    legalVersion: e.LEGAL_VERSION,
    asaasKey: e.ASAAS_API_KEY,
    webhookToken: e.ASAAS_WEBHOOK_TOKEN,
    graceDays: e.GRACE_DAYS,
    port: e.PORT,
  };
}
