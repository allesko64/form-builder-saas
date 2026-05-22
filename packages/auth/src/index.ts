import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@repo/database";
import { account, session, user, verification } from "@repo/database/schema";
import { z } from "zod";

const env = z
  .object({
    BETTER_AUTH_SECRET: z.string(),
    BASE_URL: z.string().default("http://localhost:8000"),
    WEB_APP_URL: z.string().default("http://localhost:3000"),
    GOOGLE_OAUTH_CLIENT_ID: z.string(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string(),
  })
  .parse(process.env);

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  // Public URL operatives use (Next.js rewrites /api/auth to the API server).
  baseURL: env.WEB_APP_URL,
  basePath: "/api/auth",
  trustedOrigins: [env.WEB_APP_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true },
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
    },
  },
});

export type Auth = typeof auth;
