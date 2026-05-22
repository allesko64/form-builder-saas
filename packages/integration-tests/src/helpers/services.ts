import AnalyticsServiceImport from "@repo/services/analytics";
import PublicServiceImport from "@repo/services/public";
import ResponseServiceImport from "@repo/services/response";

type Constructable<T> = new () => T;

function resolveDefault<T>(mod: unknown): Constructable<T> {
  if (typeof mod === "function") {
    return mod as Constructable<T>;
  }
  const withDefault = mod as { default: Constructable<T> };
  return withDefault.default;
}

export const analyticsService = new (resolveDefault(AnalyticsServiceImport))();
export const publicService = new (resolveDefault(PublicServiceImport))();
export const responseService = new (resolveDefault(ResponseServiceImport))();
