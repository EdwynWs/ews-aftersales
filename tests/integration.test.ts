import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../apps/api/src/app.ts";
import {
  checkout,
  reconcilePayment,
  processWebhook,
  deriveState,
  nextMonth,
  cancelSubscription,
  syncSubscription,
} from "../apps/api/src/billing.ts";
import { tx, one, type DBPool } from "../packages/db/index.ts";
import {
  hashPassword,
  verifyPassword,
  id,
  digest,
} from "../apps/api/src/security.ts";
import { validCnpj } from "../packages/shared/validation.ts";
import { runJob } from "../apps/api/src/jobs.ts";
import { Asaas, safeInvoiceUrl } from "../apps/api/src/asaas.ts";
import { testDatabase, testConfig, FakeGateway } from "./helpers.ts";
let db: DBPool, app: Awaited<ReturnType<typeof buildApp>>, gateway: FakeGateway;
type User = {
  cookie: string;
  csrf: string;
  org: string;
  user: string;
  email: string;
};
let a: User, b: User, ews: User;
const headers = (u?: User) => ({
  origin: testConfig.origin,
  ...(u ? { cookie: u.cookie, "x-csrf-token": u.csrf } : {}),
});
const request = async (method: any, url: string, body?: any, u?: User) =>
  app.inject({
    method,
    url,
    headers: headers(u),
    ...(body === undefined ? {} : { payload: body }),
  });
async function signup(name: string, cnpj: string): Promise<User> {
  const r = await request("POST", "/auth/signup", {
    name,
    email: name + "@example.test",
    password: "Very-strong-test-password!123",
    company: name + " Máquinas",
    cnpj,
    phone: "11999999999",
    plan: "growth",
    terms: true,
  });
  assert.equal(r.statusCode, 201, r.body);
  const cookie = r.cookies.find((c) => c.name === "ews_session")!;
  const value = "ews_session=" + cookie.value;
  const s = (
    await app.inject({
      method: "GET",
      url: "/auth/session",
      headers: { cookie: value },
    })
  ).json();
  return {
    cookie: value,
    csrf: s.csrf,
    org: s.orgId,
    user: s.user.id,
    email: s.user.email,
  };
}
async function mailToken(email: string, kind: string) {
  const row = await tx(db, { system: true }, (c) =>
    one(
      c,
      "SELECT payload FROM jobs WHERE kind='email' AND payload->>'to'=$1 AND dedupe_key LIKE $2 ORDER BY available_at DESC LIMIT 1",
      [email, kind + ":%"],
    ),
  );
  return row.payload.text.match(/token=([\w-]+)/)[1];
}
async function state(org: string) {
  return tx(db, { system: true }, (c) =>
    one(c, "SELECT state FROM subscriptions WHERE org_id=$1", [org]),
  );
}
before(async () => {
  ({ db } = await testDatabase());
  app = await buildApp(db, testConfig, { test: true });
  gateway = new FakeGateway();
});
after(async () => {
  await app.close();
  await db.end();
});
test("scrypt is salted, rejects wrong passwords; numeric and alphanumeric CNPJ checks", async () => {
  const h = await hashPassword("Something-long!123");
  assert.notEqual(h, await hashPassword("Something-long!123"));
  assert.equal(await verifyPassword("Something-long!123", h), true);
  assert.equal(await verifyPassword("wrong", h), false);
  assert.equal(validCnpj("11.222.333/0001-81"), true);
  assert.equal(validCnpj("11.444.777/0001-61"), true);
  assert.equal(validCnpj("00.000.000/0000-00"), false);
});
test("registration persists contract snapshots and opaque HttpOnly cookie; no email token in response", async () => {
  a = await signup("alpha", "11222333000181");
  b = await signup("beta", "11444777000161");
  const s = await tx(db, { system: true }, (c) =>
    one(c, "SELECT * FROM subscriptions WHERE org_id=$1", [a.org]),
  );
  assert.equal(s.plan_snapshot.monthly_cents, 99000);
  assert.equal(s.state, "awaiting_payment");
  const r = await request("POST", "/auth/login", {
    email: a.email,
    password: "Very-strong-test-password!123",
  });
  assert.match(r.headers["set-cookie"] as string, /HttpOnly/);
  assert.match(r.headers["set-cookie"] as string, /SameSite=Lax/);
  assert.equal(r.json().token, undefined);
});
test("unverified email cannot initiate checkout; verification is single-use", async () => {
  assert.equal(
    (
      await request(
        "POST",
        "/me/checkout",
        { billingType: "PIX", accepted: true },
        a,
      )
    ).statusCode,
    403,
  );
  const token = await mailToken(a.email, "verify");
  assert.equal(
    (await request("POST", "/auth/verify", { token })).statusCode,
    200,
  );
  assert.equal(
    (await request("POST", "/auth/verify", { token })).statusCode,
    400,
  );
  assert.equal(
    (
      await request("POST", "/auth/verify", {
        token: await mailToken(b.email, "verify"),
      })
    ).statusCode,
    200,
  );
});
test("origin, CSRF and EWS privilege escalation are rejected", async () => {
  const origin = await app.inject({
    method: "POST",
    url: "/auth/login",
    headers: { origin: "https://evil.invalid" },
    payload: { email: a.email, password: "Very-strong-test-password!123" },
  });
  assert.equal(origin.statusCode, 403);
  const csrf = await app.inject({
    method: "POST",
    url: "/me/checkout",
    headers: { origin: testConfig.origin, cookie: a.cookie },
    payload: { billingType: "PIX", accepted: true },
  });
  assert.equal(csrf.statusCode, 403);
  assert.equal(
    (await request("GET", "/ews/overview", undefined, a)).statusCode,
    403,
  );
  assert.equal(
    (await request("POST", "/auth/organization", { orgId: b.org }, a))
      .statusCode,
    403,
  );
});
test("RLS hides tenant B from A even without API filters, denies writes and audit edits", async () => {
  await tx(db, { org: a.org }, async (c) => {
    assert.equal(
      (await c.query("SELECT * FROM organizations WHERE id=$1", [b.org])).rows
        .length,
      0,
    );
    assert.equal(
      (
        await c.query("UPDATE organizations SET name='Hacked' WHERE id=$1", [
          b.org,
        ])
      ).rowCount,
      0,
    );
    assert.equal((await c.query("SELECT * FROM subscriptions")).rows.length, 1);
  });
  await assert.rejects(
    tx(db, { org: a.org }, (c) =>
      c.query("UPDATE audit_logs SET action='tampered'"),
    ),
  );
});
test("pending subscription cannot change onboarding, body tenant injection rejected", async () => {
  const brand = {
    brandName: "Alpha",
    brandColor: "#2163e8",
    supportEmail: a.email,
    supportPhone: "11999999999",
    hours: "Segunda a sexta",
  };
  assert.equal(
    (await request("PUT", "/me/organization", brand, a)).statusCode,
    402,
  );
  assert.equal(
    (await request("PUT", "/me/plan", { plan: "start", orgId: b.org }, a))
      .statusCode,
    400,
  );
});
test("checkout reload is idempotent and records separate charges; GET return cannot activate", async () => {
  for (let i = 0; i < 3; i++)
    assert.equal(
      (
        await request(
          "POST",
          "/me/checkout",
          { billingType: "PIX", accepted: true },
          a,
        )
      ).statusCode,
      200,
    );
  const jobs = await tx(db, { system: true }, (c) =>
    one(c, "SELECT count(*)::int AS n FROM jobs WHERE kind='checkout'"),
  );
  assert.equal(jobs.n, 1);
  await checkout(db, gateway, a.org, testConfig);
  await checkout(db, gateway, a.org, testConfig);
  assert.equal(gateway.creates, 3);
  const bill = (await request("GET", "/me/billing", undefined, a)).json();
  assert.equal(bill.charges.length, 2);
  assert.equal(bill.subscription.state, "awaiting_payment");
  assert.equal((await request("POST", "/me/activate", {}, a)).statusCode, 404);
});
test("webhook invalid auth rejected; duplicates persist once and cannot activate from payload", async () => {
  const p = gateway.payments.find((p) => p.id.startsWith("setup"));
  const event = {
    id: "evt_duplicate",
    event: "PAYMENT_CONFIRMED",
    payment: { id: p.id, status: "CONFIRMED" },
  };
  assert.equal(
    (await request("POST", "/webhooks/asaas", event)).statusCode,
    401,
  );
  for (let i = 0; i < 3; i++) {
    const r = await app.inject({
      method: "POST",
      url: "/webhooks/asaas",
      headers: { "asaas-access-token": testConfig.webhookToken },
      payload: event,
    });
    assert.equal(r.statusCode, 200);
  }
  await processWebhook(db, gateway, event.id, testConfig);
  const n = await tx(db, { system: true }, (c) =>
    one(c, "SELECT count(*)::int AS n FROM webhook_events WHERE id=$1", [
      event.id,
    ]),
  );
  assert.equal(n.n, 1);
  assert.equal((await state(a.org)).state, "awaiting_payment");
});
test("partial payment stays locked; both obligations activate and enqueue welcome once", async () => {
  const setup = gateway.payments.find((p) => p.id.startsWith("setup"));
  setup.status = "RECEIVED";
  await reconcilePayment(db, gateway, setup.id, testConfig);
  assert.equal((await state(a.org)).state, "partially_paid");
  const monthly = gateway.payments.find((p) => p.subscription);
  monthly.status = "CONFIRMED";
  await reconcilePayment(db, gateway, monthly.id, testConfig);
  assert.equal((await state(a.org)).state, "active");
  await reconcilePayment(db, gateway, monthly.id, testConfig);
  assert.equal(
    (
      await tx(db, { system: true }, (c) =>
        one(
          c,
          "SELECT count(*)::int AS n FROM jobs WHERE dedupe_key LIKE 'welcome:%'",
        ),
      )
    ).n,
    1,
  );
});
test("refund revokes access and stale confirmed webhook does not undo current provider state", async () => {
  const p = gateway.payments.find((p) => p.subscription);
  p.status = "REFUNDED";
  await reconcilePayment(db, gateway, p.id, testConfig);
  assert.equal((await state(a.org)).state, "suspended");
  await app.inject({
    method: "POST",
    url: "/webhooks/asaas",
    headers: { "asaas-access-token": testConfig.webhookToken },
    payload: {
      id: "evt_stale",
      event: "PAYMENT_CONFIRMED",
      payment: { id: p.id, status: "CONFIRMED" },
    },
  });
  await processWebhook(db, gateway, "evt_stale", testConfig);
  assert.equal((await state(a.org)).state, "suspended");
  p.status = "RECEIVED";
  await reconcilePayment(db, gateway, p.id, testConfig);
  assert.equal((await state(a.org)).state, "active");
});
test("mismatched values/customers never count as paid; unsafe hosted URLs excluded", async () => {
  const p = gateway.payments.find((p) => p.subscription),
    original = p.value;
  p.value = 1;
  await assert.rejects(
    reconcilePayment(db, gateway, p.id, testConfig),
    /contrato/,
  );
  p.value = original;
  const customer = p.customer;
  p.customer = "other_customer";
  await assert.rejects(
    reconcilePayment(db, gateway, p.id, testConfig),
    /contrato/,
  );
  p.customer = customer;
  assert.equal(safeInvoiceUrl("https://evil.invalid/i/x"), null);
  assert.equal(safeInvoiceUrl("javascript:alert(1)"), null);
  assert.equal(
    safeInvoiceUrl("https://sandbox.asaas.com/i/x"),
    "https://sandbox.asaas.com/i/x",
  );
});
test("onboarding persists to the correct tenant and its completion requires saved identity", async () => {
  assert.equal(
    (await request("POST", "/me/onboarding/complete", {}, a)).statusCode,
    400,
  );
  const r = await request(
    "PUT",
    "/me/organization",
    {
      brandName: "Alpha Industrial",
      brandColor: "#2163e8",
      supportEmail: a.email,
      supportPhone: "11999999999",
      hours: "Segunda a sexta, 8h às 18h",
    },
    a,
  );
  assert.equal(r.statusCode, 200, r.body);
  assert.equal(
    (await request("POST", "/me/onboarding/complete", {}, a)).statusCode,
    200,
  );
  assert.equal(
    (await request("GET", "/me/organization", undefined, a)).json().brand_name,
    "Alpha Industrial",
  );
  assert.equal(
    (await request("GET", "/me/organization", undefined, b)).json().brand_name,
    "",
  );
});
test("lost provider response is recovered by externalReference without duplicate charge", async () => {
  await request(
    "POST",
    "/me/checkout",
    { billingType: "BOLETO", accepted: true },
    b,
  );
  gateway.loseSetupResponse = true;
  await assert.rejects(
    checkout(db, gateway, b.org, testConfig),
    /LOST_RESPONSE/,
  );
  const count = gateway.creates;
  await checkout(db, gateway, b.org, testConfig);
  assert.equal(gateway.creates, count);
  assert.equal(
    gateway.payments.filter((p) => p.externalReference === `ews:${b.org}:setup`)
      .length,
    1,
  );
});
test("uncertain command without provider record fails closed instead of creating again", async () => {
  await tx(db, { system: true }, (c) =>
    c.query(
      "UPDATE gateway_commands SET gateway_id=NULL,state='uncertain' WHERE org_id=$1 AND step='setup'",
      [b.org],
    ),
  );
  const index = gateway.payments.findIndex(
      (p) => p.externalReference === `ews:${b.org}:setup`,
    ),
    saved = gateway.payments.splice(index, 1)[0],
    count = gateway.creates;
  await assert.rejects(checkout(db, gateway, b.org, testConfig), /incerto/);
  assert.equal(gateway.creates, count);
  gateway.payments.push(saved);
  await checkout(db, gateway, b.org, testConfig);
});
test("contract snapshot survives catalog edits; locked checkout cannot change plan", async () => {
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE plans SET monthly_cents=109000 WHERE id='growth'"),
  );
  assert.equal(
    (await request("GET", "/me/billing", undefined, a)).json().subscription
      .plan_snapshot.monthly_cents,
    99000,
  );
  assert.equal(
    (await request("PUT", "/me/plan", { plan: "industry" }, a)).statusCode,
    409,
  );
});
test("invites reserve seats, validate plan limit and cannot cross tenants", async () => {
  await tx(db, { system: true }, (c) =>
    c.query(
      "UPDATE subscriptions SET plan_snapshot=jsonb_set(plan_snapshot,'{user_limit}','2') WHERE org_id=$1",
      [a.org],
    ),
  );
  assert.equal(
    (
      await request(
        "POST",
        "/me/team/invite",
        { email: "staff@example.test", role: "support" },
        a,
      )
    ).statusCode,
    200,
  );
  assert.equal(
    (
      await request(
        "POST",
        "/me/team/invite",
        { email: "extra@example.test", role: "support" },
        a,
      )
    ).statusCode,
    409,
  );
  const t = await mailToken("staff@example.test", "invite");
  const r = await request("POST", "/auth/accept-invite", {
    token: t,
    name: "Atendimento",
    password: "Very-long-staff-password!",
  });
  assert.equal(r.statusCode, 200, r.body);
  const cookie =
    "ews_session=" + r.cookies.find((c) => c.name === "ews_session")!.value;
  const info = (
    await app.inject({
      method: "GET",
      url: "/auth/session",
      headers: { cookie },
    })
  ).json();
  const staff = {
    cookie,
    csrf: info.csrf,
    org: info.orgId,
    user: info.user.id,
    email: info.user.email,
  };
  assert.equal(
    (await request("GET", "/me/billing", undefined, staff)).statusCode,
    403,
  );
  assert.equal(
    (await request("POST", "/auth/organization", { orgId: b.org }, staff))
      .statusCode,
    403,
  );
});
test("billing calendar handles month end, delinquency, missing initial invoice and cancellation", () => {
  assert.equal(nextMonth("2026-01-31"), "2026-02-28");
  const charges = [
    { kind: "setup", status: "RECEIVED", due_date: "2026-01-01" },
    { kind: "recurring", status: "RECEIVED", due_date: "2026-01-01" },
    { kind: "recurring", status: "OVERDUE", due_date: "2026-02-01" },
  ];
  assert.equal(deriveState({}, charges, 7, "2026-02-04"), "past_due");
  assert.equal(deriveState({}, charges, 7, "2026-02-12"), "suspended");
  assert.equal(
    deriveState({ cancel_at: "2026-02-03" }, charges, 7, "2026-02-04"),
    "cancelled",
  );
  assert.equal(
    deriveState(
      { checkout_started_at: "2026-01-20" },
      charges.slice(0, 2),
      7,
      "2026-01-25",
    ),
    "partially_paid",
  );
  assert.equal(
    deriveState(
      {},
      [
        { kind: "setup", status: "PENDING", due_date: "2026-01-01" },
        {
          kind: "recurring",
          status: "CREDIT_CARD_CAPTURE_REFUSED",
          due_date: "2026-01-01",
        },
      ],
      7,
      "2026-01-01",
    ),
    "awaiting_payment",
  );
});
test("cancel persists schedule, disables provider recurrence and preserves organization data", async () => {
  const r = await request(
    "POST",
    "/me/cancel",
    { confirmation: "CANCELAR", reason: "Fim do piloto de testes." },
    a,
  );
  assert.equal(r.statusCode, 200);
  await cancelSubscription(db, gateway, a.org, testConfig);
  assert.equal(gateway.subscriptions[0].deleted, true);
  assert.equal((await state(a.org)).state, "cancel_scheduled");
  assert.equal(
    (await request("GET", "/me/organization", undefined, a)).json().brand_name,
    "Alpha Industrial",
  );
});
test("admin requires email confirmation, regular user cannot call financial admin endpoints", async () => {
  const uid = id();
  await tx(db, { system: true }, async (c) => {
    await c.query(
      "INSERT INTO users(id,name,email,password_hash,verified_at,is_ews_admin) VALUES($1,$2,$3,$4,now(),true)",
      [
        uid,
        "EWS Admin",
        "admin@example.test",
        await hashPassword("Admin-test-password-long!"),
      ],
    );
  });
  const login = await request("POST", "/auth/login", {
    email: "admin@example.test",
    password: "Admin-test-password-long!",
  });
  assert.equal(login.json().emailChallenge, true);
  assert.equal(login.cookies.length, 0);
  const confirm = await request("POST", "/auth/admin-confirm", {
    token: await mailToken("admin@example.test", "admin_mfa"),
  });
  assert.equal(confirm.statusCode, 200);
  const cookie = "ews_session=" + confirm.cookies[0].value;
  const session = (
    await app.inject({
      method: "GET",
      url: "/auth/session",
      headers: { cookie },
    })
  ).json();
  ews = {
    cookie,
    csrf: session.csrf,
    user: uid,
    email: "admin@example.test",
    org: "",
  };
  assert.equal(
    (
      await app.inject({
        method: "GET",
        url: "/ews/overview",
        headers: { cookie },
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (await request("GET", "/ews/events", undefined, a)).statusCode,
    403,
  );
});
test("only EWS can retry an idle unfinished job with an audited reason", async () => {
  const jobId = id();
  await tx(db, { system: true }, (c) =>
    c.query(
      "INSERT INTO jobs(id,kind,payload,dedupe_key,attempts,error_code) VALUES($1,'email','{}'::jsonb,$2,8,'SMTP_TEMPORARY')",
      [jobId, "retry-test:" + jobId],
    ),
  );
  const reason = { reason: "SMTP configurado novamente e validado" };
  assert.equal(
    (await request("POST", `/ews/jobs/${jobId}/retry`, reason, a)).statusCode,
    403,
  );
  assert.equal(
    (
      await request(
        "POST",
        `/ews/jobs/${jobId}/retry`,
        { reason: "curto" },
        ews,
      )
    ).statusCode,
    400,
  );
  assert.equal(
    (await request("POST", `/ews/jobs/${jobId}/retry`, reason, ews)).statusCode,
    200,
  );
  const record = await tx(db, { system: true }, async (c) => ({
    job: await one(c, "SELECT attempts FROM jobs WHERE id=$1", [jobId]),
    audit: await one(
      c,
      "SELECT * FROM audit_logs WHERE action='admin.job_retried' AND detail->>'job'=$1",
      [jobId],
    ),
  }));
  assert.equal(record.job.attempts, 0);
  assert.equal(record.audit.detail.reason, reason.reason);
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE jobs SET locked_at=now() WHERE id=$1", [jobId]),
  );
  assert.equal(
    (await request("POST", `/ews/jobs/${jobId}/retry`, reason, ews)).statusCode,
    409,
  );
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE jobs SET completed_at=now(),locked_at=NULL WHERE id=$1", [
      jobId,
    ]),
  );
  assert.equal(
    (await request("POST", `/ews/jobs/${jobId}/retry`, reason, ews)).statusCode,
    409,
  );
});
test("password reset is one use and revokes every session", async () => {
  await request("POST", "/auth/forgot-password", { email: b.email });
  const token = await mailToken(b.email, "reset");
  assert.equal(
    (
      await request("POST", "/auth/reset-password", {
        token,
        password: "Another-strong-test-password!",
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (await request("GET", "/auth/session", undefined, b)).statusCode,
    401,
  );
  assert.equal(
    (
      await request("POST", "/auth/reset-password", {
        token,
        password: "Another-strong-test-password!",
      })
    ).statusCode,
    400,
  );
});
test("outbox retries failures durably, and successful mail removes secret payload", async () => {
  await tx(db, { system: true }, (c) =>
    c.query("UPDATE jobs SET completed_at=now() WHERE kind!='email'"),
  );
  await runJob(db, gateway, testConfig, async () => {
    throw new Error("SMTP unavailable");
  });
  const failed = await tx(db, { system: true }, (c) =>
    one(c, "SELECT * FROM jobs WHERE error_code='JOB_FAILED' LIMIT 1"),
  );
  assert.ok(failed);
  assert.equal(failed.attempts, 1);
  assert.equal(failed.completed_at, null);
  await runJob(db, gateway, testConfig, async () => {});
  const sent = await tx(db, { system: true }, (c) =>
    one(
      c,
      "SELECT * FROM jobs WHERE kind='email' AND completed_at IS NOT NULL LIMIT 1",
    ),
  );
  assert.deepEqual(sent.payload, {});
});
test("sandbox adapter refuses requests without credentials", async () => {
  await assert.rejects(new Asaas("").get("/customers"), /sandbox/);
});
test("periodic reconciliation recovers a missing setup webhook", async () => {
  const s = await tx(db, { system: true }, (c) =>
    one(c, "SELECT gateway_customer FROM subscriptions WHERE org_id=$1", [
      b.org,
    ]),
  );
  for (const p of gateway.payments.filter(
    (p) => p.customer === s.gateway_customer,
  ))
    p.status = "RECEIVED";
  await syncSubscription(db, gateway, b.org, testConfig);
  assert.equal((await state(b.org)).state, "active");
});
test("cancellation during checkout cannot leave an orphan recurring subscription", async () => {
  const c = await signup("gamma", "12345678000195");
  await request("POST", "/auth/verify", {
    token: await mailToken(c.email, "verify"),
  });
  await request(
    "POST",
    "/me/checkout",
    { billingType: "PIX", accepted: true },
    c,
  );
  const remote = gateway,
    original = remote.post.bind(remote);
  remote.post = async (path, body) => {
    const result = await original(path, body);
    if (path === "/subscriptions")
      await request(
        "POST",
        "/me/cancel",
        {
          confirmation: "CANCELAR",
          reason: "Cancelamento durante o checkout de teste.",
        },
        c,
      );
    return result;
  };
  await checkout(db, remote, c.org, testConfig);
  assert.equal(
    remote.subscriptions.find(
      (s) => s.externalReference === `ews:${c.org}:subscription`,
    ).deleted,
    true,
  );
  assert.equal(
    remote.payments.some((p) => p.externalReference === `ews:${c.org}:setup`),
    false,
  );
  assert.equal((await state(c.org)).state, "cancelled");
});
