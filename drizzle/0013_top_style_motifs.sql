-- 髪・ネックレスと同じ問題がトップスにもあった。「パーカー」「スターケープ」の
-- ように名前が具体的な服の種類を名乗っていても、ティア・色にしか形が反応せず、
-- 全部が同じ丸角長方形で描かれていた。src/components/avatar.tsx の TOP_STYLES に
-- 9種類のシルエット(tee/hoodie/jacket/dress/vest/shirt/coat/cape/blouse)を
-- 実装したので、asset_refのmotifトークンで選べるようにする。
--
-- 対応表（末尾一致）:
--   ティーシャツ / ボーダーカットソー / ボーダーシャツ(0002)  -> tee
--   パーカー                                                -> hoodie
--   ジャケット / めいさいブルゾン                            -> jacket
--   キラキラワンピース / ワンピース / きらきらドレス(0002)   -> dress
--   スポーツベスト / ニットベスト                            -> vest
--   チェックシャツ                                          -> shirt
--   マリンコート / ふわふわコート                            -> coat
--   スターケープ                                            -> cape
--   フリルブラウス                                          -> blouse
-- デニムジャケットは名前にも「ジャケット」を含むためjacketに合致する。
-- 全67件がいずれかに一致し、モチーフなしのまま残る名前はない

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' ' || substring("asset_ref" from '#[0-9a-fA-F]+$')
WHERE "slot_type" = 'top';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' tee ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ '(ティーシャツ|ボーダーカットソー|ボーダーシャツ)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' hoodie ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ 'パーカー$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' jacket ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ '(ジャケット|めいさいブルゾン)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' dress ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ '(キラキラワンピース|ワンピース|きらきらドレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' vest ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ '(スポーツベスト|ニットベスト)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' shirt ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ 'チェックシャツ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' coat ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ '(マリンコート|ふわふわコート)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' cape ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ 'スターケープ$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' blouse ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'top' AND "name" ~ 'フリルブラウス$';
