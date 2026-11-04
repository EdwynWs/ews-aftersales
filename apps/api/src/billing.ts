import {
  tx,
  one,
  type DBPool,
  type DBClient,
} from "../../../packages/db/index.ts";
import { id, enqueue, audit, Problem, requireThat } from "./security.ts";
import { safeInvoiceUrl, type Gateway, type RemotePayment } from "./asaas.ts";
import type { Config } from "./config.ts";
const paid = new Set(["CONFIRMED", "RECEIVED"]);
const reversed = new Set([
  "REFUNDED",
  "REFUND_REQUESTED",
  "REFUND_IN_PROGRESS",
  "CHARGEBACK_REQUESTED",
  "CHARGEBACK_DISPUTE",
  "AWAITING_CHARGEBACK_REVERSAL",
]);
const iso = (d: Date) => d.toISOString().slice(0, 10);
export function nextMonth(value: string) {
  const d = new Date(value + "T12:00:00Z");
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return iso(d);
}
export function deriveState(
  s: any,
  charges: any[],
  grace: number,
  today = iso(new Date()),
) {
  if (s.cancel_at && String(s.cancel_at).slice(0, 10) <= today)
    return "cancelled";
  if (s.admin_suspended) return "suspended";
  if (charges.some((c) => reversed.has(c.status))) return "suspended";
  const setup = charges.find((c) => c.kind === "setup");
  const recurring = charges
    .filter((c) => c.kind === "recurring")
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const initialDue = s.checkout_started_at
    ? iso(new Date(new Date(s.checkout_started_at).getTime() + 3 * 86400000))
    : recurring[0]?.due_date;
  if (
    !setup ||
    !paid.has(setup.status) ||
    !recurring[0] ||
    recurring[0].due_date !== initialDue ||
    !paid.has(recurring[0].status)
  )
    return charges.some((c) => paid.has(c.status))
      ? "partially_paid"
      : "awaiting_payment";
  const overdue = recurring.filter(
    (c) => c.due_date < today && !paid.has(c.status),
  );
  if (overdue.length) {
    const age =
      (Date.parse(today) - Date.parse(overdue[0].due_date)) / 86400000;
    return age > grace ? "suspended" : "past_due";
  }
  const lastPaid = recurring.filter((c) => paid.has(c.status)).at(-1);
  const until = nextMonth(lastPaid.due_date);
  if (until <= today)
    return (Date.parse(today) - Date.parse(until)) / 86400000 > grace
      ? "suspended"
      : "past_due";
  return s.cancel_at ? "cancel_scheduled" : "active";
}
export async function refreshSubscription(
  c: DBClient,
  org: string,
  cfg: Config,
) {
  const s = await one(
    c,
    "SELECT s.*,o.admin_suspended FROM subscriptions s JOIN organizations o ON o.id=s.org_id WHERE s.org_id=$1 FOR UPDATE OF s",
    [org],
  );
  if (!s) return;
  const charges = (
    await c.query(
      "SELECT id,kind,status,to_char(due_date,'YYYY-MM-DD') as due_date FROM charges WHERE org_id=$1 ORDER BY charges.due_date",
      [org],
    )
  ).rows;
  const state = deriveState(
    { ...s, cancel_at: s.cancel_at ? iso(new Date(s.cancel_at)) : null },
    charges,
    cfg.graceDays,
  );
  const last = charges
    .filter((c) => c.kind === "recurring" && paid.has(c.status))
    .at(-1);
  await c.query(
    "UPDATE subscriptions SET state=$2,paid_until=$3,activated_at=CASE WHEN $2 IN ('active','cancel_scheduled') THEN coalesce(activated_at,now()) ELSE activated_at END WHERE org_id=$1",
    [org, state, last ? nextMonth(last.due_date) : null],
  );
  if (state !== s.state)
    await audit(c, org, null, "subscription.state_changed", {
      from: s.state,
      to: state,
    });
  if (!s.activated_at && state === "active") {
    const u = await one(
      c,
      "SELECT u.email FROM users u JOIN memberships m ON m.user_id=u.id WHERE m.org_id=$1 AND m.role='admin' ORDER BY u.created_at LIMIT 1",
      [org],
    );
    await enqueue(c, "email", `welcome:${s.id}`, {
      to: u.email,
      subject: "Seu ambiente está ativo",
      text: `Bem-vindo ao EWS AfterSales! Configure sua empresa em ${cfg.origin}/app/onboarding`,
    });
  }
}
// A command is committed BEFORE any remote create. Ambiguous requests are reconciled, never blindly retried.
async function createOnce(
  db: DBPool,
  gateway: Gateway,
  org: string,
  step: string,
  path: string,
  body: Record<string, unknown>,
) {
  const cmd = await tx(db, { system: true }, async (c) => {
    await c.query(
      "INSERT INTO gateway_commands(id,org_id,step,external_reference) VALUES($1,$2,$3,$4) ON CONFLICT(org_id,step) DO NOTHING",
      [id(), org, step, `ews:${org}:${step}`],
    );
    const row = await one(
      c,
      "SELECT * FROM gateway_commands WHERE org_id=$1 AND step=$2 FOR UPDATE",
      [org, step],
    );
    if (row.state === "new") {
      await c.query(
        "UPDATE gateway_commands SET state='uncertain',updated_at=now() WHERE id=$1",
        [row.id],
      );
      return { ...row, fresh: true };
    }
    return row;
  });
  if (cmd.gateway_id)
    return gateway.get(`${path}/${encodeURIComponent(cmd.gateway_id)}`);
  const result = await gateway.get<{ data: any[]; hasMore?: boolean }>(
    `${path}?externalReference=${encodeURIComponent(cmd.external_reference)}&limit=100`,
  );
  const matches = result.data.filter(
    (v) => v.externalReference === cmd.external_reference,
  );
  if (matches.length > 1 || result.hasMore)
    throw new Problem(
      409,
      "DUPLICATE_PROVIDER_RECORD",
      "Mais de um registro encontrado. Conciliação manual necessária.",
    );
  let record = matches[0];
  if (!record) {
    requireThat(
      cmd.fresh,
      409,
      "REVIEW_REQUIRED",
      "Uma tentativa anterior teve resultado incerto. A EWS precisa conferir o provedor antes de tentar criar outra cobrança.",
    );
    record = await gateway.post(path, {
      ...body,
      externalReference: cmd.external_reference,
    });
  }
  requireThat(
    record.id && record.externalReference === cmd.external_reference,
    502,
    "REFERENCE_MISMATCH",
    "Referência do provedor divergente.",
  );
  if (body.customer)
    requireThat(
      record.customer === body.customer,
      502,
      "CUSTOMER_MISMATCH",
      "Cliente do provedor divergente.",
    );
  if (body.value !== undefined)
    requireThat(
      Math.round(record.value * 100) === Math.round(Number(body.value) * 100),
      502,
      "VALUE_MISMATCH",
      "Valor do provedor divergente.",
    );
  await tx(db, { system: true }, (c) =>
    c.query(
      "UPDATE gateway_commands SET state='done',gateway_id=$2,updated_at=now() WHERE id=$1",
      [cmd.id, record.id],
    ),
  );
  return record;
}
export async function checkout(
  db: DBPool,
  gateway: Gateway,
  org: string,
  cfg: Config,
) {
  const row = await tx(db, { system: true }, (c) =>
    one(
      c,
      "SELECT s.*,o.name,o.cnpj,o.phone,u.email FROM subscriptions s JOIN organizations o ON o.id=s.org_id JOIN memberships m ON m.org_id=o.id AND m.role='admin' JOIN users u ON u.id=m.user_id WHERE o.id=$1 ORDER BY u.created_at LIMIT 1",
      [org],
    ),
  );
  requireThat(
    row && row.checkout_started_at && !row.cancel_at,
    409,
    "INVALID_CHECKOUT",
    "Contratação indisponível.",
  );
  const customer = await createOnce(
    db,
    gateway,
    org,
    "customer",
    "/customers",
    {
      name: row.name,
      cpfCnpj: row.cnpj,
      email: row.email,
      phone: row.phone.replace(/\D/g, ""),
      notificationDisabled: true,
    },
  );
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE subscriptions SET gateway_customer=$2 WHERE org_id=$1", [
      org,
      customer.id,
    ]),
  );
  // Immutable due date from persisted checkout start, also used after a crash.
  const due = iso(
    new Date(new Date(row.checkout_started_at).getTime() + 3 * 86400000),
  );
  const sub = await createOnce(
    db,
    gateway,
    org,
    "subscription",
    "/subscriptions",
    {
      customer: customer.id,
      billingType: row.billing_type,
      value: row.plan_snapshot.monthly_cents / 100,
      nextDueDate: due,
      cycle: "MONTHLY",
      description: `EWS AfterSales — ${row.plan_snapshot.name}`,
    },
  );
  await tx(db, { system: true }, (c) =>
    c.query(
      "UPDATE subscriptions SET gateway_subscription=$2 WHERE org_id=$1",
      [org, sub.id],
    ),
  );
  const cancellation = await tx(db, { system: true }, (c) =>
    one(c, "SELECT cancel_at FROM subscriptions WHERE org_id=$1", [org]),
  );
  if (cancellation.cancel_at) {
    await cancelSubscription(db, gateway, org, cfg);
    return;
  }
  const setup = await createOnce(db, gateway, org, "setup", "/payments", {
    customer: customer.id,
    billingType: row.billing_type,
    value: row.plan_snapshot.setup_cents / 100,
    dueDate: due,
    description: "EWS AfterSales — implantação única",
  });
  await reconcilePayment(db, gateway, setup.id, cfg);
  await syncSubscription(db, gateway, org, cfg);
  const finalState = await tx(db, { system: true }, (c) =>
    one(c, "SELECT cancel_at FROM subscriptions WHERE org_id=$1", [org]),
  );
  if (finalState.cancel_at) await cancelSubscription(db, gateway, org, cfg);
}
export async function reconcilePayment(
  db: DBPool,
  gateway: Gateway,
  paymentId: string,
  cfg: Config,
) {
  // Read current provider state; webhook status is only a notification and may be stale.
  await tx(db, { system: true }, async (c) => {
    await c.query("SELECT pg_advisory_xact_lock(hashtext($1))", [paymentId]);
    const p = await gateway.get<RemotePayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
    );
    requireThat(
      p.id === paymentId,
      502,
      "PAYMENT_ID_MISMATCH",
      "Cobrança divergente.",
    );
    const s = await one(
      c,
      "SELECT s.* FROM subscriptions s LEFT JOIN gateway_commands g ON g.org_id=s.org_id AND g.step='setup' WHERE (s.gateway_subscription=$1 AND $1 IS NOT NULL) OR (g.external_reference=$2 AND $2 IS NOT NULL) FOR UPDATE OF s",
      [p.subscription ?? null, p.externalReference ?? null],
    );
    if (!s) return; // Account may contain unrelated invoices. Never attach by customer alone.
    const kind =
      p.subscription === s.gateway_subscription ? "recurring" : "setup";
    const expected =
      kind === "setup"
        ? s.plan_snapshot.setup_cents
        : s.plan_snapshot.monthly_cents;
    requireThat(
      p.customer === s.gateway_customer &&
        Math.round(p.value * 100) === expected,
      409,
      "PAYMENT_MISMATCH",
      "Cliente ou valor não correspondem ao contrato.",
    );
    requireThat(
      /^\d{4}-\d{2}-\d{2}$/.test(p.dueDate),
      502,
      "INVALID_DUE_DATE",
      "Vencimento inválido.",
    );
    await c.query(
      `INSERT INTO charges(id,org_id,subscription_id,gateway_id,kind,amount_cents,status,due_date,invoice_url,confirmed_at)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,CASE WHEN $10 THEN now() ELSE NULL END)
   ON CONFLICT(gateway_id) DO UPDATE SET status=EXCLUDED.status,invoice_url=EXCLUDED.invoice_url,reconciled_at=now(),confirmed_at=CASE WHEN $10 THEN coalesce(charges.confirmed_at,now()) ELSE NULL END`,
      [
        id(),
        s.org_id,
        s.id,
        p.id,
        kind,
        expected,
        p.deleted ? "DELETED" : p.status,
        p.dueDate,
        safeInvoiceUrl(p.invoiceUrl),
        paid.has(p.status) && !p.deleted,
      ],
    );
    await refreshSubscription(c, s.org_id, cfg);
  });
}
export async function syncSubscription(
  db: DBPool,
  gateway: Gateway,
  org: string,
  cfg: Config,
) {
  const s = await tx(db, { system: true }, (c) =>
    one(c, "SELECT * FROM subscriptions WHERE org_id=$1", [org]),
  );
  if (!s?.gateway_subscription) return;
  const setup = await tx(db, { system: true }, (c) =>
    one(
      c,
      "SELECT gateway_id FROM gateway_commands WHERE org_id=$1 AND step='setup'",
      [org],
    ),
  );
  if (setup?.gateway_id)
    await reconcilePayment(db, gateway, setup.gateway_id, cfg);
  let offset = 0;
  do {
    const result = await gateway.get<{
      data: RemotePayment[];
      hasMore: boolean;
    }>(
      `/subscriptions/${encodeURIComponent(s.gateway_subscription)}/payments?limit=100&offset=${offset}`,
    );
    for (const p of result.data) await reconcilePayment(db, gateway, p.id, cfg);
    if (!result.hasMore) break;
    offset += 100;
    if (offset > 10000)
      throw new Problem(
        502,
        "PAGINATION_LIMIT",
        "Conciliação extensa requer revisão.",
      );
  } while (true);
  await tx(db, { system: true }, (c) => refreshSubscription(c, org, cfg));
}
export async function processWebhook(
  db: DBPool,
  gateway: Gateway,
  eventId: string,
  cfg: Config,
) {
  const e = await tx(db, { system: true }, (c) =>
    one(c, "SELECT * FROM webhook_events WHERE id=$1", [eventId]),
  );
  if (!e || e.processed_at) return;
  if (e.resource_kind === "payment" && e.resource_id)
    await reconcilePayment(db, gateway, e.resource_id, cfg);
  if (e.resource_kind === "subscription" && e.resource_id) {
    const remote = await gateway.get(
      `/subscriptions/${encodeURIComponent(e.resource_id)}`,
    );
    const s = await tx(db, { system: true }, (c) =>
      one(c, "SELECT * FROM subscriptions WHERE gateway_subscription=$1", [
        e.resource_id,
      ]),
    );
    if (s) {
      if (
        remote.deleted ||
        remote.status === "INACTIVE" ||
        remote.status === "EXPIRED"
      )
        await tx(db, { system: true }, async (c) => {
          await c.query(
            "UPDATE subscriptions SET cancel_at=coalesce(cancel_at,paid_until,current_date) WHERE org_id=$1",
            [s.org_id],
          );
          await refreshSubscription(c, s.org_id, cfg);
        });
      else await syncSubscription(db, gateway, s.org_id, cfg);
    }
  }
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE webhook_events SET processed_at=now() WHERE id=$1", [
      eventId,
    ]),
  );
}
export async function cancelSubscription(
  db: DBPool,
  gateway: Gateway,
  org: string,
  cfg: Config,
) {
  const s = await tx(db, { system: true }, (c) =>
    one(c, "SELECT * FROM subscriptions WHERE org_id=$1", [org]),
  );
  if (s?.gateway_subscription) {
    const remote = await gateway.get(
      `/subscriptions/${encodeURIComponent(s.gateway_subscription)}`,
    );
    if (!remote.deleted)
      await gateway.remove(
        `/subscriptions/${encodeURIComponent(s.gateway_subscription)}`,
      );
  }
  const setup = await tx(db, { system: true }, (c) =>
    one(
      c,
      "SELECT gateway_id FROM gateway_commands WHERE org_id=$1 AND step='setup'",
      [org],
    ),
  );
  if (setup?.gateway_id) {
    const p = await gateway.get<RemotePayment>(
      `/payments/${encodeURIComponent(setup.gateway_id)}`,
    );
    if (["PENDING", "OVERDUE"].includes(p.status) && !p.deleted)
      await gateway.remove(`/payments/${encodeURIComponent(p.id)}`);
    await reconcilePayment(db, gateway, setup.gateway_id, cfg);
  }
  await tx(db, { system: true }, async (c) => {
    await c.query(
      "UPDATE subscriptions SET cancel_at=coalesce(cancel_at,paid_until,current_date) WHERE org_id=$1",
      [org],
    );
    await refreshSubscription(c, org, cfg);
    await audit(c, org, null, "subscription.gateway_cancelled");
  });
}
