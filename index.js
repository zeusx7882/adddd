/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const { spawn } = require("node:child_process");
const path = require("node:path");

const port = String(process.env.PORT || "3000");
const nextCli = path.join(__dirname, "node_modules", "next", "dist", "bin", "next");
const buildIdPath = path.join(__dirname, ".next", "BUILD_ID");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      env: process.env,
      cwd: __dirname,
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? 1}`));
    });
  });
}

async function ensureBuildIfMissing() {
  if (process.env.SKIP_RUNTIME_BUILD === "1") {
    return;
  }

  if (fs.existsSync(buildIdPath)) {
    return;
  }

  console.log("[bootstrap] .next/BUILD_ID not found. Running one-time build...");
  await run(npmCommand, ["run", "build"]);
}

async function start() {
  try {
    await ensureBuildIfMissing();
  } catch (error) {
    console.error("[bootstrap] Failed to prepare build:", error);
    process.exit(1);
  }

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
}

void start();
