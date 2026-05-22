import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ResponseAnswers } from "@repo/types";

import { formsTable } from "./forms";

export type { ResponseAnswers };

export const responsesTable = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    formId: uuid("form_id")
      .notNull()
      .references(() => formsTable.id, { onDelete: "cascade" }),

    submissionId: uuid("submission_id").notNull(),

    respondentEmail: varchar("respondent_email", { length: 255 }),

    answers: jsonb("answers").$type<ResponseAnswers>().notNull(),

    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: text("user_agent"),

    completionTimeMs: integer("completion_time_ms"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("responses_submission_id_unique_idx").on(table.submissionId),
    uniqueIndex("responses_form_id_ip_hash_unique_idx")
      .on(table.formId, table.ipHash)
      .where(sql`${table.ipHash} IS NOT NULL`),
    index("responses_form_id_idx").on(table.formId),
    index("responses_form_id_created_at_idx").on(table.formId, table.createdAt),
  ],
);

export type SelectResponse = typeof responsesTable.$inferSelect;
export type InsertResponse = typeof responsesTable.$inferInsert;
