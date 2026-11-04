import { pool } from "../../../packages/db/index.ts";
import { buildApp } from "./app.ts";
import { config } from "./config.ts";
const cfg = config(),
  db = pool(process.env.DATABASE_URL ?? "");
const c = await db.connect();
try {
  const r = await c.query(
    "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
  );
  if (r.rows[0]?.rolsuper || r.rows[0]?.rolbypassrls)
    throw new Error("API database role must be NOSUPERUSER NOBYPASSRLS.");
} finally {
  c.release();
}
const app = await buildApp(db, cfg, { logger: true });
await app.listen({ port: cfg.port, host: "0.0.0.0" });
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await app.close();
    await db.end();
    process.exit(0);
  });
