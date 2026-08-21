-- 国語（kokugo）と、かんじよみクイズの学年別レベル（Lv1〜4）のマスタデータ。
--
-- 難易度軸は画数（strokeCount）。どの漢字を学校で習ったかはアプリから分からない
-- ため、算数の「繰り上がりの有無」と同じように、どの子にも共通して測れる指標を
-- 軸にしている。レベルが上がるほど出題対象の画数の上限が上がる累積方式
-- （下限は設けない＝易しい字も引き続き出題対象に残る）。
--
-- skill_typeを学年ごとに分けている（kanji_reading_grade1 〜 grade4）のは、
-- 学年ごとに配当漢字のバンク・画数分布が違い、しきい値も学年ごとに別々に
-- 決めているため（grade1の区切りを他学年にそのまま流用すると偏る）。
-- しきい値は各学年の画数分布をおよそ4等分する位置（累計字数がtotal*1/4,
-- 2/4, 3/4に最も近い画数）から決めた。5・6年生ぶんは問題バンクが未生成のため
-- 対象外（docs/architecture.md「かんじよみクイズ」）。
--
-- config の内容は src/lib/kanji-quiz.ts の KANJI_LEVELS_BY_GRADE と対応する。
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
SELECT s."id", v."skill_type", v."level_number", v."config"
FROM "subjects" s
CROSS JOIN (
  VALUES
    -- grade1（配当漢字80字）
    ('kanji_reading_grade1', 1, '{"maxStrokeCount":3}'::jsonb),
    ('kanji_reading_grade1', 2, '{"maxStrokeCount":4}'::jsonb),
    ('kanji_reading_grade1', 3, '{"maxStrokeCount":6}'::jsonb),
    ('kanji_reading_grade1', 4, '{"maxStrokeCount":null}'::jsonb),
    -- grade2（配当漢字160字）
    ('kanji_reading_grade2', 1, '{"maxStrokeCount":5}'::jsonb),
    ('kanji_reading_grade2', 2, '{"maxStrokeCount":7}'::jsonb),
    ('kanji_reading_grade2', 3, '{"maxStrokeCount":10}'::jsonb),
    ('kanji_reading_grade2', 4, '{"maxStrokeCount":null}'::jsonb),
    -- grade3（配当漢字200字）
    ('kanji_reading_grade3', 1, '{"maxStrokeCount":7}'::jsonb),
    ('kanji_reading_grade3', 2, '{"maxStrokeCount":9}'::jsonb),
    ('kanji_reading_grade3', 3, '{"maxStrokeCount":11}'::jsonb),
    ('kanji_reading_grade3', 4, '{"maxStrokeCount":null}'::jsonb),
    -- grade4（配当漢字202字）
    ('kanji_reading_grade4', 1, '{"maxStrokeCount":7}'::jsonb),
    ('kanji_reading_grade4', 2, '{"maxStrokeCount":9}'::jsonb),
    ('kanji_reading_grade4', 3, '{"maxStrokeCount":12}'::jsonb),
    ('kanji_reading_grade4', 4, '{"maxStrokeCount":null}'::jsonb)
) AS v ("skill_type", "level_number", "config")
WHERE s."slug" = 'kokugo'
  AND NOT EXISTS (
    SELECT 1 FROM "difficulty_levels" d
    WHERE d."subject_id" = s."id"
      AND d."skill_type" = v."skill_type"
      AND d."level_number" = v."level_number"
  );
