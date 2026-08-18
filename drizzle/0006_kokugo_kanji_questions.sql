CREATE TABLE "kanji_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_id" uuid NOT NULL,
	"kanji" text NOT NULL,
	"correct_reading" text NOT NULL,
	"distractor_readings" jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kanji_questions" ADD CONSTRAINT "kanji_questions_level_id_difficulty_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE no action ON UPDATE no action;