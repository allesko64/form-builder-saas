import type { OpenApiMeta } from "trpc-to-openapi";

type OpenApiRouteMeta = NonNullable<OpenApiMeta["openapi"]>;

/** Marks an OpenAPI operation as requiring session cookie auth in Scalar/docs. */
export function protectedOpenApi(meta: OpenApiRouteMeta): OpenApiRouteMeta {
  return { ...meta, protect: true };
}
