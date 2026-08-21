-- 国語（kokugo）と、かんじよみクイズ（grade1）のレベルLv1〜4のマスタデータ。
--
-- 難易度軸は画数（strokeCount）。どの漢字を学校で習ったかはアプリから分からない
-- ため、算数の「繰り上がりの有無」と同じように、どの子にも共通して測れる指標を
-- 軸にしている。レベルが上がるほど出題対象の画数の上限が上がる累積方式
-- （下限は設けない＝易しい字も引き続き出題対象に残る）。
-- 詳細は docs/architecture.md「かんじよみクイズ」参照。
--
-- config の内容は src/lib/kanji-quiz.ts の KANJI_LEVELS と対応する。
-- レベルを調整・追加するときはコード側だけ直しても反映されない
-- （アプリは実行時にDBの config を読む。docs/architecture.md「デプロイと
-- マイグレーション」）。新しいマイグレーションを追加すること。
--
-- NOT EXISTS で囲っている理由は 0001_math_add_levels.sql と同じ
-- （手動seed済み環境での二重投入防止。マイグレーション自体は台帳で1回しか走らない）。

INSERT INTO "subjects" ("name", "slug")
SELECT '国語', 'kokugo'
WHERE NOT EXISTS (SELECT 1 FROM "subjects" WHERE "slug" = 'kokugo');
--> statement-breakpoint
INSERT INTO "difficulty_levels" ("subject_id", "skill_type", "level_number", "config")
SELECT s."id", 'kanji_reading', v."level_number", v."config"
FROM "subjects" s
CROSS JOIN (
  VALUES
    (1, '{"maxStrokeCount":3}'::jsonb),
    (2, '{"maxStrokeCount":4}'::jsonb),
    (3, '{"maxStrokeCount":6}'::jsonb),
    (4, '{"maxStrokeCount":null}'::jsonb)
) AS v ("level_number", "config")
WHERE s."slug" = 'kokugo'
  AND NOT EXISTS (
    SELECT 1 FROM "difficulty_levels" d
    WHERE d."subject_id" = s."id"
      AND d."skill_type" = 'kanji_reading'
      AND d."level_number" = v."level_number"
  );
