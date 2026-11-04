import Fastify, { type FastifyRequest, type FastifyReply } from "fastify";
import cookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import {
  tx,
  one,
  type DBPool,
  type DBClient,
} from "../../../packages/db/index.ts";
import {
  signupSchema,
  email,
  password,
  brandSchema,
  roleSchema,
} from "../../../packages/shared/validation.ts";
import {
  audit,
  digest,
  enqueue,
  equal,
  hashPassword,
  id,
  Problem,
  requireThat,
  token,
  verifyPassword,
} from "./security.ts";
import { refreshSubscription } from "./billing.ts";
import type { Config } from "./config.ts";
type Actor = {
  user_id: string;
  org_id: string | null;
  csrf: string;
  verified_at: string | null;
  is_ews_admin: boolean;
  role: string;
  name: string;
  email: string;
};
const paramsId = (r: FastifyRequest) =>
  z.object({ id: z.uuid() }).parse(r.params).id;
const listQuery = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  q: z.string().max(100).default(""),
});
export async function buildApp(
  db: DBPool,
  cfg: Config,
  opts: { logger?: boolean; test?: boolean } = {},
) {
  const app = Fastify({
    logger: opts.logger
      ? {
          redact: [
            "req.headers.cookie",
            "req.headers.authorization",
            "req.headers.asaas-access-token",
          ],
          serializers: {
            req: (req: any) => ({
              method: req.method,
              url: req.url?.split("?")[0],
              id: req.id,
            }),
          },
        }
      : false,
    bodyLimit: 65536,
    trustProxy: false,
  });
  await app.register(cookie);
  await app.register(helmet);
  await app.register(rateLimit, {
    max: opts.test ? 10000 : 120,
    timeWindow: "1 minute",
  });
  app.setErrorHandler((error: any, _req, reply) => {
    if (error instanceof z.ZodError)
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Confira os campos informados.",
        fields: error.issues.map((i: any) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
    if (error.code === "23505")
      return reply.status(409).send({
        code: "CONFLICT",
        message:
          "Este cadastro já existe. Confira os dados ou entre na sua conta.",
      });
    const status = error.statusCode ?? 500;
    if (status >= 500)
      app.log.error(
        { code: error.code ?? "INTERNAL", requestId: _req.id },
        "Request failed",
      );
    return reply.status(status).send({
      code: error.code ?? "INTERNAL",
      message:
        status >= 500
          ? "Não foi possível concluir. Tente novamente ou contate o suporte."
          : error.message,
    });
  });
  app.addHook("onRequest", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.url.split("?")[0] !== "/webhooks/asaas"
    )
      requireThat(
        req.headers.origin === cfg.origin,
        403,
        "ORIGIN_DENIED",
        "Origem não autorizada.",
      );
  });
  async function actor(req: FastifyRequest, verified = true): Promise<Actor> {
    const raw = req.cookies.ews_session;
    requireThat(raw, 401, "UNAUTHENTICATED", "Entre na sua conta.");
    const a = await tx(db, { system: true }, (c) =>
      one(
        c,
        `SELECT s.*,u.verified_at,u.is_ews_admin,u.name,u.email,m.role FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN memberships m ON m.user_id=s.user_id AND m.org_id=s.org_id WHERE s.token_hash=$1 AND s.expires_at>now()`,
        [digest(raw)],
      ),
    );
    requireThat(
      a,
      401,
      "SESSION_EXPIRED",
      "Sua sessão expirou. Entre novamente.",
    );
    if (verified)
      requireThat(
        a.verified_at,
        403,
        "EMAIL_UNVERIFIED",
        "Verifique seu e-mail antes de continuar.",
      );
    if (!["GET", "HEAD"].includes(req.method))
      requireThat(
        typeof req.headers["x-csrf-token"] === "string" &&
          equal(req.headers["x-csrf-token"], a.csrf),
        403,
        "CSRF_DENIED",
        "Atualize a página e tente novamente.",
      );
    return a;
  }
  async function tenant(req: FastifyRequest, admin = false, active = false) {
    const a = await actor(req);
    requireThat(
      a.org_id && a.role,
      403,
      "NO_ORGANIZATION",
      "Selecione uma empresa autorizada.",
    );
    if (admin)
      requireThat(
        a.role === "admin",
        403,
        "FORBIDDEN",
        "Apenas administradores podem executar esta ação.",
      );
    if (active) {
      await tx(db, { org: a.org_id }, async (c) => {
        await refreshSubscription(c, a.org_id!, cfg);
        const s = await one(
          c,
          "SELECT state FROM subscriptions WHERE org_id=$1",
          [a.org_id],
        );
        requireThat(
          ["active", "cancel_scheduled", "past_due"].includes(s?.state),
          402,
          "SUBSCRIPTION_REQUIRED",
          "Regularize sua assinatura para continuar.",
        );
      });
    }
    return a as Actor & { org_id: string };
  }
  async function admin(req: FastifyRequest) {
    const a = await actor(req);
    requireThat(a.is_ews_admin, 403, "EWS_ONLY", "Área exclusiva da EWS.");
    return a;
  }
  async function session(
    c: DBClient,
    user: string,
    org: string | null,
    reply: FastifyReply,
  ) {
    const raw = token(),
      csrf = token();
    await c.query(
      "INSERT INTO sessions(token_hash,user_id,org_id,csrf,expires_at) VALUES($1,$2,$3,$4,now()+interval '12 hours')",
      [digest(raw), user, org, csrf],
    );
    reply.setCookie("ews_session", raw, {
      httpOnly: true,
      secure: cfg.production,
      sameSite: "lax",
      path: "/",
      maxAge: 43200,
    });
    return csrf;
  }
  async function sendToken(
    c: DBClient,
    user: any,
    kind: "verify" | "reset" | "admin_mfa",
  ) {
    const raw = token();
    await c.query(
      "UPDATE auth_tokens SET used_at=now() WHERE user_id=$1 AND kind=$2 AND used_at IS NULL",
      [user.id, kind],
    );
    await c.query(
      "INSERT INTO auth_tokens(token_hash,user_id,kind,expires_at) VALUES($1,$2,$3,now()+($4::text||' minutes')::interval)",
      [digest(raw), user.id, kind, kind === "verify" ? 1440 : 15],
    );
    const route =
      kind === "verify"
        ? "verificar-email"
        : kind === "reset"
          ? "redefinir-senha"
          : "acesso-ews";
    await enqueue(c, "email", `${kind}:${id()}`, {
      to: user.email,
      subject:
        kind === "verify"
          ? "Confirme seu e-mail — EWS AfterSales"
          : kind === "reset"
            ? "Redefinição de senha — EWS AfterSales"
            : "Confirme seu acesso administrativo",
      text: `Abra ${cfg.origin}/${route}#token=${raw}\nEste link é pessoal e tem validade limitada. Se você não solicitou, ignore esta mensagem.`,
    });
  }
  const authRate = {
    rateLimit: { max: opts.test ? 1000 : 10, timeWindow: "15 minutes" },
  };
  app.get("/health", async () => ({
    status: "ok",
    phase: "P0",
    environment: "sandbox",
  }));
  app.get("/ready", async () => {
    await tx(db, {}, (c) => c.query("SELECT 1"));
    return { status: "ready" };
  });
  app.get("/public/plans", async () => ({
    plans: await tx(
      db,
      {},
      async (c) =>
        (
          await c.query(
            "SELECT * FROM plans WHERE active ORDER BY monthly_cents",
          )
        ).rows,
    ),
    checkoutEnabled: cfg.checkoutEnabled,
    environment: "sandbox",
    legalVersion: cfg.legalVersion,
  }));
  app.post("/public/contact", { config: authRate }, async (req, reply) => {
    const b = z
      .object({
        name: z.string().min(2).max(120),
        email,
        company: z.string().min(2).max(180),
        message: z.string().min(10).max(2000),
        consent: z.literal(true),
      })
      .strict()
      .parse(req.body);
    const lead = id();
    await tx(db, { system: true }, (c) =>
      c.query(
        "INSERT INTO commercial_leads(id,name,email,company,message) VALUES($1,$2,$3,$4,$5)",
        [lead, b.name, b.email, b.company, b.message],
      ),
    );
    return reply
      .code(201)
      .send({ id: lead, message: "Solicitação registrada para a equipe EWS." });
  });
  app.post("/auth/signup", { config: authRate }, async (req, reply) => {
    const b = signupSchema.parse(req.body);
    const hash = await hashPassword(b.password);
    return tx(db, { system: true }, async (c) => {
      const plan = await one(c, "SELECT * FROM plans WHERE id=$1 AND active", [
        b.plan,
      ]);
      requireThat(plan, 400, "PLAN_UNAVAILABLE", "Plano indisponível.");
      const uid = id(),
        org = id();
      await c.query(
        "INSERT INTO users(id,name,email,password_hash) VALUES($1,$2,$3,$4)",
        [uid, b.name, b.email, hash],
      );
      await c.query(
        "INSERT INTO organizations(id,name,cnpj,phone) VALUES($1,$2,$3,$4)",
        [org, b.company, b.cnpj, b.phone],
      );
      await c.query("INSERT INTO memberships VALUES($1,$2,'admin')", [
        org,
        uid,
      ]);
      await c.query(
        "INSERT INTO subscriptions(id,org_id,plan_id,plan_snapshot,terms_version) VALUES($1,$2,$3,$4,$5)",
        [id(), org, b.plan, JSON.stringify(plan), cfg.legalVersion],
      );
      await sendToken(c, { id: uid, email: b.email }, "verify");
      await session(c, uid, org, reply);
      await audit(c, org, uid, "organization.registered", {
        plan: b.plan,
        terms: cfg.legalVersion,
      });
      reply.code(201);
      return { message: "Conta criada. Verifique seu e-mail para continuar." };
    });
  });
  const dummyHash = await hashPassword(token());
  app.post("/auth/login", { config: authRate }, async (req, reply) => {
    const b = z
      .object({ email, password: z.string().max(128) })
      .strict()
      .parse(req.body);
    const u = await tx(db, { system: true }, (c) =>
      one(c, "SELECT * FROM users WHERE email=$1", [b.email]),
    );
    requireThat(
      (await verifyPassword(b.password, u?.password_hash ?? dummyHash)) && u,
      401,
      "INVALID_CREDENTIALS",
      "E-mail ou senha incorretos.",
    );
    return tx(db, { system: true }, async (c) => {
      if (u.is_ews_admin) {
        await sendToken(c, u, "admin_mfa");
        return {
          emailChallenge: true,
          message: "Confirme o acesso pelo link enviado ao seu e-mail.",
        };
      }
      const m = await one(
        c,
        "SELECT org_id FROM memberships WHERE user_id=$1 ORDER BY org_id LIMIT 1",
        [u.id],
      );
      await session(c, u.id, m?.org_id ?? null, reply);
      await audit(c, m?.org_id ?? null, u.id, "auth.login");
      return { ok: true };
    });
  });
  app.get("/auth/session", async (req) => {
    const a = await actor(req, false);
    return {
      user: {
        id: a.user_id,
        name: a.name,
        email: a.email,
        verified: !!a.verified_at,
        ewsAdmin: a.is_ews_admin,
      },
      orgId: a.org_id,
      role: a.role,
      csrf: a.csrf,
    };
  });
  app.post("/auth/logout", async (req, reply) => {
    await actor(req, false);
    await tx(db, {}, (c) =>
      c.query("DELETE FROM sessions WHERE token_hash=$1", [
        digest(req.cookies.ews_session!),
      ]),
    );
    reply.clearCookie("ews_session", { path: "/" });
    return { ok: true };
  });
  app.post("/auth/verify", { config: authRate }, async (req) => {
    const b = z
      .object({ token: z.string().min(30).max(100) })
      .strict()
      .parse(req.body);
    return tx(db, { system: true }, async (c) => {
      const t = await one(
        c,
        "SELECT * FROM auth_tokens WHERE token_hash=$1 AND kind='verify' AND used_at IS NULL AND expires_at>now() FOR UPDATE",
        [digest(b.token)],
      );
      requireThat(t, 400, "TOKEN_INVALID", "Link inválido, usado ou expirado.");
      await c.query("UPDATE users SET verified_at=now() WHERE id=$1", [
        t.user_id,
      ]);
      await c.query(
        "UPDATE auth_tokens SET used_at=now() WHERE token_hash=$1",
        [digest(b.token)],
      );
      return { ok: true };
    });
  });
  app.post("/auth/admin-confirm", { config: authRate }, async (req, reply) => {
    const b = z
      .object({ token: z.string().min(30).max(100) })
      .strict()
      .parse(req.body);
    return tx(db, { system: true }, async (c) => {
      const t = await one(
        c,
        "SELECT t.* FROM auth_tokens t JOIN users u ON u.id=t.user_id WHERE t.token_hash=$1 AND t.kind='admin_mfa' AND t.used_at IS NULL AND t.expires_at>now() AND u.is_ews_admin FOR UPDATE OF t",
        [digest(b.token)],
      );
      requireThat(
        t,
        400,
        "TOKEN_INVALID",
        "Link de acesso inválido ou expirado.",
      );
      await c.query(
        "UPDATE auth_tokens SET used_at=now() WHERE token_hash=$1",
        [digest(b.token)],
      );
      await session(c, t.user_id, null, reply);
      await audit(c, null, t.user_id, "admin.login_verified");
      return { ok: true };
    });
  });
  app.post("/auth/resend-verification", { config: authRate }, async (req) => {
    const a = await actor(req, false);
    if (!a.verified_at)
      await tx(db, { system: true }, (c) =>
        sendToken(c, { id: a.user_id, email: a.email }, "verify"),
      );
    return { message: "Se necessário, um novo link foi enviado." };
  });
  app.post("/auth/forgot-password", { config: authRate }, async (req) => {
    const b = z.object({ email }).strict().parse(req.body);
    await tx(db, { system: true }, async (c) => {
      const u = await one(c, "SELECT * FROM users WHERE email=$1", [b.email]);
      if (u) await sendToken(c, u, "reset");
    });
    return { message: "Se houver uma conta, enviaremos as instruções." };
  });
  app.post("/auth/reset-password", { config: authRate }, async (req) => {
    const b = z
      .object({ token: z.string().min(30).max(100), password })
      .strict()
      .parse(req.body);
    const hash = await hashPassword(b.password);
    return tx(db, { system: true }, async (c) => {
      const t = await one(
        c,
        "SELECT * FROM auth_tokens WHERE token_hash=$1 AND kind='reset' AND used_at IS NULL AND expires_at>now() FOR UPDATE",
        [digest(b.token)],
      );
      requireThat(t, 400, "TOKEN_INVALID", "Link inválido, usado ou expirado.");
      await c.query("UPDATE users SET password_hash=$2 WHERE id=$1", [
        t.user_id,
        hash,
      ]);
      await c.query("UPDATE auth_tokens SET used_at=now() WHERE user_id=$1", [
        t.user_id,
      ]);
      await c.query("DELETE FROM sessions WHERE user_id=$1", [t.user_id]);
      await audit(c, null, t.user_id, "auth.password_reset");
      return { ok: true };
    });
  });
  app.get("/auth/organizations", async (req) => {
    const a = await actor(req);
    return tx(
      db,
      { system: true },
      async (c) =>
        (
          await c.query(
            "SELECT o.id,o.name,m.role FROM memberships m JOIN organizations o ON o.id=m.org_id WHERE m.user_id=$1",
            [a.user_id],
          )
        ).rows,
    );
  });
  app.post("/auth/organization", async (req) => {
    const a = await actor(req);
    const b = z.object({ orgId: z.uuid() }).strict().parse(req.body);
    await tx(db, { system: true }, async (c) => {
      requireThat(
        await one(
          c,
          "SELECT 1 FROM memberships WHERE user_id=$1 AND org_id=$2",
          [a.user_id, b.orgId],
        ),
        403,
        "FORBIDDEN",
        "Empresa não autorizada.",
      );
      await c.query("UPDATE sessions SET org_id=$2 WHERE token_hash=$1", [
        digest(req.cookies.ews_session!),
        b.orgId,
      ]);
    });
    return { ok: true };
  });
  app.get("/me/billing", async (req) => {
    const a = await tenant(req, true);
    return tx(db, { org: a.org_id }, async (c) => {
      await refreshSubscription(c, a.org_id, cfg);
      return {
        subscription: await one(
          c,
          "SELECT id,plan_id,plan_snapshot,state,checkout_started_at,billing_type,paid_until,cancel_at,terms_version FROM subscriptions WHERE org_id=$1",
          [a.org_id],
        ),
        charges: (
          await c.query(
            "SELECT id,kind,amount_cents,status,due_date,invoice_url FROM charges WHERE org_id=$1 ORDER BY due_date,kind",
            [a.org_id],
          )
        ).rows,
        commands: (
          await c.query(
            "SELECT step,state FROM gateway_commands WHERE org_id=$1",
            [a.org_id],
          )
        ).rows,
        checkoutEnabled: cfg.checkoutEnabled,
        graceDays: cfg.graceDays,
      };
    });
  });
  app.put("/me/plan", async (req) => {
    const a = await tenant(req, true);
    const b = z
      .object({ plan: z.enum(["start", "growth", "industry"]) })
      .strict()
      .parse(req.body);
    return tx(db, { org: a.org_id }, async (c) => {
      const s = await one(
        c,
        "SELECT * FROM subscriptions WHERE org_id=$1 FOR UPDATE",
        [a.org_id],
      );
      requireThat(
        !s.checkout_started_at,
        409,
        "CHECKOUT_STARTED",
        "Após iniciar a cobrança, solicite a mudança à EWS.",
      );
      const p = await one(c, "SELECT * FROM plans WHERE id=$1 AND active", [
        b.plan,
      ]);
      requireThat(p, 400, "PLAN_UNAVAILABLE", "Plano indisponível.");
      await c.query(
        "UPDATE subscriptions SET plan_id=$2,plan_snapshot=$3 WHERE org_id=$1",
        [a.org_id, b.plan, JSON.stringify(p)],
      );
      await audit(c, a.org_id, a.user_id, "subscription.plan_selected", {
        plan: b.plan,
      });
      return { ok: true };
    });
  });
  app.post("/me/checkout", async (req) => {
    const a = await tenant(req, true);
    const b = z
      .object({
        billingType: z.enum(["PIX", "BOLETO"]),
        accepted: z.literal(true),
      })
      .strict()
      .parse(req.body);
    requireThat(
      cfg.checkoutEnabled,
      503,
      "CHECKOUT_DISABLED",
      "O checkout sandbox ainda não foi habilitado. Nenhuma cobrança foi criada.",
    );
    return tx(db, { org: a.org_id }, async (c) => {
      const s = await one(
        c,
        "SELECT * FROM subscriptions WHERE org_id=$1 FOR UPDATE",
        [a.org_id],
      );
      requireThat(
        !s.cancel_at,
        409,
        "CANCELLED",
        "Contratação cancelada. Entre em contato com a EWS.",
      );
      if (!s.checkout_started_at) {
        await c.query(
          "UPDATE subscriptions SET checkout_started_at=now(),billing_type=$2 WHERE org_id=$1",
          [a.org_id, b.billingType],
        );
        await audit(c, a.org_id, a.user_id, "checkout.authorized", {
          billingType: b.billingType,
          monthly: s.plan_snapshot.monthly_cents,
          setup: s.plan_snapshot.setup_cents,
        });
      }
      await enqueue(c, "checkout", `checkout:${s.id}`, { org: a.org_id });
      return {
        ok: true,
        message:
          "Contratação registrada. Aguarde a criação das duas cobranças.",
      };
    });
  });
  app.post("/me/reconcile", async (req) => {
    const a = await tenant(req, true);
    await tx(db, { org: a.org_id }, (c) =>
      enqueue(c, "sync", `sync:${a.org_id}:${Math.floor(Date.now() / 60000)}`, {
        org: a.org_id,
      }),
    );
    return { ok: true };
  });
  app.post("/me/cancel", async (req) => {
    const a = await tenant(req, true);
    const b = z
      .object({
        confirmation: z.literal("CANCELAR"),
        reason: z.string().min(5).max(1000),
      })
      .strict()
      .parse(req.body);
    await tx(db, { org: a.org_id }, async (c) => {
      const s = await one(
        c,
        "SELECT * FROM subscriptions WHERE org_id=$1 FOR UPDATE",
        [a.org_id],
      );
      requireThat(
        s.checkout_started_at,
        409,
        "NO_SUBSCRIPTION",
        "Não existe contratação iniciada.",
      );
      await c.query(
        "UPDATE subscriptions SET cancel_at=coalesce(cancel_at,paid_until,current_date) WHERE org_id=$1",
        [a.org_id],
      );
      await enqueue(c, "cancel", `cancel:${s.id}`, { org: a.org_id });
      await refreshSubscription(c, a.org_id, cfg);
      await audit(c, a.org_id, a.user_id, "subscription.cancel_requested", {
        reason: b.reason,
      });
    });
    return {
      ok: true,
      message:
        "Cancelamento registrado. A confirmação no provedor será processada; seus dados serão preservados.",
    };
  });
  app.get("/me/organization", async (req) => {
    const a = await tenant(req);
    return tx(db, { org: a.org_id }, (c) =>
      one(
        c,
        "SELECT id,name,brand_name,brand_color,support_email,support_phone,hours,onboarding_step FROM organizations WHERE id=$1",
        [a.org_id],
      ),
    );
  });
  app.put("/me/organization", async (req) => {
    const a = await tenant(req, true, true),
      b = brandSchema.parse(req.body);
    await tx(db, { org: a.org_id }, async (c) => {
      await c.query(
        "UPDATE organizations SET brand_name=$2,brand_color=$3,support_email=$4,support_phone=$5,hours=$6,onboarding_step=greatest(onboarding_step,1) WHERE id=$1",
        [
          a.org_id,
          b.brandName,
          b.brandColor,
          b.supportEmail,
          b.supportPhone,
          b.hours,
        ],
      );
      await audit(c, a.org_id, a.user_id, "organization.brand_updated");
    });
    return { ok: true };
  });
  app.post("/me/onboarding/complete", async (req) => {
    const a = await tenant(req, true, true);
    await tx(db, { org: a.org_id }, async (c) => {
      const o = await one(
        c,
        "SELECT onboarding_step FROM organizations WHERE id=$1 FOR UPDATE",
        [a.org_id],
      );
      requireThat(
        o.onboarding_step >= 1,
        400,
        "ONBOARDING_INCOMPLETE",
        "Preencha a identidade e os canais de atendimento.",
      );
      await c.query("UPDATE organizations SET onboarding_step=2 WHERE id=$1", [
        a.org_id,
      ]);
      await audit(c, a.org_id, a.user_id, "onboarding.foundation_completed");
    });
    return { ok: true };
  });
  app.get("/me/team", async (req) => {
    const a = await tenant(req, true);
    return tx(db, { org: a.org_id }, async (c) => ({
      members: (
        await c.query(
          "SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=$1",
          [a.org_id],
        )
      ).rows,
      invitations: (
        await c.query(
          "SELECT id,email,role,expires_at FROM invitations WHERE org_id=$1 AND accepted_at IS NULL AND expires_at>now()",
          [a.org_id],
        )
      ).rows,
    }));
  });
  app.post("/me/team/invite", async (req) => {
    const a = await tenant(req, true, true),
      b = z.object({ email, role: roleSchema }).strict().parse(req.body);
    await tx(db, { org: a.org_id }, async (c) => {
      const s = await one(
        c,
        "SELECT * FROM subscriptions WHERE org_id=$1 FOR UPDATE",
        [a.org_id],
      );
      const used = await one(
        c,
        "SELECT (SELECT count(*) FROM memberships WHERE org_id=$1)+(SELECT count(*) FROM invitations WHERE org_id=$1 AND accepted_at IS NULL AND expires_at>now()) as total",
        [a.org_id],
      );
      requireThat(
        Number(used.total) < s.plan_snapshot.user_limit,
        409,
        "USER_LIMIT",
        "Limite de usuários atingido. Solicite um upgrade.",
      );
      requireThat(
        !(await one(
          c,
          "SELECT 1 FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=$1 AND u.email=$2",
          [a.org_id, b.email],
        )),
        409,
        "ALREADY_MEMBER",
        "Essa pessoa já pertence à equipe.",
      );
      const raw = token(),
        inviteId = id();
      await c.query(
        "INSERT INTO invitations(id,org_id,email,role,token_hash,expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '7 days') ON CONFLICT(org_id,email) DO UPDATE SET token_hash=EXCLUDED.token_hash,role=EXCLUDED.role,expires_at=EXCLUDED.expires_at,accepted_at=NULL",
        [inviteId, a.org_id, b.email, b.role, digest(raw)],
      );
      await enqueue(c, "email", `invite:${id()}`, {
        to: b.email,
        subject: "Convite para a equipe — EWS AfterSales",
        text: `Acesse ${cfg.origin}/convite#token=${raw}. O link expira em 7 dias.`,
      });
      await audit(c, a.org_id, a.user_id, "team.invited", { role: b.role });
    });
    return { ok: true };
  });
  app.post("/auth/accept-invite", { config: authRate }, async (req, reply) => {
    const b = z
      .object({
        token: z.string().min(30).max(100),
        name: z.string().min(2).max(120),
        password,
      })
      .strict()
      .parse(req.body);
    const hash = await hashPassword(b.password);
    return tx(db, { system: true }, async (c) => {
      const inv = await one(
        c,
        "SELECT * FROM invitations WHERE token_hash=$1 AND accepted_at IS NULL AND expires_at>now() FOR UPDATE",
        [digest(b.token)],
      );
      requireThat(inv, 400, "TOKEN_INVALID", "Convite inválido ou expirado.");
      const s = await one(
        c,
        "SELECT * FROM subscriptions WHERE org_id=$1 FOR UPDATE",
        [inv.org_id],
      );
      await refreshSubscription(c, inv.org_id, cfg);
      const fresh = await one(
        c,
        "SELECT state FROM subscriptions WHERE org_id=$1",
        [inv.org_id],
      );
      requireThat(
        ["active", "past_due", "cancel_scheduled"].includes(fresh.state),
        402,
        "SUBSCRIPTION_REQUIRED",
        "A empresa precisa regularizar a assinatura.",
      );
      const count = await one(
        c,
        "SELECT count(*)::int AS n FROM memberships WHERE org_id=$1",
        [inv.org_id],
      );
      requireThat(
        count.n < s.plan_snapshot.user_limit,
        409,
        "USER_LIMIT",
        "Limite de usuários atingido.",
      );
      let u = await one(c, "SELECT * FROM users WHERE email=$1", [inv.email]);
      if (u) {
        requireThat(
          !u.is_ews_admin &&
            (await verifyPassword(b.password, u.password_hash)),
          401,
          "EXISTING_ACCOUNT",
          "Use a senha da sua conta existente.",
        );
        await c.query(
          "UPDATE users SET verified_at=coalesce(verified_at,now()) WHERE id=$1",
          [u.id],
        );
      } else {
        u = { id: id() };
        await c.query(
          "INSERT INTO users(id,name,email,password_hash,verified_at) VALUES($1,$2,$3,$4,now())",
          [u.id, b.name, inv.email, hash],
        );
      }
      await c.query(
        "INSERT INTO memberships VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
        [inv.org_id, u.id, inv.role],
      );
      await c.query("UPDATE invitations SET accepted_at=now() WHERE id=$1", [
        inv.id,
      ]);
      await session(c, u.id, inv.org_id, reply);
      await audit(c, inv.org_id, u.id, "team.joined");
      return { ok: true };
    });
  });
  app.delete("/me/team/:id", async (req) => {
    const a = await tenant(req, true, true),
      target = paramsId(req);
    requireThat(
      target !== a.user_id,
      400,
      "SELF_REMOVE",
      "Você não pode remover seu próprio acesso.",
    );
    await tx(db, { org: a.org_id }, async (c) => {
      await c.query("SELECT id FROM subscriptions WHERE org_id=$1 FOR UPDATE", [
        a.org_id,
      ]);
      const result = await c.query(
        "DELETE FROM memberships WHERE org_id=$1 AND user_id=$2",
        [a.org_id, target],
      );
      requireThat(result.rowCount, 404, "NOT_FOUND", "Usuário não encontrado.");
      await c.query("DELETE FROM sessions WHERE org_id=$1 AND user_id=$2", [
        a.org_id,
        target,
      ]);
      await audit(c, a.org_id, a.user_id, "team.removed", { user: target });
    });
    return { ok: true };
  });
  app.post("/me/requests", async (req) => {
    const a = await tenant(req, true),
      b = z
        .object({
          kind: z.enum(["upgrade", "support", "privacy"]),
          message: z.string().min(10).max(2000),
        })
        .strict()
        .parse(req.body);
    const requestId = id();
    await tx(db, { org: a.org_id }, (c) =>
      c.query(
        "INSERT INTO service_requests(id,org_id,user_id,kind,message) VALUES($1,$2,$3,$4,$5)",
        [requestId, a.org_id, a.user_id, b.kind, b.message],
      ),
    );
    return { id: requestId };
  });
  app.get("/me/audit", async (req) => {
    const a = await tenant(req, true),
      q = listQuery.parse(req.query);
    return tx(
      db,
      { org: a.org_id },
      async (c) =>
        (
          await c.query(
            "SELECT action,detail,created_at FROM audit_logs WHERE org_id=$1 ORDER BY created_at DESC LIMIT 30 OFFSET $2",
            [a.org_id, (q.page - 1) * 30],
          )
        ).rows,
    );
  });
  app.post("/webhooks/asaas", async (req, reply) => {
    requireThat(
      cfg.webhookToken.length >= 32 &&
        typeof req.headers["asaas-access-token"] === "string" &&
        equal(req.headers["asaas-access-token"], cfg.webhookToken),
      401,
      "INVALID_WEBHOOK",
      "Webhook não autorizado.",
    );
    const b = z
      .object({
        id: z.string().min(1).max(200),
        event: z.string().min(1).max(100),
        payment: z.object({ id: z.string().min(1).max(100) }).optional(),
        subscription: z.object({ id: z.string().min(1).max(100) }).optional(),
      })
      .parse(req.body);
    const kind = b.payment
        ? "payment"
        : b.subscription
          ? "subscription"
          : "other",
      resource = b.payment?.id ?? b.subscription?.id ?? null;
    await tx(db, { system: true }, async (c) => {
      await c.query(
        "INSERT INTO webhook_events(id,event,resource_id,resource_kind,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING",
        [b.id, b.event, resource, kind, JSON.stringify(b)],
      );
      await enqueue(c, "webhook", `webhook:${b.id}`, { eventId: b.id });
    });
    return reply.code(200).send({ received: true });
  });
  app.get("/ews/overview", async (req) => {
    await admin(req);
    return tx(db, { system: true }, async (c) => ({
      stats: await one(
        c,
        `SELECT count(*)::int AS organizations,count(*) FILTER(WHERE state='active')::int AS active,count(*) FILTER(WHERE state='awaiting_payment')::int AS pending,count(*) FILTER(WHERE state IN ('past_due','suspended'))::int AS overdue,coalesce(sum((plan_snapshot->>'monthly_cents')::bigint) FILTER(WHERE state IN ('active','cancel_scheduled')),0)::text AS mrr FROM subscriptions`,
      ),
      receipts: await one(
        c,
        "SELECT coalesce(sum(amount_cents) FILTER(WHERE kind='setup' AND status='RECEIVED'),0)::text AS setup,coalesce(sum(amount_cents) FILTER(WHERE kind='recurring' AND status='RECEIVED'),0)::text AS recurring FROM charges",
      ),
      queue: (
        await c.query(
          "SELECT kind,error_code,count(*)::int AS total FROM jobs WHERE completed_at IS NULL GROUP BY kind,error_code",
        )
      ).rows,
    }));
  });
  app.get("/ews/organizations", async (req) => {
    await admin(req);
    const q = listQuery.parse(req.query);
    return tx(
      db,
      { system: true },
      async (c) =>
        (
          await c.query(
            "SELECT o.id,o.name,o.cnpj,o.created_at,o.admin_suspended,s.plan_id,s.state,s.paid_until,s.plan_snapshot FROM organizations o JOIN subscriptions s ON s.org_id=o.id WHERE o.name ILIKE $1 ORDER BY o.created_at DESC LIMIT 30 OFFSET $2",
            [`%${q.q}%`, (q.page - 1) * 30],
          )
        ).rows,
    );
  });
  app.get("/ews/organizations/:id", async (req) => {
    await admin(req);
    const org = paramsId(req);
    return tx(db, { system: true }, async (c) => {
      const o = await one(
        c,
        "SELECT o.*,s.plan_snapshot,s.state,s.plan_id FROM organizations o JOIN subscriptions s ON s.org_id=o.id WHERE o.id=$1",
        [org],
      );
      requireThat(o, 404, "NOT_FOUND", "Empresa não encontrada.");
      return {
        organization: o,
        charges: (
          await c.query(
            "SELECT kind,amount_cents,status,due_date FROM charges WHERE org_id=$1 ORDER BY due_date DESC LIMIT 100",
            [org],
          )
        ).rows,
        audit: (
          await c.query(
            "SELECT action,detail,created_at FROM audit_logs WHERE org_id=$1 ORDER BY created_at DESC LIMIT 50",
            [org],
          )
        ).rows,
      };
    });
  });
  app.post("/ews/organizations/:id/suspension", async (req) => {
    const a = await admin(req),
      org = paramsId(req),
      b = z
        .object({
          suspended: z.boolean(),
          reason: z.string().min(10).max(1000),
        })
        .strict()
        .parse(req.body);
    await tx(db, { system: true }, async (c) => {
      const r = await c.query(
        "UPDATE organizations SET admin_suspended=$2 WHERE id=$1",
        [org, b.suspended],
      );
      requireThat(r.rowCount, 404, "NOT_FOUND", "Empresa não encontrada.");
      await refreshSubscription(c, org, cfg);
      await audit(c, org, a.user_id, "admin.suspension_changed", b);
    });
    return { ok: true };
  });
  app.post("/ews/organizations/:id/reconcile", async (req) => {
    const a = await admin(req),
      org = paramsId(req);
    await tx(db, { system: true }, async (c) => {
      requireThat(
        await one(c, "SELECT 1 FROM organizations WHERE id=$1", [org]),
        404,
        "NOT_FOUND",
        "Empresa não encontrada.",
      );
      await enqueue(c, "sync", `admin-sync:${id()}`, { org });
      await audit(c, org, a.user_id, "admin.reconcile_requested");
    });
    return { ok: true };
  });
  app.get("/ews/plans", async (req) => {
    await admin(req);
    return tx(
      db,
      { system: true },
      async (c) =>
        (await c.query("SELECT * FROM plans ORDER BY monthly_cents")).rows,
    );
  });
  app.put("/ews/plans/:plan", async (req) => {
    const a = await admin(req),
      p = z
        .object({ plan: z.enum(["start", "growth", "industry"]) })
        .parse(req.params).plan,
      b = z
        .object({
          monthly_cents: z.number().int().min(100).max(100000000),
          setup_cents: z.number().int().min(100).max(100000000),
          equipment_limit: z.number().int().min(1).max(1000000),
          user_limit: z.number().int().min(1).max(10000),
          active: z.boolean(),
          features: z.array(
            z.enum([
              "equipment",
              "documents",
              "requests",
              "parts",
              "quotes",
              "tickets",
              "reports",
              "advanced_roles",
            ]),
          ),
          reason: z.string().min(10).max(1000),
        })
        .strict()
        .parse(req.body);
    await tx(db, { system: true }, async (c) => {
      await c.query(
        "UPDATE plans SET monthly_cents=$2,setup_cents=$3,equipment_limit=$4,user_limit=$5,active=$6,features=$7,revision=revision+1 WHERE id=$1",
        [
          p,
          b.monthly_cents,
          b.setup_cents,
          b.equipment_limit,
          b.user_limit,
          b.active,
          JSON.stringify(b.features),
        ],
      );
      await audit(c, null, a.user_id, "admin.plan_changed", { plan: p, ...b });
    });
    return { ok: true };
  });
  app.get("/ews/inbox", async (req) => {
    await admin(req);
    return tx(db, { system: true }, async (c) => ({
      leads: (
        await c.query(
          "SELECT * FROM commercial_leads ORDER BY created_at DESC LIMIT 100",
        )
      ).rows,
      requests: (
        await c.query(
          "SELECT r.*,o.name AS organization FROM service_requests r JOIN organizations o ON o.id=r.org_id ORDER BY r.created_at DESC LIMIT 100",
        )
      ).rows,
    }));
  });
  app.get("/ews/events", async (req) => {
    await admin(req);
    return tx(
      db,
      { system: true },
      async (c) =>
        (
          await c.query(
            "SELECT id,event,received_at,processed_at FROM webhook_events ORDER BY received_at DESC LIMIT 100",
          )
        ).rows,
    );
  });
  app.get("/ews/jobs", async (req) => {
    await admin(req);
    return tx(
      db,
      { system: true },
      async (c) =>
        (
          await c.query(
            "SELECT id,kind,attempts,available_at,locked_at,error_code FROM jobs WHERE completed_at IS NULL ORDER BY available_at LIMIT 100",
          )
        ).rows,
    );
  });
  app.post("/ews/jobs/:id/retry", async (req) => {
    const a = await admin(req),
      jobId = paramsId(req),
      body = z
        .object({ reason: z.string().min(10).max(1000) })
        .strict()
        .parse(req.body);
    await tx(db, { system: true }, async (c) => {
      const job = await one(
        c,
        "SELECT * FROM jobs WHERE id=$1 AND completed_at IS NULL AND (locked_at IS NULL OR locked_at<now()-interval '10 minutes') FOR UPDATE",
        [jobId],
      );
      requireThat(
        job,
        409,
        "JOB_UNAVAILABLE",
        "Processamento concluído ou ainda em execução.",
      );
      await c.query(
        "UPDATE jobs SET attempts=0,available_at=now(),locked_at=NULL,locked_by=NULL WHERE id=$1",
        [jobId],
      );
      await audit(c, job.payload.org ?? null, a.user_id, "admin.job_retried", {
        job: jobId,
        kind: job.kind,
        reason: body.reason,
      });
    });
    return { ok: true };
  });
  return app;
}
