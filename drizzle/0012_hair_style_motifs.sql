-- ネックレスと同じ問題が髪型にもあった。「ショートヘア」「ツインヘア」のように
-- 名前が具体的な髪型を名乗っていても、以前はティア・色にしか形が反応せず、
-- 全部が同じ丸坊主的シルエットで描かれていた。src/components/avatar.tsx の
-- HAIR_STYLES に10種類の髪型シルエットを実装したので、asset_refのmotifトークンで
-- 選べるようにする（ネックレスと同じ形式。'{variant} {motif} {color}'）。
--
-- 対応表（末尾一致）:
--   ショートヘア                              -> short
--   ロングヘア / おやすみヘア / にじいろヘア   -> long
--   ふわふわヘア / オーロラヘア                -> fluffy
--   スパイキーヘア / りゅうせいヘア            -> spiky
--   ツインヘア                                -> twin
--   サイドヘア / スポーツヘア                  -> side
--   ウェーブヘア / すずかぜヘア                -> wavy
--   マッシュヘア / ぱっつんヘア(0002)          -> mash
--   おだんごヘア                              -> bun
--   くるくるヘア                              -> curly
-- オーロラ/にじいろは名前が色のテーマであって髪型そのものの主張ではないため、
-- 近い印象のシルエット(fluffy/long)を割り当てている。当てはまらない名前
-- （0002/0003の色名のみのもの）はモチーフなし＝現状のfluffy相当のまま

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' ' || substring("asset_ref" from '#[0-9a-fA-F]+$')
WHERE "slot_type" = 'hair';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' short ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ 'ショートヘア$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' long ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(ロングヘア|おやすみヘア|にじいろヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' fluffy ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(ふわふわヘア|オーロラヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' spiky ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(スパイキーヘア|りゅうせいヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' twin ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ 'ツインヘア$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' side ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(サイドヘア|スポーツヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' wavy ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(ウェーブヘア|すずかぜヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' mash ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ '(マッシュヘア|ぱっつんヘア)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' bun ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ 'おだんごヘア$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' curly ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "name" ~ 'くるくるヘア$';
