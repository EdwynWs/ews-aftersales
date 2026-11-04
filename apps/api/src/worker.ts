import nodemailer from "nodemailer";
import { setTimeout as wait } from "node:timers/promises";
import { pool } from "../../../packages/db/index.ts";
import { config } from "./config.ts";
import { Asaas } from "./asaas.ts";
import { runJob, scheduleMaintenance } from "./jobs.ts";
const cfg = config(),
  db = pool(process.env.DATABASE_URL ?? ""),
  gateway = new Asaas(cfg.asaasKey);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number(process.env.SMTP_PORT ?? 1025),
  secure: process.env.SMTP_SECURE === "true",
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    : undefined,
  connectionTimeout: 10000,
  socketTimeout: 20000,
});
let running = true,
  lastMaintenance = 0;
for (const s of ["SIGTERM", "SIGINT"])
  process.on(s, () => {
    running = false;
  });
while (running) {
  try {
    if (Date.now() - lastMaintenance > 60000) {
      await scheduleMaintenance(db, cfg);
      lastMaintenance = Date.now();
    }
    if (
      !(await runJob(db, gateway, cfg, async (p) => {
        await transport.sendMail({
          from: process.env.MAIL_FROM,
          to: p.to,
          subject: p.subject,
          text: p.text,
        });
      }))
    )
      await wait(1000);
  } catch {
    console.error(
      JSON.stringify({ level: "error", code: "WORKER_CYCLE_FAILED" }),
    );
    await wait(5000);
  }
}
transport.close();
await db.end();
