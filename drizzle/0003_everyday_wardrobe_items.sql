-- ポイントで買える「ふだんぎ」のアイテム（docs/game-design.md「入手のしかた」）。
--
-- 0002では、値段が付いたアイテムがすべて解放条件つきだったため、始めたばかりの
-- 子どもにはおみせに買えるものが1つも並ばず、ポイントの使い道が無かった。
-- ここでは条件のゆるい（または無い）有料アイテムを足して、ポイントを貯めれば
-- その日のうちに何か買える状態にする。
--
-- 見た目は意図的に地味なものだけにしてある。目を引くレアなアイテムは、
-- あとから追加したときの驚きのために温存する（追加はマイグレーション1本で済む）。
--
-- 価格の目安: 練習10問で最大150ポイント（10問正解100 + 全問正解ボーナス50）。
--   100〜150 … 1回の練習で買える
--   180〜220 … 2回ぶんくらい

INSERT INTO "wardrobe_items"
  ("slot_type", "name", "asset_ref", "unlock_condition_type", "unlock_condition_value", "price_points")
VALUES
  -- 始めた日から買えるもの
  ('hair', 'あかい ヘア', 'a #d94f4f', 'always', '{}'::jsonb, 120),
  ('hair', 'あおい ヘア', 'b #4f6ed9', 'always', '{}'::jsonb, 120),
  ('top', 'あおい ティーシャツ', 'a #6fa8dc', 'always', '{}'::jsonb, 100),
  ('top', 'きいろい ティーシャツ', 'a #ffd166', 'always', '{}'::jsonb, 100),
  ('bottom', 'くろい ズボン', 'a #3a3f4b', 'always', '{}'::jsonb, 120),
  ('bottom', 'しろい スカート', 'b #f4f4f5', 'always', '{}'::jsonb, 150),

  -- すこし練習すると おみせに並ぶもの
  ('hair', 'ちゃいろ ヘア', 'c #8b5e3c', 'total_correct', '{"count":20}'::jsonb, 180),
  ('top', 'みどりの ボーダーシャツ', 'b #5fbf8f', 'total_correct', '{"count":20}'::jsonb, 180),
  ('top', 'グレーの パーカー', 'c #9aa5b1', 'total_correct', '{"count":60}'::jsonb, 220),
  ('bottom', 'あかい ハーフパンツ', 'c #e06c5a', 'total_correct', '{"count":40}'::jsonb, 180),
  ('necklace', 'あおい ネックレス', 'a #6fa8dc', 'total_correct', '{"count":30}'::jsonb, 200),
  ('necklace', 'みどりの ネックレス', 'b #5fbf8f', 'total_correct', '{"count":80}'::jsonb, 220);
