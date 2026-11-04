import { readdir, readFile } from "node:fs/promises";
import { pool } from "./index.ts";
const db = pool(process.env.MIGRATION_DATABASE_URL ?? "");
const c = await db.connect();
try {
  await c.query("SELECT pg_advisory_lock(318206)");
  await c.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations(name text PRIMARY KEY, applied_at timestamptz DEFAULT now())",
  );
  for (const file of (await readdir(new URL("./migrations/", import.meta.url)))
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (
      (
        await c.query("SELECT name FROM schema_migrations WHERE name=$1", [
          file,
        ])
      ).rows.length
    )
      continue;
    await c.query("BEGIN");
    try {
      await c.query(
        await readFile(
          new URL("./migrations/" + file, import.meta.url),
          "utf8",
        ),
      );
      await c.query("INSERT INTO schema_migrations(name) VALUES($1)", [file]);
      await c.query("COMMIT");
      console.log("Applied", file);
    } catch (e) {
      await c.query("ROLLBACK");
      throw e;
    }
  }
} finally {
  await c.query("SELECT pg_advisory_unlock(318206)");
  c.release();
  await db.end();
}
