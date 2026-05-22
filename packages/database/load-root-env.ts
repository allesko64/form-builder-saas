import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { config } from "dotenv";

/**
 * Load monorepo root `.env` during local development.
 * In production, DATABASE_URL (and other env vars) are injected by PM2/host
 * before the process starts, so this is a no-op there.
 * Turbo/pnpm always invoke from the repo root, so process.cwd() resolves correctly.
 */
if (!process.env.DATABASE_URL) {
  const rootEnv = resolve(process.cwd(), ".env");
  if (existsSync(rootEnv)) {
    config({ path: rootEnv });
  }
}
