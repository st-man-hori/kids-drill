-- 着せ替えアイテムのカタログ（docs/game-design.md「着せ替えアバター」）。
--
-- アイテムの追加はこのようなマイグレーションを1本足すだけでよく、コード変更は要らない
-- （解放条件の「種類」を増やすときだけ src/lib/wardrobe.ts に判定を足す）。
--
-- asset_ref は実画像を用意するまでの暫定形式で「バリアント名 色」を入れている。
-- 詳細は src/lib/wardrobe.ts の parseAssetRef を参照。
--
-- price_points が NULL のアイテムは、解放条件を満たした時点で無料でもらえる。
-- 値が入っているものは、条件を満たしたうえでポイントと交換する（docs/data-model.md）。
--
-- 0001と違いこのデータは移行前に手で入れた環境が無いため、存在チェックは付けていない
-- （マイグレーションは台帳で1回しか走らない）。

INSERT INTO "wardrobe_items"
  ("slot_type", "name", "asset_ref", "unlock_condition_type", "unlock_condition_value", "price_points")
VALUES
  -- かみがた
  ('hair', 'ふわふわヘア', 'a #6b4f3f', 'always', '{}'::jsonb, NULL),
  ('hair', 'ぱっつんヘア', 'b #2f2f35', 'total_correct', '{"count":50}'::jsonb, NULL),
  ('hair', 'きんいろヘア', 'c #f2c14e', 'total_correct', '{"count":200}'::jsonb, 400),

  -- トップス
  ('top', 'しろい ティーシャツ', 'a #f8fafc', 'always', '{}'::jsonb, NULL),
  ('top', 'ボーダーシャツ', 'b #4f8ef7', 'total_correct', '{"count":30}'::jsonb, NULL),
  ('top', 'パーカー', 'c #f2775a', 'level_reached', '{"skillType":"add","levelNumber":3}'::jsonb, 300),
  ('top', 'きらきらドレス', 'd #e879c7', 'total_correct', '{"count":300}'::jsonb, 600),

  -- ボトムス
  ('bottom', 'あおい ズボン', 'a #3b6ea5', 'always', '{}'::jsonb, NULL),
  ('bottom', 'スカート', 'b #f2a1c2', 'total_correct', '{"count":30}'::jsonb, NULL),
  ('bottom', 'ハーフパンツ', 'c #7ec4a7', 'level_reached', '{"skillType":"add","levelNumber":5}'::jsonb, 250),

  -- ネックレス
  ('necklace', 'ほしの ネックレス', 'a #ffd166', 'total_correct', '{"count":100}'::jsonb, 350),
  ('necklace', 'にじの ネックレス', 'b #8ec5ff', 'time_attack_score', '{"score":20}'::jsonb, NULL);
