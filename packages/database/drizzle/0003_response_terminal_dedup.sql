-- Terminal dedup: one response per (form_id, ip_hash). Clear ip_hash on duplicate
-- rows (keeps earliest by created_at) so existing seed/demo data can migrate.
WITH "keepers" AS (
  SELECT DISTINCT ON ("form_id", "ip_hash") "id"
  FROM "responses"
  WHERE "ip_hash" IS NOT NULL
  ORDER BY "form_id", "ip_hash", "created_at" ASC
)
UPDATE "responses"
SET "ip_hash" = NULL
WHERE "ip_hash" IS NOT NULL
  AND "id" NOT IN (SELECT "id" FROM "keepers");
--> statement-breakpoint
CREATE UNIQUE INDEX "responses_form_id_ip_hash_unique_idx" ON "responses" USING btree ("form_id","ip_hash") WHERE "ip_hash" IS NOT NULL;
