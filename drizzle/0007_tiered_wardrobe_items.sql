-- ティア制の新規アイテム群（積極案）。
--
-- 件数:
--   T1 60 / T2 48 / T3 36 / T4 24 / T5 12 / T6 8 （合計188）
--
-- 方針:
-- - 解放条件は total_correct のみを使う（学年をまたいだ運用で調整しやすくする）
-- - T1 -> T6 へ進むほど、解放条件と価格が上がる
-- - 4スロットへ均等配分（1ティア内で かみがた/トップス/ボトムス/ネックレス 同数）
-- - variantは 'tN'（N=ティア番号）に統一。4スロットとも同じ番号なら同じ描き込み段階に
--   なる（src/components/avatar.tsx）。以前の a〜g 混在案は、ネックレスのT5とT6が
--   同じ形（'e'）になってしまうミスを含んでいたため、この形に作り直した
-- - 色はティアごとに用意した少数のパレットから巡回で割り当てる。絵本調の柔らかい
--   トーン（docs/design.md）を基準に、ティアが上がるほど際立つ色にしてある。
--   算術式から直接hexを作る前の実装では、彩度・コントラストが揃わずくすんだ色が
--   混じりうるという問題があった

WITH tier_settings AS (
  SELECT *
  FROM (
    VALUES
      -- tier_no, tier_total, per_slot, unlock_min, unlock_max, price_min, price_max, palette
      (1, 60, 15, 20, 374, 100, 220,
        ARRAY['fcd7c9', 'fde8c8', 'd9f2d1', 'cfeaf5', 'e6d9f7', 'fbdce7', 'f5e6c8', 'd7f0e0']),
      (2, 48, 12, 260, 1200, 240, 420,
        ARRAY['f4a988', 'f7c86b', '8fd39a', '7fc7e0', 'b39ce0', 'f0a3c4', 'e0c15a', '6fb8c9']),
      (3, 36, 9, 900, 3000, 450, 700,
        ARRAY['e8785a', 'e0973a', '4fae6b', '3f9fd6', '8f6bd6', 'd6558f', 'c99a2e', '2f9baa']),
      (4, 24, 6, 2500, 6500, 750, 1100,
        ARRAY['b83a2e', 'c97a1a', '2f7a4e', '2a6fa8', '5a3aa8', 'a8215f', '8a6a1a', '1f6b78']),
      (5, 12, 3, 5500, 11000, 1200, 1800,
        ARRAY['d4af37', '7a1fa8', '1a8f8f', 'c9203e', '1a4fa8']),
      (6, 8, 2, 10000, 18000, 1900, 2800,
        ARRAY['ff3d7f', '2de0c2', '7a2fe0', 'ffb020'])
  ) AS t(
    tier_no,
    tier_total,
    per_slot,
    unlock_min,
    unlock_max,
    price_min,
    price_max,
    palette
  )
),
slot_settings AS (
  SELECT *
  FROM (
    VALUES
      (
        1,
        'hair',
        'かみがた',
        ARRAY[
          'ショートヘア', 'ロングヘア', 'ふわふわヘア', 'スパイキーヘア', 'ツインヘア', 'サイドヘア', 'ウェーブヘア', 'マッシュヘア',
          'おやすみヘア', 'おだんごヘア', 'スポーツヘア', 'くるくるヘア', 'すずかぜヘア', 'オーロラヘア', 'にじいろヘア', 'りゅうせいヘア'
        ]
      ),
      (
        2,
        'top',
        'トップス',
        ARRAY[
          'ティーシャツ', 'パーカー', 'ジャケット', 'キラキラワンピース', 'スポーツベスト', 'チェックシャツ', 'マリンコート', 'ニットベスト',
          'スターケープ', 'めいさいブルゾン', 'フリルブラウス', 'ワンピース', 'デニムジャケット', 'ボーダーカットソー', 'ふわふわコート', 'ほしぞらパーカー'
        ]
      ),
      (
        3,
        'bottom',
        'ボトムス',
        ARRAY[
          'ズボン', '星のスカート', '迷彩ズボン', 'デニムパンツ', 'カーゴパンツ', 'ショートパンツ', 'キュロット', 'レギンス',
          'おやすみパンツ', 'プリーツスカート', 'スポーツパンツ', 'サファリパンツ', 'ジョガーパンツ', 'チュールスカート', 'オーロラパンツ', 'ワイドパンツ'
        ]
      ),
      (
        4,
        'necklace',
        'ネックレス',
        ARRAY[
          'ほしのペンダント', 'ハートペンダント', 'にじのペンダント', 'たからせきネックレス', 'おはなネックレス', 'ちょうネックレス', 'すずらんネックレス', 'マリンネックレス',
          'ほのおネックレス', 'ひょうざんネックレス', 'うちゅうネックレス', 'どうぶつネックレス', 'キャンディネックレス', 'ほんネックレス', 'つきネックレス', 'おんぷネックレス'
        ]
      )
  ) AS s(slot_no, slot_type, slot_label, item_names)
),
seed AS (
  SELECT
    ts.tier_no,
    ts.tier_total,
    ts.unlock_min,
    ts.unlock_max,
    ts.price_min,
    ts.price_max,
    ts.palette,
    ss.slot_no,
    ss.slot_type,
    ss.slot_label,
    ss.item_names,
    gs.idx,
    row_number() OVER (PARTITION BY ts.tier_no ORDER BY ss.slot_no, gs.idx) AS tier_seq,
    row_number() OVER (ORDER BY ts.tier_no, ss.slot_no, gs.idx) AS global_seq
  FROM tier_settings ts
  INNER JOIN slot_settings ss ON TRUE
  INNER JOIN LATERAL generate_series(1, ts.per_slot) AS gs(idx) ON TRUE
)
INSERT INTO "wardrobe_items"
  ("slot_type", "name", "asset_ref", "unlock_condition_type", "unlock_condition_value", "price_points")
SELECT
  slot_type,
  concat(
    (ARRAY['はじめて', 'のびのび', 'わくわく', 'きらめき', 'とっておき', 'とびきり'])[tier_no],
    ' ',
    (ARRAY[
      'クール', 'キュート', 'スポーティ', 'ポップ', 'ナイト', 'がくえん', 'ミュージック', 'スターリー',
      'めいさい', 'マリン', 'スイーツ', 'トロピカル', 'アート', 'ナチュラル', 'ギャラクシー', 'フューチャー'
    ])[1 + ((idx + tier_no + slot_no) % 16)],
    ' ',
    (ARRAY[
      'きらきら', 'ほし', 'にじ', 'はな', 'ひかり', 'とけい', 'しんかんせん', 'うちゅう',
      'どうぶつ', 'キャンディ', 'ひょうざん', 'ほのお', 'くも', 'ふうせん', 'さかな', 'ひみつ'
    ])[1 + (((idx * 3) + tier_no + (slot_no * 2)) % 16)],
    ' ',
    item_names[1 + ((idx + tier_no + (slot_no * 2)) % array_length(item_names, 1))]
  ),
  concat(
    't', tier_no::text,
    ' ',
    '#',
    palette[1 + ((tier_seq - 1) % array_length(palette, 1))]
  ),
  'total_correct',
  jsonb_build_object(
    'count',
    unlock_min + ((tier_seq - 1) * (unlock_max - unlock_min)) / GREATEST(tier_total - 1, 1)
  ),
  price_min + ((tier_seq - 1) * (price_max - price_min)) / GREATEST(tier_total - 1, 1)
FROM seed
ORDER BY tier_no, slot_no, idx;
