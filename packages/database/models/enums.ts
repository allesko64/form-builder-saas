import { pgEnum } from "drizzle-orm/pg-core";

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "senior_handler",
  "agency_bureau",
]);

export const formStatusEnum = pgEnum("form_status", [
  "draft",
  "published_public",
  "published_unlisted",
]);

export const formFieldTypeEnum = pgEnum("form_field_type", [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_select",
  "multi_select",
  "rating",
  "date",
  "checkbox",
]);
