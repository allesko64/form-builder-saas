import { Resend } from "resend";

import { env, isEmailConfigured } from "../env";

export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export function getFromAddress(): string | null {
  return env.EMAIL_FROM ?? null;
}

export { isEmailConfigured };
