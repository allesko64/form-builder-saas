import type { RequestHandler } from "express";
import {
  createOpenApiExpressMiddleware,
  generateOpenApiDocument,
  type OpenAPIObject,
} from "trpc-to-openapi";

import { serverRouter } from "@repo/trpc/server";

import { createContext } from "./context";
import { env } from "./env";

const OPENAPI_OPTIONS = {
  title: "Form Builder SaaS API",
  description:
    "REST endpoints generated from the tRPC router. Use Better Auth session cookies for protected routes (forms, fields, analytics). Public form endpoints do not require auth.",
  version: "1.0.0",
  baseUrl: `${env.BASE_URL.replace(/\/$/, "")}/api`,
  docsUrl: `${env.BASE_URL.replace(/\/$/, "")}/docs`,
  securitySchemes: {
    sessionCookie: {
      type: "apiKey" as const,
      in: "cookie" as const,
      name: "better-auth.session_token",
      description: "Better Auth session cookie (sign in via /api/auth)",
    },
  },
};

let cachedDocument: OpenAPIObject | null = null;

export function getOpenApiDocument(): OpenAPIObject {
  if (!cachedDocument) {
    cachedDocument = generateOpenApiDocument(serverRouter, OPENAPI_OPTIONS);
  }
  return cachedDocument;
}

export const openApiRestMiddleware: RequestHandler = createOpenApiExpressMiddleware({
  router: serverRouter,
  createContext,
});
