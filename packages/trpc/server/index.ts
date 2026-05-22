import { router } from "./trpc";

import { analyticsRouter } from "./routes/analytics/route";
import { authRouter } from "./routes/auth/route";
import { billingRouter } from "./routes/billing/route";
import { fieldRouter } from "./routes/field/route";
import { formRouter } from "./routes/form/route";
import { healthRouter } from "./routes/health/route";
import { publicRouter } from "./routes/public/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  billing: billingRouter,
  form: formRouter,
  field: fieldRouter,
  public: publicRouter,
  analytics: analyticsRouter,
});

export { createContext } from "./context";
export type { Context } from "./context";
export { enforceSubmissionRateLimit } from "./middleware/rate-limit";
export { getClientIp, hashIp, resolveTerminalHash, TERMINAL_ID_HEADER } from "./lib/ip";
export { publicProcedure, protectedProcedure } from "./trpc";
export type ServerRouter = typeof serverRouter;
