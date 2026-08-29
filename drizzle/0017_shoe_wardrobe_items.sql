-- Custom SQL migration file, put your code below! --

-- シューズ(shoes)スロットの新規追加。docs/data-model.md の想定どおり
-- slot_typeはレコード追加だけで拡張できる設計のため、コード側の変更
-- （src/lib/wardrobe.ts の SLOT_TYPES 等、src/components/avatar.tsx の
-- SHOE描画）とあわせて、このマイグレーションでアイテム本体を追加する。
--
-- 件数・価格帯・解放条件の設計は、既存のトップス/ボトムスと同じ考え方を踏襲:
--   0002相当(はじめから触れる基本形): 3件
--   0003相当(ふだんぎ・ポイントだけで買える普段着): 3件
--   0008相当(always・t1のみの地味な12色): 12件
--   0007相当(T1〜T6のティア制バッチ、15/12/9/6/3/2=47件)
--   合計65件（ボトムスの既存件数と同数）
--
-- asset_ref は "tN <モチーフ> #色" の形式（src/lib/wardrobe.ts の parseAssetRef）。
-- モチーフはあとから retrofit する0012〜0014のような追加マイグレーションを
-- 要らないよう、最初からすべての行に埋め込んでいる
-- （モチーフ一覧: sneaker/hightop/boots/rainboots/sandals/maryjane/slipon/sports/winter。
--   src/components/avatar.tsx の SHOE_STYLES 参照）。

INSERT INTO "wardrobe_items"
  ("slot_type", "name", "asset_ref", "unlock_condition_type", "unlock_condition_value", "price_points")
VALUES
  -- はじめから触れる基本形（0002相当）
  ('shoes', 'あおい スニーカー', 't1 sneaker #3b6ea5', 'always', '{}'::jsonb, NULL),
  ('shoes', 'ピンクの サンダル', 't1 sandals #f2a1c2', 'total_correct', '{"count":30}'::jsonb, NULL),
  ('shoes', 'みどりの ハイカットスニーカー', 't1 hightop #7ec4a7', 'level_reached', '{"skillType":"add","levelNumber":5}'::jsonb, 250),

  -- ふだんぎ（0003相当・ポイントだけで買える）
  ('shoes', 'くろい スニーカー', 't1 sneaker #3a3f4b', 'always', '{}'::jsonb, 120),
  ('shoes', 'しろい バレエシューズ', 't1 slipon #f4f4f5', 'always', '{}'::jsonb, 150),
  ('shoes', 'あかい ハイカットスニーカー', 't1 hightop #e06c5a', 'total_correct', '{"count":40}'::jsonb, 180),

  -- 条件なし・t1のみの地味な12色（0008相当）
  ('shoes', 'あかい スニーカー', 't1 sneaker #d9584f', 'always', '{}'::jsonb, 100),
  ('shoes', 'あおい ブーツ', 't1 boots #4f6ed9', 'always', '{}'::jsonb, 110),
  ('shoes', 'きいろい サンダル', 't1 sandals #f2c14e', 'always', '{}'::jsonb, 120),
  ('shoes', 'みどりの ながぐつ', 't1 rainboots #5fbf8f', 'always', '{}'::jsonb, 130),
  ('shoes', 'むらさきの ストラップシューズ', 't1 maryjane #9b6fd9', 'always', '{}'::jsonb, 140),
  ('shoes', 'ピンクの バレエシューズ', 't1 slipon #e879c7', 'always', '{}'::jsonb, 150),
  ('shoes', 'みずいろの うんどうぐつ', 't1 sports #6fc7e0', 'always', '{}'::jsonb, 160),
  ('shoes', 'ちゃいろの もこもこブーツ', 't1 winter #8b5e3c', 'always', '{}'::jsonb, 175),
  ('shoes', 'くろい ハイカットスニーカー', 't1 hightop #3a3f4b', 'always', '{}'::jsonb, 190),
  ('shoes', 'しろい スニーカー', 't1 sneaker #f4f4f5', 'always', '{}'::jsonb, 200),
  ('shoes', 'はいいろの ブーツ', 't1 boots #9aa5b1', 'always', '{}'::jsonb, 210),
  ('shoes', 'オレンジの サンダル', 't1 sandals #f2905a', 'always', '{}'::jsonb, 220),

  -- T1〜T6のティア制バッチ（0007相当。15/12/9/6/3/2=47件）
  -- T1
  ('shoes', 'はじめて スポーティ ひかり ながぐつ', 't1 rainboots #fcd7c9', 'total_correct', '{"count":20}'::jsonb, 100),
  ('shoes', 'はじめて ポップ うちゅう サンダル', 't1 sandals #fde8c8', 'total_correct', '{"count":45}'::jsonb, 108),
  ('shoes', 'はじめて ナイト ひょうざん ストラップシューズ', 't1 maryjane #d9f2d1', 'total_correct', '{"count":70}'::jsonb, 117),
  ('shoes', 'はじめて がくえん ふうせん バレエシューズ', 't1 slipon #cfeaf5', 'total_correct', '{"count":95}'::jsonb, 125),
  ('shoes', 'はじめて ミュージック きらきら うんどうぐつ', 't1 sports #e6d9f7', 'total_correct', '{"count":121}'::jsonb, 134),
  ('shoes', 'はじめて スターリー はな もこもこブーツ', 't1 winter #fbdce7', 'total_correct', '{"count":146}'::jsonb, 142),
  ('shoes', 'はじめて めいさい しんかんせん スニーカー', 't1 sneaker #f5e6c8', 'total_correct', '{"count":171}'::jsonb, 151),
  ('shoes', 'はじめて マリン キャンディ ハイカットスニーカー', 't1 hightop #d7f0e0', 'total_correct', '{"count":197}'::jsonb, 160),
  ('shoes', 'はじめて スイーツ くも ブーツ', 't1 boots #fcd7c9', 'total_correct', '{"count":222}'::jsonb, 168),
  ('shoes', 'はじめて トロピカル ひみつ ながぐつ', 't1 rainboots #fde8c8', 'total_correct', '{"count":247}'::jsonb, 177),
  ('shoes', 'はじめて アート にじ サンダル', 't1 sandals #d9f2d1', 'total_correct', '{"count":272}'::jsonb, 185),
  ('shoes', 'はじめて ナチュラル とけい ストラップシューズ', 't1 maryjane #cfeaf5', 'total_correct', '{"count":298}'::jsonb, 194),
  ('shoes', 'はじめて ギャラクシー どうぶつ バレエシューズ', 't1 slipon #e6d9f7', 'total_correct', '{"count":323}'::jsonb, 202),
  ('shoes', 'はじめて フューチャー ほのお うんどうぐつ', 't1 sports #fbdce7', 'total_correct', '{"count":348}'::jsonb, 211),
  ('shoes', 'はじめて クール さかな もこもこブーツ', 't1 winter #f5e6c8', 'total_correct', '{"count":374}'::jsonb, 220),

  -- T2
  ('shoes', 'のびのび ポップ とけい ストラップシューズ', 't2 maryjane #f4a988', 'total_correct', '{"count":260}'::jsonb, 240),
  ('shoes', 'のびのび ナイト どうぶつ バレエシューズ', 't2 slipon #f7c86b', 'total_correct', '{"count":345}'::jsonb, 256),
  ('shoes', 'のびのび がくえん ほのお うんどうぐつ', 't2 sports #8fd39a', 'total_correct', '{"count":430}'::jsonb, 272),
  ('shoes', 'のびのび ミュージック さかな もこもこブーツ', 't2 winter #7fc7e0', 'total_correct', '{"count":516}'::jsonb, 289),
  ('shoes', 'のびのび スターリー ほし スニーカー', 't2 sneaker #b39ce0', 'total_correct', '{"count":601}'::jsonb, 305),
  ('shoes', 'のびのび めいさい ひかり ハイカットスニーカー', 't2 hightop #f0a3c4', 'total_correct', '{"count":687}'::jsonb, 321),
  ('shoes', 'のびのび マリン うちゅう ブーツ', 't2 boots #e0c15a', 'total_correct', '{"count":772}'::jsonb, 338),
  ('shoes', 'のびのび スイーツ ひょうざん ながぐつ', 't2 rainboots #6fb8c9', 'total_correct', '{"count":858}'::jsonb, 354),
  ('shoes', 'のびのび トロピカル ふうせん サンダル', 't2 sandals #f4a988', 'total_correct', '{"count":943}'::jsonb, 370),
  ('shoes', 'のびのび アート きらきら ストラップシューズ', 't2 maryjane #f7c86b', 'total_correct', '{"count":1029}'::jsonb, 387),
  ('shoes', 'のびのび ナチュラル はな バレエシューズ', 't2 slipon #8fd39a', 'total_correct', '{"count":1114}'::jsonb, 403),
  ('shoes', 'のびのび ギャラクシー しんかんせん うんどうぐつ', 't2 sports #7fc7e0', 'total_correct', '{"count":1200}'::jsonb, 420),

  -- T3
  ('shoes', 'わくわく ナイト しんかんせん うんどうぐつ', 't3 sports #e8785a', 'total_correct', '{"count":900}'::jsonb, 450),
  ('shoes', 'わくわく がくえん キャンディ もこもこブーツ', 't3 winter #e0973a', 'total_correct', '{"count":1162}'::jsonb, 481),
  ('shoes', 'わくわく ミュージック くも スニーカー', 't3 sneaker #4fae6b', 'total_correct', '{"count":1425}'::jsonb, 512),
  ('shoes', 'わくわく スターリー ひみつ ハイカットスニーカー', 't3 hightop #3f9fd6', 'total_correct', '{"count":1687}'::jsonb, 543),
  ('shoes', 'わくわく めいさい にじ ブーツ', 't3 boots #8f6bd6', 'total_correct', '{"count":1950}'::jsonb, 575),
  ('shoes', 'わくわく マリン とけい ながぐつ', 't3 rainboots #d6558f', 'total_correct', '{"count":2212}'::jsonb, 606),
  ('shoes', 'わくわく スイーツ どうぶつ サンダル', 't3 sandals #c99a2e', 'total_correct', '{"count":2475}'::jsonb, 637),
  ('shoes', 'わくわく トロピカル ほのお ストラップシューズ', 't3 maryjane #2f9baa', 'total_correct', '{"count":2737}'::jsonb, 668),
  ('shoes', 'わくわく アート さかな バレエシューズ', 't3 slipon #e8785a', 'total_correct', '{"count":3000}'::jsonb, 700),

  -- T4
  ('shoes', 'きらめき がくえん うちゅう スニーカー', 't4 sneaker #b83a2e', 'total_correct', '{"count":2500}'::jsonb, 750),
  ('shoes', 'きらめき ミュージック ひょうざん ハイカットスニーカー', 't4 hightop #c97a1a', 'total_correct', '{"count":3300}'::jsonb, 820),
  ('shoes', 'きらめき スターリー ふうせん ブーツ', 't4 boots #2f7a4e', 'total_correct', '{"count":4100}'::jsonb, 890),
  ('shoes', 'きらめき めいさい きらきら ながぐつ', 't4 rainboots #2a6fa8', 'total_correct', '{"count":4900}'::jsonb, 960),
  ('shoes', 'きらめき マリン はな サンダル', 't4 sandals #5a3aa8', 'total_correct', '{"count":5700}'::jsonb, 1030),
  ('shoes', 'きらめき スイーツ しんかんせん ストラップシューズ', 't4 maryjane #a8215f', 'total_correct', '{"count":6500}'::jsonb, 1100),

  -- T5
  ('shoes', 'とっておき ミュージック どうぶつ ブーツ', 't5 boots #d4af37', 'total_correct', '{"count":5500}'::jsonb, 1200),
  ('shoes', 'とっておき スターリー ほのお ながぐつ', 't5 rainboots #7a1fa8', 'total_correct', '{"count":8250}'::jsonb, 1500),
  ('shoes', 'とっておき めいさい さかな サンダル', 't5 sandals #1a8f8f', 'total_correct', '{"count":11000}'::jsonb, 1800),

  -- T6
  ('shoes', 'とびきり スターリー キャンディ サンダル', 't6 sandals #ff3d7f', 'total_correct', '{"count":10000}'::jsonb, 1900),
  ('shoes', 'とびきり めいさい くも ストラップシューズ', 't6 maryjane #2de0c2', 'total_correct', '{"count":18000}'::jsonb, 2800);
