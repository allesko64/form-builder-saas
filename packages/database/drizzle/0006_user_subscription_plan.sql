DO $$ BEGIN
  CREATE TYPE "public"."subscription_plan" AS ENUM('free', 'senior_handler', 'agency_bureau');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "plan" "subscription_plan" DEFAULT 'free' NOT NULL;
