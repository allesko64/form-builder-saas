import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./user";
import { formStatusEnum } from "./enums";

export const formsTable = pgTable(
  "forms",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    slug: varchar("slug", { length: 120 }).notNull(),

    status: formStatusEnum("status").default("draft").notNull(),

    theme: jsonb("theme").$type<Record<string, unknown>>(),

    submitButtonText: varchar("submit_button_text", { length: 80 }).default("Submit"),
    successMessage: text("success_message").default("Thank you for your response!"),

    responseLimit: integer("response_limit"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    collectRespondentEmail: boolean("collect_respondent_email").default(false).notNull(),

    deletedAt: timestamp("deleted_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("forms_user_id_idx").on(table.userId),
    uniqueIndex("forms_slug_unique_idx").on(table.slug),
  ],
);

export type SelectForm = typeof formsTable.$inferSelect;
export type InsertForm = typeof formsTable.$inferInsert;
