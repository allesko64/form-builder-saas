import { z } from "zod";

/** Shared with DB `form_status` enum. */
export const formStatusSchema = z.enum([
  "draft",
  "published_public",
  "published_unlisted",
]);

export type FormStatus = z.infer<typeof formStatusSchema>;
