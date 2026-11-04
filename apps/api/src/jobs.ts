import { tx, one, type DBPool } from "../../../packages/db/index.ts";
import { id, enqueue } from "./security.ts";
import {
  checkout,
  processWebhook,
  syncSubscription,
  cancelSubscription,
  refreshSubscription,
} from "./billing.ts";
import type { Gateway } from "./asaas.ts";
import type { Config } from "./config.ts";
export async function runJob(
  db: DBPool,
  gateway: Gateway,
  cfg: Config,
  sendMail: (payload: any) => Promise<void>,
) {
  const lease = id();
  const job = await tx(db, { system: true }, async (c) => {
    const row = await one(
      c,
      "SELECT * FROM jobs WHERE completed_at IS NULL AND attempts<8 AND available_at<=now() AND (locked_at IS NULL OR locked_at<now()-interval '10 minutes') ORDER BY available_at FOR UPDATE SKIP LOCKED LIMIT 1",
    );
    if (!row) return null;
    if (row.payload.org) {
      await c.query("SELECT id FROM organizations WHERE id=$1 FOR UPDATE", [
        row.payload.org,
      ]);
      const running = await one(
        c,
        "SELECT id FROM jobs WHERE payload->>'org'=$1 AND completed_at IS NULL AND locked_at>now()-interval '10 minutes' AND id!=$2 LIMIT 1",
        [row.payload.org, row.id],
      );
      if (running) return null;
    }
    await c.query(
      "UPDATE jobs SET locked_at=now(),locked_by=$2,attempts=attempts+1 WHERE id=$1",
      [row.id, lease],
    );
    return row;
  });
  if (!job) return false;
  try {
    if (job.kind === "email") await sendMail(job.payload);
    else if (job.kind === "checkout")
      await checkout(db, gateway, job.payload.org, cfg);
    else if (job.kind === "webhook")
      await processWebhook(db, gateway, job.payload.eventId, cfg);
    else if (job.kind === "sync")
      await syncSubscription(db, gateway, job.payload.org, cfg);
    else if (job.kind === "cancel")
      await cancelSubscription(db, gateway, job.payload.org, cfg);
    else throw new Error("UNKNOWN_JOB");
    await tx(db, { system: true }, (c) =>
      c.query(
        "UPDATE jobs SET completed_at=now(),locked_at=NULL,error_code=NULL,payload=CASE WHEN kind='email' THEN '{}'::jsonb ELSE payload END WHERE id=$1 AND locked_by=$2",
        [job.id, lease],
      ),
    );
  } catch (e: any) {
    await tx(db, { system: true }, (c) =>
      c.query(
        "UPDATE jobs SET locked_at=NULL,error_code=$2,available_at=now()+($3::text||' seconds')::interval WHERE id=$1 AND locked_by=$4",
        [
          job.id,
          e.code ?? "JOB_FAILED",
          Math.min(3600, 30 * 2 ** job.attempts),
          lease,
        ],
      ),
    );
  }
  return true;
}
export async function scheduleMaintenance(db: DBPool, cfg: Config) {
  await tx(db, { system: true }, async (c) => {
    const all = (
      await c.query("SELECT org_id,gateway_subscription FROM subscriptions")
    ).rows;
    for (const s of all) {
      await refreshSubscription(c, s.org_id, cfg);
      if (s.gateway_subscription && cfg.checkoutEnabled)
        await enqueue(
          c,
          "sync",
          `scheduled:${s.org_id}:${Math.floor(Date.now() / 3600000)}`,
          { org: s.org_id },
        );
    }
    await c.query("DELETE FROM sessions WHERE expires_at<now()");
    await c.query(
      "DELETE FROM auth_tokens WHERE expires_at<now()-interval '1 day'",
    );
  });
}
