// Local browser QA only. No simulated payment endpoint and no production deployment.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { testDatabase, testConfig } from "../tests/helpers.ts";
import { buildApp } from "../apps/api/src/app.ts";
import { Asaas } from "../apps/api/src/asaas.ts";
import { runJob } from "../apps/api/src/jobs.ts";
import { setTimeout as wait } from "node:timers/promises";
if (process.env.NODE_ENV === "production")
  throw new Error("QA harness cannot run in production.");
await mkdir(".local", { recursive: true });
const { db } = await testDatabase(".local/browser-qa-db");
const cfg = { ...testConfig, checkoutEnabled: false };
const app = await buildApp(db, cfg);
await app.listen({ host: "127.0.0.1", port: 4000 });
let running = true;
const mails: any[] = [];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    running = false;
  });
while (running) {
  try {
    cfg.origin = (await readFile(".local/qa-origin", "utf8")).trim();
  } catch {}
  await runJob(db, new Asaas(""), cfg, async (p) => {
    mails.push(p);
    await writeFile(".local/qa-mails.json", JSON.stringify(mails));
  });
  await wait(500);
}
await app.close();
await db.end();
