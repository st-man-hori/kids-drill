-- 漢字よみモードの正解データ・レベル分けを、手動ピック15字のプロトタイプ用データから
-- kyoiku-kanji-api（自作、教育漢字1026字の読み・画数・学年データ）由来の小1配当表80字へ
-- 差し替える。docs/architecture.md「国語（漢字のよみ）」参照。
--
-- 正解データ（kanji, correct_reading）: kyoiku-kanji-apiが返す訓読み・音読みから、
-- 訓読みがあれば1つ目・無ければ音読みの1つ目（カタカナ→ひらがな変換）を機械的に選定
-- （scripts/kokugo-ai/fetch-kanji-master.ts）。
-- レベル分け: 画数（strokeCount）昇順で5字ずつ機械的に16レベルに区切る。
-- 誤答（distractor_readings）: さくらのAI Engineで生成した候補
-- （scripts/kokugo-ai/generate-distractors.ts）をひらがな限定・正答との不一致・重複無しで
-- 機械検証したもの。

-- 旧プロトタイプデータ（3レベル×5字＝15字の手動ピック）を削除する。
-- child_progressにこのsubject/skill_typeを参照する行がまだ無いことを確認済み
-- （マイページ導線を追加したばかりで実プレイ記録が無いため安全）。
DELETE FROM "kanji_questions"
WHERE "level_id" IN (
  SELECT d."id" FROM "difficulty_levels" d
  JOIN "subjects" s ON s."id" = d."subject_id"
  WHERE s."slug" = 'kokugo' AND d."skill_type" = 'kanji_yomi'
);
--> statement-breakpoint
DELETE FROM "difficulty_levels"
WHERE "id" IN (
  SELECT d."id" FROM "difficulty_levels" d
  JOIN "subjects" s ON s."id" = d."subject_id"
  WHERE s."slug" = 'kokugo' AND d."skill_type" = 'kanji_yomi'
);
--> statement-breakpoint
INSERT INTO "difficulty_levels" ("subject_id", "skill_type", "level_number", "config")
SELECT s."id", 'kanji_yomi', v."level_number", '{"grade":1}'::jsonb
FROM "subjects" s
CROSS JOIN (
  SELECT generate_series(1, 16) AS level_number
) AS v
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
    (1, '一', 'ひと', '["かん", "くん", "さく"]'::jsonb),
    (1, '七', 'なな', '["しん", "にち", "にん"]'::jsonb),
    (1, '九', 'ここの', '["くう", "くん", "きく"]'::jsonb),
    (1, '人', 'ひと', '["さく", "まん", "くん"]'::jsonb),
    (1, '十', 'とお', '["すう", "たん", "とん"]'::jsonb),
    (2, '下', 'した', '["しら", "みず", "まち"]'::jsonb),
    (2, '二', 'ふた', '["ひとつ", "みっつ", "さん"]'::jsonb),
    (2, '入', 'い', '["うち", "かく", "みる"]'::jsonb),
    (2, '八', 'や', '["やま", "やす", "やね"]'::jsonb),
    (2, '力', 'ちから', '["ちょく", "りく", "くり"]'::jsonb),
    (3, '三', 'み', '["みん", "さむ", "みつ"]'::jsonb),
    (3, '口', 'くち', '["かい", "くん", "こ"]'::jsonb),
    (3, '女', 'おんな', '["ひと", "うま", "かみ"]'::jsonb),
    (3, '子', 'こ', '["に", "た", "ひ"]'::jsonb),
    (3, '山', 'やま', '["さむ", "たに", "かぜ"]'::jsonb),
    (4, '上', 'うえ', '["うた", "おと", "くも"]'::jsonb),
    (4, '千', 'ち', '["てん", "さん", "じん"]'::jsonb),
    (4, '大', 'おお', '["うえ", "だく", "おん"]'::jsonb),
    (4, '小', 'ちい', '["さく", "くろ", "ひら"]'::jsonb),
    (4, '川', 'かわ', '["がわ", "さわ", "かみ"]'::jsonb),
    (5, '円', 'まる', '["まん", "ゆう", "ゆめ"]'::jsonb),
    (5, '土', 'つち', '["すち", "とど", "にち"]'::jsonb),
    (5, '夕', 'ゆう', '["ゆき", "ゆら", "すき"]'::jsonb),
    (5, '火', 'ひ', '["び", "こ", "さ"]'::jsonb),
    (5, '王', 'おう', '["おん", "おく", "おり"]'::jsonb),
    (6, '五', 'いつ', '["いち", "ごう", "ごろ"]'::jsonb),
    (6, '手', 'て', '["しょ", "すい", "ひと"]'::jsonb),
    (6, '月', 'つき', '["ゆき", "すき", "みつ"]'::jsonb),
    (6, '水', 'みず', '["しず", "ゆず", "すず"]'::jsonb),
    (6, '犬', 'いぬ', '["いん", "くん", "かん"]'::jsonb),
    (7, '中', 'なか', '["ひろ", "たか", "みな"]'::jsonb),
    (7, '天', 'あめ', '["そら", "くも", "ひかり"]'::jsonb),
    (7, '文', 'ふみ', '["ふん", "ぶり", "もり"]'::jsonb),
    (7, '日', 'ひ', '["さく", "もく", "ひろ"]'::jsonb),
    (7, '木', 'き', '["ひ", "さ", "た"]'::jsonb),
    (8, '六', 'む', '["むか", "むね", "むさ"]'::jsonb),
    (8, '右', 'みぎ', '["ひだり", "いぎ", "うえ"]'::jsonb),
    (8, '四', 'よ', '["よし", "しょ", "よく"]'::jsonb),
    (8, '左', 'ひだり', '["ひだ", "さま", "ひさ"]'::jsonb),
    (8, '玉', 'たま', '["たん", "まめ", "ひか"]'::jsonb),
    (9, '出', 'で', '["でん", "てん", "かん"]'::jsonb),
    (9, '正', 'ただ', '["さし", "さく", "たん"]'::jsonb),
    (9, '生', 'い', '["み", "こ", "た"]'::jsonb),
    (9, '田', 'た', '["てん", "だ", "ね"]'::jsonb),
    (9, '石', 'いし', '["かし", "たし", "ひし"]'::jsonb),
    (10, '本', 'もと', '["ぼん", "もん", "まん"]'::jsonb),
    (10, '気', 'き', '["さ", "た", "な"]'::jsonb),
    (10, '白', 'しろ', '["はな", "しろく", "びろ"]'::jsonb),
    (10, '目', 'め', '["み", "む", "も"]'::jsonb),
    (10, '立', 'た', '["さす", "しん", "たん"]'::jsonb),
    (11, '休', 'やす', '["やむ", "ゆす", "きょく"]'::jsonb),
    (11, '先', 'さき', '["さく", "さし", "しん"]'::jsonb),
    (11, '字', 'あざ', '["あし", "かい", "さく"]'::jsonb),
    (11, '糸', 'いと', '["ひも", "くみ", "さし"]'::jsonb),
    (11, '耳', 'みみ', '["みむ", "しん", "び"]'::jsonb),
    (12, '年', 'とし', '["にん", "とく", "とん"]'::jsonb),
    (12, '早', 'はや', '["さむい", "たかい", "ねむい"]'::jsonb),
    (12, '百', 'ひゃく', '["びゃく", "へん", "ひろく"]'::jsonb),
    (12, '竹', 'たけ', '["たこ", "きく", "すけ"]'::jsonb),
    (12, '虫', 'むし', '["むさ", "ちょう", "むん"]'::jsonb),
    (13, '名', 'な', '["に", "ま", "ね"]'::jsonb),
    (13, '花', 'はな', '["はなび", "はなさ", "はなか"]'::jsonb),
    (13, '見', 'み', '["かん", "すく", "たく"]'::jsonb),
    (13, '貝', 'かい', '["かべ", "かん", "かね"]'::jsonb),
    (13, '車', 'くるま', '["くるか", "くるん", "しろ"]'::jsonb),
    (14, '村', 'むら', '["さむ", "むさ", "そら"]'::jsonb),
    (14, '男', 'おとこ', '["おんこ", "だんこ", "あんこ"]'::jsonb),
    (14, '町', 'まち', '["みち", "こう", "たん"]'::jsonb),
    (14, '赤', 'あか', '["あかん", "あかだ", "あかす"]'::jsonb),
    (14, '足', 'あし', '["さす", "たび", "まち"]'::jsonb),
    (15, '学', 'まな', '["がくえん", "まなで", "がくん"]'::jsonb),
    (15, '空', 'そら', '["くん", "すら", "かん"]'::jsonb),
    (15, '金', 'かね', '["かん", "きか", "こな"]'::jsonb),
    (15, '雨', 'あめ', '["うえ", "うみ", "あん"]'::jsonb),
    (15, '青', 'あお', '["おう", "しろ", "みどり"]'::jsonb),
    (16, '林', 'はやし', '["はな", "ひろ", "はら"]'::jsonb),
    (16, '校', 'こう', '["さく", "きょう", "かく"]'::jsonb),
    (16, '森', 'もり', '["さく", "きん", "うみ"]'::jsonb),
    (16, '草', 'くさ', '["さく", "すく", "くさく"]'::jsonb),
    (16, '音', 'おと', '["うた", "かね", "あん"]'::jsonb)
) AS v ("level_number", "kanji", "correct_reading", "distractor_readings")
WHERE s."slug" = 'kokugo'
  AND d."skill_type" = 'kanji_yomi'
  AND d."level_number" = v."level_number"
  AND NOT EXISTS (
    SELECT 1 FROM "kanji_questions" k
    WHERE k."level_id" = d."id" AND k."kanji" = v."kanji"
  );
