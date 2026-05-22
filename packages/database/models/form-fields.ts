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
} from "drizzle-orm/pg-core";
import type { ValidationConfig, VisibilityConfig } from "@repo/types";

import { formsTable } from "./forms";
import { formFieldTypeEnum } from "./enums";

/** Alias for JSONB `validation_config` — same shape as `@repo/types` `ValidationConfig`. */
export type FieldValidationConfig = ValidationConfig;

/** Alias for JSONB `visibility_config` — conditional show/hide rules. */
export type FieldVisibilityConfig = VisibilityConfig;

export const formFieldsTable = pgTable(
  "form_fields",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    label: varchar("label", { length: 200 }).notNull(),
    placeholder: varchar("placeholder", { length: 200 }),
    helpText: text("help_text"),

    type: formFieldTypeEnum("type").notNull(),

    required: boolean("required").default(false).notNull(),

    sortOrder: integer("sort_order").notNull(),

    validationConfig: jsonb("validation_config").$type<FieldValidationConfig>(),

    visibilityConfig: jsonb("visibility_config").$type<FieldVisibilityConfig>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("form_fields_form_id_idx").on(table.formId)],
);

export type SelectFormField = typeof formFieldsTable.$inferSelect;
export type InsertFormField = typeof formFieldsTable.$inferInsert;
