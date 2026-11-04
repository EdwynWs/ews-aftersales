import pg from "pg";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
if (process.env.NODE_ENV === "production")
  throw new Error("Test runner is local-development only.");
const owner = new URL(process.env.MIGRATION_DATABASE_URL ?? ""),
  app = new URL(process.env.DATABASE_URL ?? "");
if (
  !["localhost", "127.0.0.1", "postgres"].includes(owner.hostname) ||
  owner.host !== app.host
)
  throw new Error("Use the local development PostgreSQL server.");
const database = "ews_aftersales_test_" + randomBytes(8).toString("hex");
const client = new pg.Client({ connectionString: owner.href });
await client.connect();
let created = false;
try {
  await client.query(`CREATE DATABASE "${database}"`);
  created = true;
  owner.pathname = "/" + database;
  app.pathname = "/" + database;
  const tests = (await readdir(new URL("../tests/", import.meta.url)))
    .filter((f) => f.endsWith(".test.ts"))
    .map((f) => "tests/" + f);
  const child = spawn(
    process.execPath,
    ["--import", "tsx", "--test", "--test-concurrency=1", ...tests],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        TEST_DATABASE_URL: app.href,
        TEST_MIGRATION_DATABASE_URL: owner.href,
      },
    },
  );
  const result = await new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  if (result !== 0) process.exitCode = Number(result) || 1;
} finally {
  if (created) await client.query(`DROP DATABASE "${database}"`);
  await client.end();
}
