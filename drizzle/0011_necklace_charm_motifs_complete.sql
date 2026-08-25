-- 0010では16種類の名前を「近いモチーフへ寄せる」形でstar/heart/flower/gemの
-- 4種類に丸めていたが、「つきのペンダントが星に見える」という指摘の通り、
-- 丸め方が雑だった（つき→star、うちゅう→star、ほのお→star、ちょう→flowerに
-- 丸められていた）。src/components/avatar.tsx の Charm に
-- moon/butterfly/rainbow/flame/planet/paw/candy/book/note/anchor の10種を
-- 追加実装したので、16種類の名前すべてに専用モチーフを1対1で割り当て直す。
--
-- まず全necklace行のasset_refを「バリアント 色」の2トークンに戻してから
-- （0010が既にmotifを差し込んでいる行があるため）、名前の末尾で判定して
-- 3トークン目にモチーフを入れ直す。
--
-- 最終的な対応表（末尾一致・4スロット共通のテーマ語/アクセント語は無視）:
--   ほしのペンダント / ほしの ネックレス       -> star
--   ハートペンダント                          -> heart
--   にじのペンダント / にじの ネックレス       -> rainbow
--   たからせきネックレス                      -> gem
--   おはなネックレス                          -> flower
--   すずらんネックレス                        -> flower  (すずらん=すずらんの花なので同じ族でよい)
--   ちょうネックレス                          -> butterfly
--   マリンネックレス                          -> anchor
--   ほのおネックレス                          -> flame
--   ひょうざんネックレス                      -> gem     (氷の結晶=faceted gemと同じ族でよい)
--   うちゅうネックレス                        -> planet
--   どうぶつネックレス                        -> paw
--   キャンディネックレス                      -> candy
--   ほんネックレス                            -> book
--   つきネックレス                            -> moon
--   おんぷネックレス                          -> note
-- 上記に当てはまらない名前（0002の色名のみのもの）はモチーフなし＝丸のまま

-- 1. 一旦「バリアント 色」の2トークンに正規化する
UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' ' || substring("asset_ref" from '#[0-9a-fA-F]+$')
WHERE "slot_type" = 'necklace';

-- 2. 名前の末尾でモチーフを判定し、3トークン目として差し込む
UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' star ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ '(ほしのペンダント|ほしの ネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' heart ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'ハートペンダント$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' rainbow ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ '(にじのペンダント|にじの ネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' gem ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ '(たからせきネックレス|ひょうざんネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' flower ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ '(おはなネックレス|すずらんネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' butterfly ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'ちょうネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' anchor ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'マリンネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' flame ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'ほのおネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' planet ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'うちゅうネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' paw ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'どうぶつネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' candy ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'キャンディネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' book ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'ほんネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' moon ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'つきネックレス$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' note ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace' AND "name" ~ 'おんぷネックレス$';
