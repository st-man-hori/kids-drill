-- 算数（math）と、たし算Lv1〜5のマスタデータ。
--
-- これらの行はアプリの動作に必須（無いと practice-progress.ts が throw する）なため、
-- マスタデータとしてマイグレーションで投入する。
-- 詳細は docs/architecture.md「デプロイとマイグレーション」を参照。
--
-- config の内容は src/lib/practice.ts の ADD_LEVELS と対応する。レベルを調整・追加
-- するときはコード側だけ直しても反映されない（アプリは実行時にDBの config を読む）。
-- 新しいマイグレーションを追加すること。
--
-- NOT EXISTS で囲っているのは、この仕組みに移行する前に npm run db:seed を手で
-- 実行済みの環境（開発用DBなど）で二重に入るのを防ぐため。マイグレーション自体は
-- 台帳（drizzle.__drizzle_migrations）で1回しか走らないので、本来この防御は不要。

INSERT INTO "subjects" ("name", "slug")
SELECT '算数', 'math'
WHERE NOT EXISTS (SELECT 1 FROM "subjects" WHERE "slug" = 'math');
--> statement-breakpoint
INSERT INTO "difficulty_levels" ("subject_id", "skill_type", "level_number", "config")
SELECT s."id", 'add', v."level_number", v."config"
FROM "subjects" s
CROSS JOIN (
  VALUES
    (1, '{"minA":1,"maxA":9,"minB":1,"maxB":9,"carry":false}'::jsonb),
    (2, '{"minA":1,"maxA":9,"minB":1,"maxB":9,"carry":true}'::jsonb),
    (3, '{"minA":10,"maxA":10,"minB":1,"maxB":9,"carry":false}'::jsonb),
    (4, '{"minA":11,"maxA":19,"minB":1,"maxB":9,"carry":false}'::jsonb),
    (5, '{"minA":11,"maxA":19,"minB":1,"maxB":9,"carry":true}'::jsonb)
) AS v ("level_number", "config")
WHERE s."slug" = 'math'
  AND NOT EXISTS (
    SELECT 1 FROM "difficulty_levels" d
    WHERE d."subject_id" = s."id"
      AND d."skill_type" = 'add'
      AND d."level_number" = v."level_number"
  );
