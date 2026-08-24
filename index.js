/* eslint-disable @typescript-eslint/no-require-imports */
const { spawn } = require("node:child_process");
const path = require("node:path");

const port = String(process.env.PORT || "3000");
const nextCli = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");

const child = spawn(
  process.execPath,
  [nextCli, "start", "--hostname", "0.0.0.0", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
  }
);

function shutdown(signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
