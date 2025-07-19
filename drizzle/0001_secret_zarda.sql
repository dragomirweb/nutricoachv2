CREATE TABLE "daily_summary" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"total_calories" integer DEFAULT 0 NOT NULL,
	"total_protein" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_carbs" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_fat" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_fiber" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_iron" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_magnesium" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_calcium" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_zinc" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_potassium" numeric(10, 2) DEFAULT '0' NOT NULL,
	"meal_count" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "daily_summary" ADD CONSTRAINT "daily_summary_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_summary_user_id_idx" ON "daily_summary" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "daily_summary_date_idx" ON "daily_summary" USING btree ("date");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_summary_user_date_unique" ON "daily_summary" USING btree ("user_id","date");