CREATE TABLE "form_funnel_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"session_key" varchar(128) NOT NULL,
	"max_step_reached" integer DEFAULT 0 NOT NULL,
	"submitted" boolean DEFAULT false NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_funnel_sessions" ADD CONSTRAINT "form_funnel_sessions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "form_funnel_sessions_form_session_idx" ON "form_funnel_sessions" USING btree ("form_id","session_key");
--> statement-breakpoint
CREATE INDEX "form_funnel_sessions_form_id_idx" ON "form_funnel_sessions" USING btree ("form_id");
--> statement-breakpoint
CREATE INDEX "form_funnel_sessions_form_submitted_idx" ON "form_funnel_sessions" USING btree ("form_id","submitted");
