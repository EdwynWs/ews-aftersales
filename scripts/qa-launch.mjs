import { spawn } from "node:child_process";
const portIndex = process.argv.indexOf("--port");
const port =
  portIndex >= 0 ? process.argv[portIndex + 1] : (process.env.PORT ?? "3000");
const children = [
  spawn(process.execPath, ["--import", "tsx", "scripts/qa-api.ts"], {
    stdio: "inherit",
  }),
  spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "0.0.0.0",
      "--port",
      port,
    ],
    {
      cwd: new URL("../apps/web/", import.meta.url),
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: "inherit",
    },
  ),
];
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    for (const child of children) child.kill(signal);
  });
for (const child of children)
  child.on("exit", (code) => {
    if (code) {
      for (const other of children) if (other !== child) other.kill();
      process.exitCode = code;
    }
  });
