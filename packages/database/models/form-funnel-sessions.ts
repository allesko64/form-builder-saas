import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { formsTable } from "./forms";

export const formFunnelSessionsTable = pgTable(
  "form_funnel_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    /** Terminal fingerprint or client session id. */
    sessionKey: varchar("session_key", { length: 128 }).notNull(),

    /** Highest multi-step index the respondent reached (0-based). */
    maxStepReached: integer("max_step_reached").notNull().default(0),

    submitted: boolean("submitted").notNull().default(false),

    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("form_funnel_sessions_form_session_idx").on(
      table.formId,
      table.sessionKey,
    ),
    index("form_funnel_sessions_form_id_idx").on(table.formId),
    index("form_funnel_sessions_form_submitted_idx").on(
      table.formId,
      table.submitted,
    ),
  ],
);

export type SelectFormFunnelSession = typeof formFunnelSessionsTable.$inferSelect;
export type InsertFormFunnelSession = typeof formFunnelSessionsTable.$inferInsert;
