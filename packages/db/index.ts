import pg from "pg";
export interface DBClient {
  query(
    sql: string,
    values?: any[],
  ): Promise<{ rows: any[]; rowCount?: number | null }>;
  release(): void;
}
export interface DBPool {
  connect(): Promise<DBClient>;
  end(): Promise<void>;
}
export const pool = (url: string): DBPool =>
  new pg.Pool({
    connectionString: url,
    max: 10,
    connectionTimeoutMillis: 5000,
  });
export async function tx<T>(
  db: DBPool,
  scope: { org?: string; system?: boolean },
  fn: (c: DBClient) => Promise<T>,
): Promise<T> {
  const c = await db.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "SELECT set_config('app.org_id',$1,true),set_config('app.system',$2,true)",
      [scope.org ?? "", scope.system ? "yes" : "no"],
    );
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
export async function one(c: DBClient, sql: string, args: any[] = []) {
  return (await c.query(sql, args)).rows[0];
}
