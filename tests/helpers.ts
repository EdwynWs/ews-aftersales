import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { pool, type DBPool, type DBClient } from "../packages/db/index.ts";
import type { Config } from "../apps/api/src/config.ts";
import type { Gateway } from "../apps/api/src/asaas.ts";
export const testConfig: Config = {
  origin: "http://localhost:3000",
  production: false,
  checkoutEnabled: true,
  legalVersion: "test-draft",
  asaasKey: "test-double-only",
  webhookToken: "test-only-webhook-token-32-characters-long",
  graceDays: 7,
  port: 4000,
};
// PostgreSQL compiled to WASM. Production uses node-postgres and PostgreSQL 16.
// Serialize connection leases because this test engine exposes one connection.
export async function testDatabase(path?: string) {
  if (process.env.TEST_DATABASE_URL) {
    const target = new URL(process.env.TEST_DATABASE_URL);
    if (!/^\/ews_aftersales_test_[a-f0-9]+$/.test(target.pathname))
      throw new Error(
        "Use scripts/test-postgres.mjs to create an isolated disposable database.",
      );
    const migration = pool(process.env.TEST_MIGRATION_DATABASE_URL ?? "");
    const c = await migration.connect();
    try {
      for (const file of (
        await readdir(new URL("../packages/db/migrations/", import.meta.url))
      )
        .filter((f) => f.endsWith(".sql"))
        .sort())
        await c.query(
          await readFile(
            new URL("../packages/db/migrations/" + file, import.meta.url),
            "utf8",
          ),
        );
    } finally {
      c.release();
      await migration.end();
    }
    return { db: pool(process.env.TEST_DATABASE_URL), engine: null };
  }
  const engine = new PGlite(path);
  await engine.waitReady;
  const exists = await engine.query(
    "SELECT 1 FROM pg_tables WHERE tablename='plans'",
  );
  if (!exists.rows.length) {
    await engine.exec("CREATE ROLE ews_app NOSUPERUSER NOBYPASSRLS;");
    for (const file of (
      await readdir(new URL("../packages/db/migrations/", import.meta.url))
    )
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await engine.exec(
        await readFile(
          new URL("../packages/db/migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
  }
  await engine.exec("SET ROLE ews_app");
  let tail = Promise.resolve();
  const db: DBPool = {
    async connect() {
      let release!: () => void;
      const next = new Promise<void>((r) => (release = r));
      const previous = tail;
      tail = next;
      await previous;
      const c: DBClient = {
        async query(sql, values) {
          const r = await engine.query<any>(sql, values);
          return { rows: r.rows, rowCount: r.affectedRows ?? r.rows.length };
        },
        release,
      };
      return c;
    },
    async end() {
      await tail;
      await engine.close();
    },
  };
  return { db, engine };
}
export class FakeGateway implements Gateway {
  customers: any[] = [];
  subscriptions: any[] = [];
  payments: any[] = [];
  creates = 0;
  loseSetupResponse = false;
  async get<T = any>(path: string): Promise<T> {
    const u = new URL("https://test.invalid" + path),
      segments = u.pathname.split("/").filter(Boolean);
    const list =
      segments[0] === "customers"
        ? this.customers
        : segments[0] === "subscriptions"
          ? this.subscriptions
          : this.payments;
    let value: any;
    if (segments.length === 3 && segments[2] === "payments")
      value = {
        data: this.payments.filter((p) => p.subscription === segments[1]),
        hasMore: false,
      };
    else if (segments.length === 2) {
      value = list.find((v) => v.id === segments[1]);
      if (!value) throw new Error("REMOTE_NOT_FOUND");
    } else
      value = {
        data: list.filter(
          (v) =>
            v.externalReference === u.searchParams.get("externalReference"),
        ),
        hasMore: false,
      };
    return structuredClone(value) as T;
  }
  async post<T = any>(path: string, body: Record<string, unknown>): Promise<T> {
    this.creates++;
    let value: any;
    if (path === "/customers") {
      value = { ...body, id: "cus_" + this.customers.length };
      this.customers.push(value);
    }
    if (path === "/subscriptions") {
      value = {
        ...body,
        id: "sub_" + this.subscriptions.length,
        status: "ACTIVE",
      };
      this.subscriptions.push(value);
      this.payments.push({
        id: "monthly_" + this.payments.length,
        customer: body.customer,
        subscription: value.id,
        value: body.value,
        dueDate: body.nextDueDate,
        status: "PENDING",
        invoiceUrl: "https://sandbox.asaas.com/i/monthly",
      });
    }
    if (path === "/payments") {
      value = {
        ...body,
        id: "setup_" + this.payments.length,
        status: "PENDING",
        invoiceUrl: "https://sandbox.asaas.com/i/setup",
      };
      this.payments.push(value);
      if (this.loseSetupResponse) {
        this.loseSetupResponse = false;
        throw new Error("SIMULATED_LOST_RESPONSE");
      }
    }
    return structuredClone(value) as T;
  }
  async remove(path: string) {
    const list = path.startsWith("/payments/")
      ? this.payments
      : this.subscriptions;
    const item = list.find((s) => path.endsWith("/" + s.id));
    if (item) item.deleted = true;
  }
}
