import AnalyticsServiceImport from "@repo/services/analytics";
import FormServiceImport from "@repo/services/form";
import PublicServiceImport from "@repo/services/public";
import ResponseServiceImport from "@repo/services/response";

type Constructable<T> = new () => T;

function resolveDefault<T>(mod: unknown): Constructable<T> {
  if (typeof mod === "function") {
    return mod as Constructable<T>;
  }
  return (mod as { default: Constructable<T> }).default;
}

export const analyticsService: InstanceType<typeof AnalyticsServiceImport> = new (resolveDefault<
  InstanceType<typeof AnalyticsServiceImport>
>(AnalyticsServiceImport))();

export const formService: InstanceType<typeof FormServiceImport> = new (resolveDefault<
  InstanceType<typeof FormServiceImport>
>(FormServiceImport))();

export const publicService: InstanceType<typeof PublicServiceImport> = new (resolveDefault<
  InstanceType<typeof PublicServiceImport>
>(PublicServiceImport))();

export const responseService: InstanceType<typeof ResponseServiceImport> = new (resolveDefault<
  InstanceType<typeof ResponseServiceImport>
>(ResponseServiceImport))();
