-- Custom SQL migration file, put your code below! --

-- 0012でモチーフ付けをした際、色名のみの0002/0003由来4件
-- (あかいヘア/あおいヘア/きんいろヘア/ちゃいろヘア)は名前から髪型を
-- 判断できずモチーフなし(=fluffy相当のアフロ状シルエット)のままにして
-- いた。実機フィードバックで「丸っこい形の髪型はあまり可愛くない」と
-- 指摘され、fluffyの丸3つ重ねはオーロラヘア等の意図的な演出であって
-- 色名だけのふつうの髪にはそぐわないと判断。最もくせのない
-- short(耳の少し下までのドーム、HAIR_CAP_D)を割り当てる
UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' short ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'hair' AND "asset_ref" !~ '^t[0-9]+ [a-z]+ ';