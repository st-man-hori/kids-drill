-- ネックレスのアイテム名は「ほしのペンダント」「ハートペンダント」のように具体的な
-- モチーフを名乗っているが、これまでasset_refは「バリアント 色」の2トークンしか
-- 持たず、図形はティア・色にしか反応しなかった（例: 「あおい ほしのペンダント」が
-- ただの丸で描かれる）。src/components/avatar.tsx にチャーム形(star/heart/flower/gem、
-- 未指定は丸のまま)を実装したので、名前からモチーフを判定してasset_refに
-- 3トークン目として差し込む（'{variant} {motif} {color}'。src/lib/wardrobe.ts
-- のparseAssetRef参照）。
--
-- 0007/0008の生成名は「ティア接頭語 テーマ語 アクセント語 アイテム名」の順で、
-- テーマ語・アクセント語は4スロット共通の語彙から取られるため、名前の末尾
-- （実際のアイテム種別）だけを見て判定する。例えば「きらめき アート どうぶつ
-- ほしのペンダント」はアクセント語に「どうぶつ」を含むが、末尾は「ほしのペンダント」
-- なのでstarに分類する。
--
-- どのモチーフにも当てはまらない名前（マリン/どうぶつ/キャンディ/ほん/おんぷ、
-- および0002の色名のみのもの）は変更しない＝丸のまま。「数種類」に絞る方針
-- （docs/data-model.md）で、全16種類のモチーフに専用形を作るのではなく近い
-- ものへ寄せている。

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' star ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace'
  AND "name" ~ '(ほしのペンダント|うちゅうネックレス|つきネックレス|ほのおネックレス|ほしの ネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' heart ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace'
  AND "name" ~ 'ハートペンダント$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' flower ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace'
  AND "name" ~ '(おはなネックレス|すずらんネックレス|ちょうネックレス)$';

UPDATE "wardrobe_items"
SET "asset_ref" = split_part("asset_ref", ' ', 1) || ' gem ' || split_part("asset_ref", ' ', 2)
WHERE "slot_type" = 'necklace'
  AND "name" ~ '(たからせきネックレス|ひょうざんネックレス|にじのペンダント|にじの ネックレス)$';
