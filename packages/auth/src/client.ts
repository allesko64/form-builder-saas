import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Same origin as the web app (Next.js proxies /api/auth → API server).
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000",
  basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
