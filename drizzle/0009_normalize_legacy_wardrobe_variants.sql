-- 0002/0003で投入した24件はasset_refのバリアントが 'a'/'b'/'c'/'d' のままだった。
-- 0007のティア制リファクタでsrc/components/avatar.tsxの図形テーブルが
-- t1〜t6のみになり、これらは未知のバリアントとしてt1にフォールバック描画
-- されている（renderSlotの `shapes[asset.variant] ?? shapes.t1`）。
--
-- 描画上は既にt1として表示されているので、DB側もその実態に合わせて
-- 'a'/'b'/'c'/'d' を 't1' に書き換える。色（#以降）はそのまま残すので、
-- 見た目の区別は色だけになる。
UPDATE "wardrobe_items"
SET "asset_ref" = 't1 ' || split_part("asset_ref", ' ', 2)
WHERE "asset_ref" !~ '^t[0-9]';
