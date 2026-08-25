-- 髪・ネックレス・トップスと同じ問題がボトムスにもあった。「星のスカート」
-- 「ジョガーパンツ」のように名前が具体的な服の種類を名乗っていても、ティア・色
-- にしか形が反応せず、全部が同じ形（t1は2本足、t2以降はなぜかスカート型）で
-- 描かれていた。src/components/avatar.tsx の BOTTOM_STYLES に13種類の型を
-- 実装したので、asset_refのmotifトークンで選べるようにする。
--
-- 対応表（末尾一致）。プリーツ/チュールはスカートの部分文字列を含むため、
-- 汎用の「スカート」「ズボン/パンツ」判定より先に処理し、汎用側では
-- NOT条件で除外して二重更新（asset_refの2回目の書き換えで色の位置がずれる
-- 事故）を防いでいる:
--   プリーツスカート                          -> pleatskirt
--   チュールスカート                          -> tulleskirt
--   (それ以外の)スカート                      -> skirt
--   迷彩ズボン                                -> camo
--   デニムパンツ                              -> denim
--   カーゴパンツ / サファリパンツ              -> cargo
--   ショートパンツ / ハーフパンツ(0002/0003)   -> shorts
--   キュロット                                -> culotte
--   レギンス                                  -> leggings
--   スポーツパンツ                            -> sport
--   ジョガーパンツ                            -> joggers
--   ワイドパンツ                              -> wide
--   (それ以外の)ズボン/パンツ                  -> pants

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' ' || substring("asset_ref" from '#[0-9a-fA-F]+$')
WHERE "slot_type" = 'bottom';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' pleatskirt ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'プリーツスカート$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' tulleskirt ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'チュールスカート$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' skirt ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'スカート$' AND "name" !~ '(プリーツスカート|チュールスカート)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' camo ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ '迷彩ズボン$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' denim ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'デニムパンツ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' cargo ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ '(カーゴパンツ|サファリパンツ)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' shorts ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ '(ショートパンツ|ハーフパンツ)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' culotte ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'キュロット$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' leggings ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'レギンス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' sport ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'スポーツパンツ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' joggers ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'ジョガーパンツ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' wide ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom' AND "name" ~ 'ワイドパンツ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' pants ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'bottom'
  AND "name" ~ '(ズボン|パンツ)$'
  AND "name" !~ '(迷彩ズボン|デニムパンツ|カーゴパンツ|サファリパンツ|ショートパンツ|ハーフパンツ|スポーツパンツ|ジョガーパンツ|ワイドパンツ)$';
