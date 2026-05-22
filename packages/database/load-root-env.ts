import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

/** Load monorepo root `.env` — never package-local copies. */
const packageDir = fileURLToPath(new URL(".", import.meta.url));
const rootEnv = resolve(packageDir, "../../.env");

if (existsSync(rootEnv)) {
  config({ path: rootEnv });
}
