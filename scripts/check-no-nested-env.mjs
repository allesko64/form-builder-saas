#!/usr/bin/env node
/**
 * Fails if `.env` files exist under `packages/` (use repo root `.env` only).
 */
import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const packagesDir = join(root, "packages");
const offenders = [];

function walk(dir, prefix) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist") {
      continue;
    }

    const rel = `${prefix}/${entry.name}`;

    if (entry.isDirectory()) {
      walk(join(dir, entry.name), rel);
      continue;
    }

    if (entry.name === ".env" || entry.name === ".env.local") {
      offenders.push(rel);
    }
  }
}

walk(packagesDir, "packages");

if (offenders.length > 0) {
  console.error("Package-level .env files are not allowed:\n");
  for (const path of offenders) {
    console.error(`  - ${path}`);
  }
  console.error(
    "\nDelete them. Copy `.env.example` once at the repo root and use `dotenv -e ../../.env` in package scripts.",
  );
  process.exit(1);
}

console.log("OK: no .env files under packages/");
