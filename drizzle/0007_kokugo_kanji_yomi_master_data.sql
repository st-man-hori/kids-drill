-- よみがなモード（国語スパイク）のマスタデータ。
--
-- docs/architecture.mdの着手順序（算数のひき算・タイムアタック・ランキングが揃うまで
-- 他教科へ広げない）をあえて前倒ししたプロトタイプで、mainへはマージしない前提。
-- 詳細はscripts/kokugo-ai/README.md参照。
--
-- 誤答（distractor_readings）はscripts/kokugo-ai/generate-distractors.tsが
-- さくらのAI Engineで生成した候補（scripts/kokugo-ai/output/quiz-candidates.json）を
-- 人間がレビューして採用したもの。正解データ（kanji, correct_reading）は
-- 学年別漢字配当表を参照して手動で用意した小1漢字のごく一部（サンプル、80字全部ではない）。
--
-- レベル分けは難易度理論に基づくものではなく、15字を5字ずつ機械的に3分割しただけの
-- プロトタイプ用の仮の区切り。

INSERT INTO "subjects" ("name", "slug")
SELECT '国語', 'kokugo'
WHERE NOT EXISTS (SELECT 1 FROM "subjects" WHERE "slug" = 'kokugo');
--> statement-breakpoint
INSERT INTO "difficulty_levels" ("subject_id", "skill_type", "level_number", "config")
SELECT s."id", 'kanji_yomi', v."level_number", v."config"
FROM "subjects" s
CROSS JOIN (
  VALUES
    (1, '{"grade":1}'::jsonb),
    (2, '{"grade":1}'::jsonb),
    (3, '{"grade":1}'::jsonb)
) AS v ("level_number", "config")
WHERE s."slug" = 'kokugo'
  AND NOT EXISTS (
    SELECT 1 FROM "difficulty_levels" d
    WHERE d."subject_id" = s."id"
      AND d."skill_type" = 'kanji_yomi'
      AND d."level_number" = v."level_number"
  );
--> statement-breakpoint
INSERT INTO "kanji_questions" ("level_id", "kanji", "correct_reading", "distractor_readings")
SELECT d."id", v."kanji", v."correct_reading", v."distractor_readings"
FROM "difficulty_levels" d
JOIN "subjects" s ON s."id" = d."subject_id"
CROSS JOIN (
  VALUES
    (1, '一', 'いち', '["にん","さつ","くん"]'::jsonb),
    (1, '二', 'に', '["さん","よん","ご"]'::jsonb),
    (1, '三', 'さん', '["みつ","さお","みず"]'::jsonb),
    (1, '火', 'か', '["き","ふ","へ"]'::jsonb),
    (1, '水', 'すい', '["すう","すく","すん"]'::jsonb),
    (2, '木', 'もく', '["むく","みく","くく"]'::jsonb),
    (2, '金', 'きん', '["げん","かん","がん"]'::jsonb),
    (2, '土', 'ど', '["すみ","はん","くん"]'::jsonb),
    (2, '日', 'にち', '["さく","まつ","かん"]'::jsonb),
    (2, '月', 'げつ', '["にち","ゆき","かげ"]'::jsonb),
    (3, '山', 'さん', '["さむ","たん","やん"]'::jsonb),
    (3, '川', 'せん', '["さわ","がわ","さか"]'::jsonb),
    (3, '人', 'じん', '["すん","まん","りん"]'::jsonb),
    (3, '大', 'だい', '["だく","だん","おん"]'::jsonb),
    (3, '小', 'しょう', '["さく","すく","ささ"]'::jsonb)
) AS v ("level_number", "kanji", "correct_reading", "distractor_readings")
WHERE s."slug" = 'kokugo'
  AND d."skill_type" = 'kanji_yomi'
  AND d."level_number" = v."level_number"
  AND NOT EXISTS (
    SELECT 1 FROM "kanji_questions" k
    WHERE k."level_id" = d."id" AND k."kanji" = v."kanji"
  );
