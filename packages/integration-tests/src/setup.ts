import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname, "../../../.env") });

process.env.BETTER_AUTH_SECRET ??= "ci-test-better-auth-secret-min-32-chars-long";
process.env.BASE_URL ??= "http://localhost:8000";
process.env.WEB_APP_URL ??= "http://localhost:3000";
process.env.GOOGLE_OAUTH_CLIENT_ID ??= "test-google-client-id";
process.env.GOOGLE_OAUTH_CLIENT_SECRET ??= "test-google-client-secret";
process.env.IP_HASH_SALT ??= "test-ip-hash-salt";
process.env.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/dev";
