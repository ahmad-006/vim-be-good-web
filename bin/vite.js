#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const dir = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";
const vpBin = resolve(dir, "../node_modules/.bin/" + (isWin ? "vp.cmd" : "vp"));

const child = spawn(vpBin, process.argv.slice(2), {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
