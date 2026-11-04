import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import type { DBClient } from "../../../packages/db/index.ts";
const scrypt = (
  password: string,
  salt: string,
  length: number,
  options: Record<string, number>,
) =>
  new Promise<Buffer>((resolve, reject) =>
    scryptCb(password, salt, length, options, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
export const id = () => randomUUID();
export const token = () => randomBytes(32).toString("base64url");
export const digest = (s: string) =>
  createHash("sha256").update(s).digest("hex");
export function equal(a: string, b: string) {
  return timingSafeEqual(Buffer.from(digest(a)), Buffer.from(digest(b)));
}
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const out = (await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return `scrypt:${salt}:${out.toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const [version, salt, key] = hash.split(":");
  if (version !== "scrypt" || !salt || !key) return false;
  const out = (await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  const expected = Buffer.from(key, "hex");
  return out.length === expected.length && timingSafeEqual(out, expected);
}
export class Problem extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function requireThat(
  ok: unknown,
  status: number,
  code: string,
  message: string,
): asserts ok {
  if (!ok) throw new Problem(status, code, message);
}
export async function audit(
  c: DBClient,
  org: string | null,
  actor: string | null,
  action: string,
  detail: Record<string, unknown> = {},
) {
  await c.query(
    "INSERT INTO audit_logs(id,org_id,actor_id,action,detail) VALUES($1,$2,$3,$4,$5)",
    [id(), org, actor, action, JSON.stringify(detail)],
  );
}
export async function enqueue(
  c: DBClient,
  kind: string,
  key: string,
  payload: Record<string, unknown>,
) {
  await c.query(
    "INSERT INTO jobs(id,kind,dedupe_key,payload) VALUES($1,$2,$3,$4) ON CONFLICT(dedupe_key) DO NOTHING",
    [id(), kind, key, JSON.stringify(payload)],
  );
}
