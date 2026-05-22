import express from "express";
import { logger } from "@repo/logger";

import * as trpcExpress from "@trpc/server/adapters/express";
import { apiReference } from "@scalar/express-api-reference";

import { auth } from "@repo/auth";
import { toNodeHandler } from "better-auth/node";

import { serverRouter } from "@repo/trpc/server";

import { createContext } from "./context";
import { env } from "./env";
import {
  applySecurityMiddleware,
  jsonBodyParser,
  sanitizeRequestBody,
} from "./middleware/security";
import { getOpenApiDocument, openApiRestMiddleware } from "./openapi";

export const app = express();

applySecurityMiddleware(app);

// Better Auth must run before JSON parser (manages its own body parsing).
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(jsonBodyParser());
app.use(sanitizeRequestBody);

app.get("/", (_req, res) => {
  return res.json({ message: "Form Builder SaaS is up and running..." });
});

app.get("/health", (_req, res) => {
  return res.json({ message: "Form Builder SaaS server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (_req, res) => {
  return res.json(getOpenApiDocument());
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use(
  "/docs",
  apiReference({
    url: "/openapi.json",
    theme: "purple",
  }),
);

app.use("/api", openApiRestMiddleware);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

export default app;
