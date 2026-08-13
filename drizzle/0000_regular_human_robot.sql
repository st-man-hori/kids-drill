CREATE TABLE "child_equipped_items" (
	"child_id" uuid NOT NULL,
	"slot_type" text NOT NULL,
	"wardrobe_item_id" uuid NOT NULL,
	"equipped_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "child_equipped_items_child_id_slot_type_unique" UNIQUE("child_id","slot_type")
);
--> statement-breakpoint
CREATE TABLE "child_owned_wardrobe_items" (
	"child_id" uuid NOT NULL,
	"wardrobe_item_id" uuid NOT NULL,
	"acquired_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "child_owned_wardrobe_items_child_id_wardrobe_item_id_unique" UNIQUE("child_id","wardrobe_item_id")
);
--> statement-breakpoint
CREATE TABLE "child_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"login_id" text NOT NULL,
	"pin_hash" text NOT NULL,
	"display_nickname" text NOT NULL,
	"grade" integer NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "child_profiles_login_id_unique" UNIQUE("login_id"),
	CONSTRAINT "child_profiles_display_nickname_unique" UNIQUE("display_nickname")
);
--> statement-breakpoint
CREATE TABLE "child_progress" (
	"child_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"skill_type" text NOT NULL,
	"current_level_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "child_progress_child_id_subject_id_skill_type_unique" UNIQUE("child_id","subject_id","skill_type")
);
--> statement-breakpoint
CREATE TABLE "difficulty_levels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"skill_type" text NOT NULL,
	"level_number" integer NOT NULL,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"level_id" uuid NOT NULL,
	"total_questions" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "subjects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "time_attack_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"child_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"skill_type" text NOT NULL,
	"correct_count" integer NOT NULL,
	"duration_seconds" integer DEFAULT 60 NOT NULL,
	"played_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wardrobe_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_type" text NOT NULL,
	"name" text NOT NULL,
	"asset_ref" text NOT NULL,
	"unlock_condition_type" text NOT NULL,
	"unlock_condition_value" jsonb NOT NULL,
	"price_points" integer
);
--> statement-breakpoint
ALTER TABLE "child_equipped_items" ADD CONSTRAINT "child_equipped_items_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_equipped_items" ADD CONSTRAINT "child_equipped_items_wardrobe_item_id_wardrobe_items_id_fk" FOREIGN KEY ("wardrobe_item_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_owned_wardrobe_items" ADD CONSTRAINT "child_owned_wardrobe_items_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_owned_wardrobe_items" ADD CONSTRAINT "child_owned_wardrobe_items_wardrobe_item_id_wardrobe_items_id_fk" FOREIGN KEY ("wardrobe_item_id") REFERENCES "public"."wardrobe_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_progress" ADD CONSTRAINT "child_progress_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_progress" ADD CONSTRAINT "child_progress_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "child_progress" ADD CONSTRAINT "child_progress_current_level_id_difficulty_levels_id_fk" FOREIGN KEY ("current_level_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "difficulty_levels" ADD CONSTRAINT "difficulty_levels_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_level_id_difficulty_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_attack_runs" ADD CONSTRAINT "time_attack_runs_child_id_child_profiles_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."child_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_attack_runs" ADD CONSTRAINT "time_attack_runs_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;