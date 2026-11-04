import { createInterface } from "node:readline/promises";
import { emitKeypressEvents } from "node:readline";
import { stdin, stdout } from "node:process";
import { pool, tx } from "../packages/db/index.ts";
import { id, hashPassword } from "../apps/api/src/security.ts";
import { email, password } from "../packages/shared/validation.ts";
const input = createInterface({ input: stdin, output: stdout });
const address = email.parse(
  await input.question("E-mail do administrador EWS: "),
);
const name = await input.question("Nome: ");
input.close();
async function hiddenPassword() {
  if (!stdin.isTTY)
    throw new Error(
      "Use um terminal interativo ou defina EWS_ADMIN_PASSWORD apenas para este processo.",
    );
  stdout.write("Senha (mínimo 12 caracteres, não exibida): ");
  emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const handler = (str: string, key: any) => {
      if (key.name === "return" || (key.ctrl && key.name === "c")) {
        stdin.off("keypress", handler);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\n");
        if (key.ctrl) reject(new Error("Cancelado."));
        else resolve(value);
      } else if (key.name === "backspace") value = value.slice(0, -1);
      else if (str && !key.ctrl && !key.meta) value += str;
    };
    stdin.on("keypress", handler);
  });
}
const hash = await hashPassword(
  password.parse(process.env.EWS_ADMIN_PASSWORD ?? (await hiddenPassword())),
);
const db = pool(process.env.DATABASE_URL ?? "");
await tx(db, { system: true }, (c) =>
  c.query(
    "INSERT INTO users(id,name,email,password_hash,verified_at,is_ews_admin) VALUES($1,$2,$3,$4,now(),true)",
    [id(), name, address, hash],
  ),
);
await db.end();
console.log("Administrador criado. O login exige confirmação por e-mail.");
