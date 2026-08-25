-- 0007でT1〜T6の188件を追加した際、生成のしやすさを優先して解放条件を
-- total_correctだけに統一してしまい、「ポイントだけ貯めればその場で買える」
-- アイテムが新規分にゼロになっていた。これは0003が一度直した問題
-- （0002ではすべての有料アイテムに条件がついていて、始めたばかりの子が
-- ポイントを貯めても店に何も並んでいなかった）の再発にあたる。
--
-- ここでは0003と同じ考え方で、unlock_condition_type='always'（条件なし）
-- のアイテムを4スロットへ12件ずつ、計48件追加する。見た目は他のalways
-- アイテムと揃えてt1（ベーシック）のみにし、地味さを保つ。価格帯も0003を
-- 踏襲して100〜220（1〜2回の練習で買える範囲）にしている。

INSERT INTO "wardrobe_items"
  ("slot_type", "name", "asset_ref", "unlock_condition_type", "unlock_condition_value", "price_points")
VALUES
  -- かみがた
  ('hair', 'あかい ショートヘア', 't1 #d9584f', 'always', '{}'::jsonb, 100),
  ('hair', 'あおい ロングヘア', 't1 #4f6ed9', 'always', '{}'::jsonb, 110),
  ('hair', 'きいろい ふわふわヘア', 't1 #f2c14e', 'always', '{}'::jsonb, 120),
  ('hair', 'みどりの スパイキーヘア', 't1 #5fbf8f', 'always', '{}'::jsonb, 130),
  ('hair', 'むらさきの ツインヘア', 't1 #9b6fd9', 'always', '{}'::jsonb, 140),
  ('hair', 'ピンクの サイドヘア', 't1 #e879c7', 'always', '{}'::jsonb, 150),
  ('hair', 'みずいろの ウェーブヘア', 't1 #6fc7e0', 'always', '{}'::jsonb, 160),
  ('hair', 'ちゃいろの マッシュヘア', 't1 #8b5e3c', 'always', '{}'::jsonb, 175),
  ('hair', 'くろい おだんごヘア', 't1 #3a3f4b', 'always', '{}'::jsonb, 190),
  ('hair', 'しろい くるくるヘア', 't1 #f4f4f5', 'always', '{}'::jsonb, 200),
  ('hair', 'はいいろの すずかぜヘア', 't1 #9aa5b1', 'always', '{}'::jsonb, 210),
  ('hair', 'オレンジの おやすみヘア', 't1 #f2905a', 'always', '{}'::jsonb, 220),

  -- トップス
  ('top', 'あかい ティーシャツ', 't1 #d9584f', 'always', '{}'::jsonb, 100),
  ('top', 'あおい パーカー', 't1 #4f6ed9', 'always', '{}'::jsonb, 110),
  ('top', 'きいろい ジャケット', 't1 #f2c14e', 'always', '{}'::jsonb, 120),
  ('top', 'みどりの スポーツベスト', 't1 #5fbf8f', 'always', '{}'::jsonb, 130),
  ('top', 'むらさきの チェックシャツ', 't1 #9b6fd9', 'always', '{}'::jsonb, 140),
  ('top', 'ピンクの ニットベスト', 't1 #e879c7', 'always', '{}'::jsonb, 150),
  ('top', 'みずいろの ボーダーカットソー', 't1 #6fc7e0', 'always', '{}'::jsonb, 160),
  ('top', 'ちゃいろの ワンピース', 't1 #8b5e3c', 'always', '{}'::jsonb, 175),
  ('top', 'くろい デニムジャケット', 't1 #3a3f4b', 'always', '{}'::jsonb, 190),
  ('top', 'しろい フリルブラウス', 't1 #f4f4f5', 'always', '{}'::jsonb, 200),
  ('top', 'はいいろの マリンコート', 't1 #9aa5b1', 'always', '{}'::jsonb, 210),
  ('top', 'オレンジの ふわふわコート', 't1 #f2905a', 'always', '{}'::jsonb, 220),

  -- ボトムス
  ('bottom', 'あかい ズボン', 't1 #d9584f', 'always', '{}'::jsonb, 100),
  ('bottom', 'あおい デニムパンツ', 't1 #4f6ed9', 'always', '{}'::jsonb, 110),
  ('bottom', 'きいろい カーゴパンツ', 't1 #f2c14e', 'always', '{}'::jsonb, 120),
  ('bottom', 'みどりの ショートパンツ', 't1 #5fbf8f', 'always', '{}'::jsonb, 130),
  ('bottom', 'むらさきの キュロット', 't1 #9b6fd9', 'always', '{}'::jsonb, 140),
  ('bottom', 'ピンクの レギンス', 't1 #e879c7', 'always', '{}'::jsonb, 150),
  ('bottom', 'みずいろの ジョガーパンツ', 't1 #6fc7e0', 'always', '{}'::jsonb, 160),
  ('bottom', 'ちゃいろの ワイドパンツ', 't1 #8b5e3c', 'always', '{}'::jsonb, 175),
  ('bottom', 'くろい プリーツスカート', 't1 #3a3f4b', 'always', '{}'::jsonb, 190),
  ('bottom', 'しろい チュールスカート', 't1 #f4f4f5', 'always', '{}'::jsonb, 200),
  ('bottom', 'はいいろの サファリパンツ', 't1 #9aa5b1', 'always', '{}'::jsonb, 210),
  ('bottom', 'オレンジの スポーツパンツ', 't1 #f2905a', 'always', '{}'::jsonb, 220),

  -- ネックレス
  ('necklace', 'あかい ハートペンダント', 't1 #d9584f', 'always', '{}'::jsonb, 100),
  ('necklace', 'あおい ほしのペンダント', 't1 #4f6ed9', 'always', '{}'::jsonb, 110),
  ('necklace', 'きいろい にじのペンダント', 't1 #f2c14e', 'always', '{}'::jsonb, 120),
  ('necklace', 'みどりの たからせきネックレス', 't1 #5fbf8f', 'always', '{}'::jsonb, 130),
  ('necklace', 'むらさきの マリンネックレス', 't1 #9b6fd9', 'always', '{}'::jsonb, 140),
  ('necklace', 'ピンクの キャンディネックレス', 't1 #e879c7', 'always', '{}'::jsonb, 150),
  ('necklace', 'みずいろの どうぶつネックレス', 't1 #6fc7e0', 'always', '{}'::jsonb, 160),
  ('necklace', 'ちゃいろの ひょうざんネックレス', 't1 #8b5e3c', 'always', '{}'::jsonb, 175),
  ('necklace', 'くろい おはなネックレス', 't1 #3a3f4b', 'always', '{}'::jsonb, 190),
  ('necklace', 'しろい ちょうネックレス', 't1 #f4f4f5', 'always', '{}'::jsonb, 200),
  ('necklace', 'はいいろの すずらんネックレス', 't1 #9aa5b1', 'always', '{}'::jsonb, 210),
  ('necklace', 'オレンジの つきネックレス', 't1 #f2905a', 'always', '{}'::jsonb, 220);
