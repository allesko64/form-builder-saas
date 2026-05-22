import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().optional(),
  NODE_ENV: z.enum(["development", "prod"]).default("development"),
  BASE_URL: z.string().default("http://localhost:8000"),
  WEB_APP_URL: z.string().default("http://localhost:3000"),

  BETTER_AUTH_SECRET: z.string(),

  GOOGLE_OAUTH_CLIENT_ID: z.string(),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string(),

  VALKEY_URL: z.string().optional(),
  IP_HASH_SALT: z.string().optional(),

  /** Max JSON body size (express.json `limit`). */
  JSON_BODY_LIMIT: z.string().default("512kb"),

  /** Global API rate limit per IP. */
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
});

function createEnv(env: NodeJS.ProcessEnv) {
  const safeParseResult = envSchema.safeParse(env);
  if (!safeParseResult.success) throw new Error(safeParseResult.error.message);
  return safeParseResult.data;
}

export const env = createEnv(process.env);
