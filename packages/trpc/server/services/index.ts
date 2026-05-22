import AnalyticsService from "@repo/services/analytics";
import billingService from "@repo/services/billing";
import FieldService from "@repo/services/field";
import FormService from "@repo/services/form";
import PublicService from "@repo/services/public";
import ResponseService from "@repo/services/response";
import UserService from "@repo/services/user";
import { buildZodSchema } from "@repo/validators";

export const userService = new UserService();
export { billingService };
export const formService = new FormService();
export const fieldService = new FieldService();
export const publicService = new PublicService();
export const responseService = new ResponseService();
export const analyticsService = new AnalyticsService();

/** Re-exported so submission flow imports from services barrel (Phase 5). */
export { buildZodSchema };
