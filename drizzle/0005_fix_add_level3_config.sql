-- たし算Lv3の出題設定を修正（issue #5）。
--
-- 旧設定 {"minA":10,"maxA":10,...} はaが常に10固定のため、そのレベルの問題が
-- 必ず「10+〇」になってしまっていた（プレイ画面はレベル番号を表示しないため、
-- 体感上「2段階目に上がったレベル」として報告された）。
--
-- 新設定は{"minA":10,"maxA":19,...}。carry:falseなので (a%10)+b<10 が成り立ち、
-- 合計は常に11〜19に収まる（issueコメント「2桁+1桁且つ10-19の間に収まる
-- くらいが難易度的にちょうどよさそう」に対応）。Lv4（11〜19）とほぼ重複する
-- 範囲になるが、Lv4は維持する方針とした（レベル数・既存の到達判定を変えない）。
--
-- config の内容は src/lib/practice.ts の ADD_LEVELS とセットで直すこと
-- （そちらもこのマイグレーションと同時に更新済み）。

UPDATE "difficulty_levels" d
SET "config" = '{"minA":10,"maxA":19,"minB":1,"maxB":9,"carry":false}'::jsonb
FROM "subjects" s
WHERE d."subject_id" = s."id"
  AND s."slug" = 'math'
  AND d."skill_type" = 'add'
  AND d."level_number" = 3;
