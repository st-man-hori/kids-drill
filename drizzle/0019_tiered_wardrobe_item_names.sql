-- Custom SQL migration file, put your code below! --

-- 0018でシューズのT1〜T6アイテム名を直したのと同じ理由で、0007由来の
-- かみがた・トップス・ボトムス・ネックレスの188件（4スロット×47件）も
-- 同じ名前生成パターン(ティア語+ランダム形容詞+ランダム名詞+モチーフ名)を
-- 使っており、モチーフ名以外の2語(がくえん/ほのお等)が実際の見た目と
-- 無関係な飾り言葉になっていた（フィードバック。例:
-- 「のびのび がくえん ほのお うんどうぐつ」）。
--
-- 0018と同じ考え方で、各スロットの実装(HAIR_STYLES/TOP_STYLES/
-- BOTTOM_STYLES/Charm、いずれもsrc/components/avatar.tsx)にある
-- モチーフの実名と、asset_refの色(0007と共通の6ティアパレット)、
-- ティア別の実際の演出(t2=グラデーションのつや/t3=ハイライトの
-- てかり/t4=玉飾り/t5=明滅するグロー/t6=バッジ+ういているきらきら。
-- ネックレスのt6だけ「星」ではなく同じモチーフの金ミニチャームなので
-- 「きらきらの」と表現を変える)だけで名前を組み立て直す。
--
-- asset_refの2番目のトークン(モチーフ)は0012〜0014のリトロフィット後の
-- 実際の値をそのまま使っている(0007が生成した時点のasset_refとは
-- 一致しない場合がある)。過去のマイグレーションは書き換えず、
-- 新しいマイグレーションで補正する方針は0009/0012〜0014/0016/0018と同じ。
--
-- 3件だけ、同じスロット内で(ティア,モチーフ,色)が完全に一致する別レコード
-- が存在し、新しい名前も同じ文字列になる(例: bottom「ベージュの ズボン」)。
-- これは見た目が本当に同一の2アイテムが別価格で存在していた元データの
-- 状態がそのまま見えるようになっただけで、今回の書き換えが原因ではない


  -- bottom
  -- T1
  UPDATE "wardrobe_items" SET "name" = 'ベージュの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて がくえん ひょうざん おやすみパンツ' AND "asset_ref" = 't1 pants #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの プリーツスカート' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて ミュージック ふうせん プリーツスカート' AND "asset_ref" = 't1 pleatskirt #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの スポーツパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて スターリー きらきら スポーツパンツ' AND "asset_ref" = 't1 sport #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて めいさい はな サファリパンツ' AND "asset_ref" = 't1 cargo #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの ジョガーパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて マリン しんかんせん ジョガーパンツ' AND "asset_ref" = 't1 joggers #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて スイーツ キャンディ チュールスカート' AND "asset_ref" = 't1 tulleskirt #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて トロピカル くも オーロラパンツ' AND "asset_ref" = 't1 pants #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの ワイドパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて アート ひみつ ワイドパンツ' AND "asset_ref" = 't1 wide #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて ナチュラル にじ ズボン' AND "asset_ref" = 't1 pants #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの スカート' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて ギャラクシー とけい 星のスカート' AND "asset_ref" = 't1 skirt #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの めいさいズボン' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて フューチャー どうぶつ 迷彩ズボン' AND "asset_ref" = 't1 camo #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの デニムパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて クール ほのお デニムパンツ' AND "asset_ref" = 't1 denim #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて キュート さかな カーゴパンツ' AND "asset_ref" = 't1 cargo #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ショートパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて スポーティ ほし ショートパンツ' AND "asset_ref" = 't1 shorts #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの キュロット' WHERE "slot_type" = 'bottom' AND "name" = 'はじめて ポップ ひかり キュロット' AND "asset_ref" = 't1 culotte #e6d9f7';
  -- T2
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの プリーツスカート' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび ミュージック ほのお プリーツスカート' AND "asset_ref" = 't2 pleatskirt #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの スポーツパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび スターリー さかな スポーツパンツ' AND "asset_ref" = 't2 sport #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび めいさい ほし サファリパンツ' AND "asset_ref" = 't2 cargo #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの ジョガーパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび マリン ひかり ジョガーパンツ' AND "asset_ref" = 't2 joggers #7fc7e0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび スイーツ うちゅう チュールスカート' AND "asset_ref" = 't2 tulleskirt #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび トロピカル ひょうざん オーロラパンツ' AND "asset_ref" = 't2 pants #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの ワイドパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび アート ふうせん ワイドパンツ' AND "asset_ref" = 't2 wide #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび ナチュラル きらきら ズボン' AND "asset_ref" = 't2 pants #6fb8c9';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの スカート' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび ギャラクシー はな 星のスカート' AND "asset_ref" = 't2 skirt #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの めいさいズボン' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび フューチャー しんかんせん 迷彩ズボン' AND "asset_ref" = 't2 camo #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの デニムパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび クール キャンディ デニムパンツ' AND "asset_ref" = 't2 denim #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'のびのび キュート くも カーゴパンツ' AND "asset_ref" = 't2 cargo #7fc7e0';
  -- T3
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの スポーツパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく スターリー くも スポーツパンツ' AND "asset_ref" = 't3 sport #4fae6b';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく めいさい ひみつ サファリパンツ' AND "asset_ref" = 't3 cargo #3f9fd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいむらさきの ジョガーパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく マリン にじ ジョガーパンツ' AND "asset_ref" = 't3 joggers #8f6bd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいピンクの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく スイーツ とけい チュールスカート' AND "asset_ref" = 't3 tulleskirt #d6558f';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの きんちゃいろの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく トロピカル どうぶつ オーロラパンツ' AND "asset_ref" = 't3 pants #c99a2e';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおみどりの ワイドパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく アート ほのお ワイドパンツ' AND "asset_ref" = 't3 wide #2f9baa';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく ナチュラル さかな ズボン' AND "asset_ref" = 't3 pants #e8785a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの スカート' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく ギャラクシー ほし 星のスカート' AND "asset_ref" = 't3 skirt #e0973a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの めいさいズボン' WHERE "slot_type" = 'bottom' AND "name" = 'わくわく フューチャー ひかり 迷彩ズボン' AND "asset_ref" = 't3 camo #4fae6b';
  -- T4
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいむらさきの カーゴパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき めいさい ふうせん サファリパンツ' AND "asset_ref" = 't4 cargo #5a3aa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの ワインいろの ジョガーパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき マリン きらきら ジョガーパンツ' AND "asset_ref" = 't4 joggers #a8215f';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こがねちゃいろの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき スイーツ はな チュールスカート' AND "asset_ref" = 't4 tulleskirt #8a6a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおみどりの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき トロピカル しんかんせん オーロラパンツ' AND "asset_ref" = 't4 pants #1f6b78';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあかの ワイドパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき アート キャンディ ワイドパンツ' AND "asset_ref" = 't4 wide #b83a2e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こげちゃいろの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'きらめき ナチュラル くも ズボン' AND "asset_ref" = 't4 pants #c97a1a';
  -- T5
  UPDATE "wardrobe_items" SET "name" = 'ひかる ぶどういろの ジョガーパンツ' WHERE "slot_type" = 'bottom' AND "name" = 'とっておき マリン さかな ジョガーパンツ' AND "asset_ref" = 't5 joggers #7a1fa8';
  UPDATE "wardrobe_items" SET "name" = 'ひかる くじゃくいろの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'とっておき スイーツ ほし チュールスカート' AND "asset_ref" = 't5 tulleskirt #1a8f8f';
  UPDATE "wardrobe_items" SET "name" = 'ひかる こいあかの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'とっておき トロピカル ひかり オーロラパンツ' AND "asset_ref" = 't5 pants #c9203e';
  -- T6
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ネオンピンクの チュールスカート' WHERE "slot_type" = 'bottom' AND "name" = 'とびきり スイーツ ひみつ チュールスカート' AND "asset_ref" = 't6 tulleskirt #ff3d7f';
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ターコイズいろの ズボン' WHERE "slot_type" = 'bottom' AND "name" = 'とびきり トロピカル にじ オーロラパンツ' AND "asset_ref" = 't6 pants #2de0c2';

  -- hair
  -- T1
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ツインヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて ポップ しんかんせん ツインヘア' AND "asset_ref" = 't1 twin #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて ナイト キャンディ サイドヘア' AND "asset_ref" = 't1 side #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて がくえん くも ウェーブヘア' AND "asset_ref" = 't1 wavy #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの マッシュヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて ミュージック ひみつ マッシュヘア' AND "asset_ref" = 't1 mash #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて スターリー にじ おやすみヘア' AND "asset_ref" = 't1 long #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて めいさい とけい おだんごヘア' AND "asset_ref" = 't1 bun #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて マリン どうぶつ スポーツヘア' AND "asset_ref" = 't1 side #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの くるくるヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて スイーツ ほのお くるくるヘア' AND "asset_ref" = 't1 curly #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて トロピカル さかな すずかぜヘア' AND "asset_ref" = 't1 wavy #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの ふわふわヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて アート ほし オーロラヘア' AND "asset_ref" = 't1 fluffy #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて ナチュラル ひかり にじいろヘア' AND "asset_ref" = 't1 long #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの スパイキーヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて ギャラクシー うちゅう りゅうせいヘア' AND "asset_ref" = 't1 spiky #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ショートヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて フューチャー ひょうざん ショートヘア' AND "asset_ref" = 't1 short #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて クール ふうせん ロングヘア' AND "asset_ref" = 't1 long #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの ふわふわヘア' WHERE "slot_type" = 'hair' AND "name" = 'はじめて キュート きらきら ふわふわヘア' AND "asset_ref" = 't1 fluffy #f5e6c8';
  -- T2
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび ナイト うちゅう サイドヘア' AND "asset_ref" = 't2 side #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび がくえん ひょうざん ウェーブヘア' AND "asset_ref" = 't2 wavy #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの マッシュヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび ミュージック ふうせん マッシュヘア' AND "asset_ref" = 't2 mash #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび スターリー きらきら おやすみヘア' AND "asset_ref" = 't2 long #7fc7e0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび めいさい はな おだんごヘア' AND "asset_ref" = 't2 bun #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび マリン しんかんせん スポーツヘア' AND "asset_ref" = 't2 side #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの くるくるヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび スイーツ キャンディ くるくるヘア' AND "asset_ref" = 't2 curly #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび トロピカル くも すずかぜヘア' AND "asset_ref" = 't2 wavy #6fb8c9';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの ふわふわヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび アート ひみつ オーロラヘア' AND "asset_ref" = 't2 fluffy #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび ナチュラル にじ にじいろヘア' AND "asset_ref" = 't2 long #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの スパイキーヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび ギャラクシー とけい りゅうせいヘア' AND "asset_ref" = 't2 spiky #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの ショートヘア' WHERE "slot_type" = 'hair' AND "name" = 'のびのび フューチャー どうぶつ ショートヘア' AND "asset_ref" = 't2 short #7fc7e0';
  -- T3
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく がくえん どうぶつ ウェーブヘア' AND "asset_ref" = 't3 wavy #e8785a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの マッシュヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく ミュージック ほのお マッシュヘア' AND "asset_ref" = 't3 mash #e0973a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく スターリー さかな おやすみヘア' AND "asset_ref" = 't3 long #4fae6b';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく めいさい ほし おだんごヘア' AND "asset_ref" = 't3 bun #3f9fd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいむらさきの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく マリン ひかり スポーツヘア' AND "asset_ref" = 't3 side #8f6bd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいピンクの くるくるヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく スイーツ うちゅう くるくるヘア' AND "asset_ref" = 't3 curly #d6558f';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの きんちゃいろの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく トロピカル ひょうざん すずかぜヘア' AND "asset_ref" = 't3 wavy #c99a2e';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおみどりの ふわふわヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく アート ふうせん オーロラヘア' AND "asset_ref" = 't3 fluffy #2f9baa';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'わくわく ナチュラル きらきら にじいろヘア' AND "asset_ref" = 't3 long #e8785a';
  -- T4
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあかの マッシュヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき ミュージック キャンディ マッシュヘア' AND "asset_ref" = 't4 mash #b83a2e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こげちゃいろの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき スターリー くも おやすみヘア' AND "asset_ref" = 't4 long #c97a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの もりのみどりの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき めいさい ひみつ おだんごヘア' AND "asset_ref" = 't4 bun #2f7a4e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき マリン にじ スポーツヘア' AND "asset_ref" = 't4 side #2a6fa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいむらさきの くるくるヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき スイーツ とけい くるくるヘア' AND "asset_ref" = 't4 curly #5a3aa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの ワインいろの ウェーブヘア' WHERE "slot_type" = 'hair' AND "name" = 'きらめき トロピカル どうぶつ すずかぜヘア' AND "asset_ref" = 't4 wavy #a8215f';
  -- T5
  UPDATE "wardrobe_items" SET "name" = 'ひかる きんいろの ロングヘア' WHERE "slot_type" = 'hair' AND "name" = 'とっておき スターリー ひょうざん おやすみヘア' AND "asset_ref" = 't5 long #d4af37';
  UPDATE "wardrobe_items" SET "name" = 'ひかる ぶどういろの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'とっておき めいさい ふうせん おだんごヘア' AND "asset_ref" = 't5 bun #7a1fa8';
  UPDATE "wardrobe_items" SET "name" = 'ひかる くじゃくいろの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'とっておき マリン きらきら スポーツヘア' AND "asset_ref" = 't5 side #1a8f8f';
  -- T6
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ネオンピンクの おだんごヘア' WHERE "slot_type" = 'hair' AND "name" = 'とびきり めいさい ほのお おだんごヘア' AND "asset_ref" = 't6 bun #ff3d7f';
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ターコイズいろの サイドヘア' WHERE "slot_type" = 'hair' AND "name" = 'とびきり マリン さかな スポーツヘア' AND "asset_ref" = 't6 side #2de0c2';

  -- necklace
  -- T1
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの わくせいネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて ミュージック くも うちゅうネックレス' AND "asset_ref" = 't1 planet #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの どうぶつネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて スターリー ひみつ どうぶつネックレス' AND "asset_ref" = 't1 paw #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの キャンディネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて めいさい にじ キャンディネックレス' AND "asset_ref" = 't1 candy #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ほんネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて マリン とけい ほんネックレス' AND "asset_ref" = 't1 book #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの つきのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて スイーツ どうぶつ つきネックレス' AND "asset_ref" = 't1 moon #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて トロピカル ほのお おんぷネックレス' AND "asset_ref" = 't1 note #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて アート さかな ほしのペンダント' AND "asset_ref" = 't1 star #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ハートペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて ナチュラル ほし ハートペンダント' AND "asset_ref" = 't1 heart #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの にじのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて ギャラクシー ひかり にじのペンダント' AND "asset_ref" = 't1 rainbow #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの ほうせきネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて フューチャー うちゅう たからせきネックレス' AND "asset_ref" = 't1 gem #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの おはなネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて クール ひょうざん おはなネックレス' AND "asset_ref" = 't1 flower #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ちょうネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて キュート ふうせん ちょうネックレス' AND "asset_ref" = 't1 butterfly #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの おはなネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて スポーティ きらきら すずらんネックレス' AND "asset_ref" = 't1 flower #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの いかりネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて ポップ はな マリンネックレス' AND "asset_ref" = 't1 anchor #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ほのおネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'はじめて ナイト しんかんせん ほのおネックレス' AND "asset_ref" = 't1 flame #cfeaf5';
  -- T2
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの どうぶつネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび スターリー ふうせん どうぶつネックレス' AND "asset_ref" = 't2 paw #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの キャンディネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび めいさい きらきら キャンディネックレス' AND "asset_ref" = 't2 candy #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの ほんネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび マリン はな ほんネックレス' AND "asset_ref" = 't2 book #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの つきのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび スイーツ しんかんせん つきネックレス' AND "asset_ref" = 't2 moon #6fb8c9';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび トロピカル キャンディ おんぷネックレス' AND "asset_ref" = 't2 note #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび アート くも ほしのペンダント' AND "asset_ref" = 't2 star #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの ハートペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび ナチュラル ひみつ ハートペンダント' AND "asset_ref" = 't2 heart #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの にじのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび ギャラクシー にじ にじのペンダント' AND "asset_ref" = 't2 rainbow #7fc7e0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの ほうせきネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび フューチャー とけい たからせきネックレス' AND "asset_ref" = 't2 gem #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの おはなネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび クール どうぶつ おはなネックレス' AND "asset_ref" = 't2 flower #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの ちょうネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび キュート ほのお ちょうネックレス' AND "asset_ref" = 't2 butterfly #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの おはなネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'のびのび スポーティ さかな すずらんネックレス' AND "asset_ref" = 't2 flower #6fb8c9';
  -- T3
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの キャンディネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく めいさい さかな キャンディネックレス' AND "asset_ref" = 't3 candy #3f9fd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいむらさきの ほんネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく マリン ほし ほんネックレス' AND "asset_ref" = 't3 book #8f6bd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいピンクの つきのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく スイーツ ひかり つきネックレス' AND "asset_ref" = 't3 moon #d6558f';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの きんちゃいろの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく トロピカル うちゅう おんぷネックレス' AND "asset_ref" = 't3 note #c99a2e';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおみどりの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく アート ひょうざん ほしのペンダント' AND "asset_ref" = 't3 star #2f9baa';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの ハートペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく ナチュラル ふうせん ハートペンダント' AND "asset_ref" = 't3 heart #e8785a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの にじのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく ギャラクシー きらきら にじのペンダント' AND "asset_ref" = 't3 rainbow #e0973a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの ほうせきネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく フューチャー はな たからせきネックレス' AND "asset_ref" = 't3 gem #4fae6b';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの おはなネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'わくわく クール しんかんせん おはなネックレス' AND "asset_ref" = 't3 flower #3f9fd6';
  -- T4
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの もりのみどりの ほんネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき マリン ひみつ ほんネックレス' AND "asset_ref" = 't4 book #2f7a4e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおの つきのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき スイーツ にじ つきネックレス' AND "asset_ref" = 't4 moon #2a6fa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいむらさきの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき トロピカル とけい おんぷネックレス' AND "asset_ref" = 't4 note #5a3aa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの ワインいろの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき アート どうぶつ ほしのペンダント' AND "asset_ref" = 't4 star #a8215f';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こがねちゃいろの ハートペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき ナチュラル ほのお ハートペンダント' AND "asset_ref" = 't4 heart #8a6a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおみどりの にじのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'きらめき ギャラクシー さかな にじのペンダント' AND "asset_ref" = 't4 rainbow #1f6b78';
  -- T5
  UPDATE "wardrobe_items" SET "name" = 'ひかる こいあおの つきのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'とっておき スイーツ きらきら つきネックレス' AND "asset_ref" = 't5 moon #1a4fa8';
  UPDATE "wardrobe_items" SET "name" = 'ひかる きんいろの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'とっておき トロピカル はな おんぷネックレス' AND "asset_ref" = 't5 note #d4af37';
  UPDATE "wardrobe_items" SET "name" = 'ひかる ぶどういろの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'とっておき アート しんかんせん ほしのペンダント' AND "asset_ref" = 't5 star #7a1fa8';
  -- T6
  UPDATE "wardrobe_items" SET "name" = 'きらきらの バイオレットの おんぷネックレス' WHERE "slot_type" = 'necklace' AND "name" = 'とびきり トロピカル ほし おんぷネックレス' AND "asset_ref" = 't6 note #7a2fe0';
  UPDATE "wardrobe_items" SET "name" = 'きらきらの こはくいろの ほしのペンダント' WHERE "slot_type" = 'necklace' AND "name" = 'とびきり アート ひかり ほしのペンダント' AND "asset_ref" = 't6 star #ffb020';

  -- top
  -- T1
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの コート' WHERE "slot_type" = 'top' AND "name" = 'はじめて ナイト どうぶつ マリンコート' AND "asset_ref" = 't1 coat #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ベスト' WHERE "slot_type" = 'top' AND "name" = 'はじめて がくえん ほのお ニットベスト' AND "asset_ref" = 't1 vest #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの ケープ' WHERE "slot_type" = 'top' AND "name" = 'はじめて ミュージック さかな スターケープ' AND "asset_ref" = 't1 cape #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'はじめて スターリー ほし めいさいブルゾン' AND "asset_ref" = 't1 jacket #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ブラウス' WHERE "slot_type" = 'top' AND "name" = 'はじめて めいさい ひかり フリルブラウス' AND "asset_ref" = 't1 blouse #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'はじめて マリン うちゅう ワンピース' AND "asset_ref" = 't1 dress #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'はじめて スイーツ ひょうざん デニムジャケット' AND "asset_ref" = 't1 jacket #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'はじめて トロピカル ふうせん ボーダーカットソー' AND "asset_ref" = 't1 tee #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの コート' WHERE "slot_type" = 'top' AND "name" = 'はじめて アート きらきら ふわふわコート' AND "asset_ref" = 't1 coat #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの パーカー' WHERE "slot_type" = 'top' AND "name" = 'はじめて ナチュラル はな ほしぞらパーカー' AND "asset_ref" = 't1 hoodie #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'はじめて ギャラクシー しんかんせん ティーシャツ' AND "asset_ref" = 't1 tee #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの パーカー' WHERE "slot_type" = 'top' AND "name" = 'はじめて フューチャー キャンディ パーカー' AND "asset_ref" = 't1 hoodie #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'はじめて クール くも ジャケット' AND "asset_ref" = 't1 jacket #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'はじめて キュート ひみつ キラキラワンピース' AND "asset_ref" = 't1 dress #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの ベスト' WHERE "slot_type" = 'top' AND "name" = 'はじめて スポーティ にじ スポーツベスト' AND "asset_ref" = 't1 vest #fbdce7';
  -- T2
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの ベスト' WHERE "slot_type" = 'top' AND "name" = 'のびのび がくえん キャンディ ニットベスト' AND "asset_ref" = 't2 vest #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの ケープ' WHERE "slot_type" = 'top' AND "name" = 'のびのび ミュージック くも スターケープ' AND "asset_ref" = 't2 cape #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'のびのび スターリー ひみつ めいさいブルゾン' AND "asset_ref" = 't2 jacket #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの ブラウス' WHERE "slot_type" = 'top' AND "name" = 'のびのび めいさい にじ フリルブラウス' AND "asset_ref" = 't2 blouse #6fb8c9';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'のびのび マリン とけい ワンピース' AND "asset_ref" = 't2 dress #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'のびのび スイーツ どうぶつ デニムジャケット' AND "asset_ref" = 't2 jacket #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'のびのび トロピカル ほのお ボーダーカットソー' AND "asset_ref" = 't2 tee #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの コート' WHERE "slot_type" = 'top' AND "name" = 'のびのび アート さかな ふわふわコート' AND "asset_ref" = 't2 coat #7fc7e0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの パーカー' WHERE "slot_type" = 'top' AND "name" = 'のびのび ナチュラル ほし ほしぞらパーカー' AND "asset_ref" = 't2 hoodie #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'のびのび ギャラクシー ひかり ティーシャツ' AND "asset_ref" = 't2 tee #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの パーカー' WHERE "slot_type" = 'top' AND "name" = 'のびのび フューチャー うちゅう パーカー' AND "asset_ref" = 't2 hoodie #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'のびのび クール ひょうざん ジャケット' AND "asset_ref" = 't2 jacket #6fb8c9';
  -- T3
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの ケープ' WHERE "slot_type" = 'top' AND "name" = 'わくわく ミュージック ひょうざん スターケープ' AND "asset_ref" = 't3 cape #e0973a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'わくわく スターリー ふうせん めいさいブルゾン' AND "asset_ref" = 't3 jacket #4fae6b';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの ブラウス' WHERE "slot_type" = 'top' AND "name" = 'わくわく めいさい きらきら フリルブラウス' AND "asset_ref" = 't3 blouse #3f9fd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいむらさきの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'わくわく マリン はな ワンピース' AND "asset_ref" = 't3 dress #8f6bd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいピンクの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'わくわく スイーツ しんかんせん デニムジャケット' AND "asset_ref" = 't3 jacket #d6558f';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの きんちゃいろの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'わくわく トロピカル キャンディ ボーダーカットソー' AND "asset_ref" = 't3 tee #c99a2e';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおみどりの コート' WHERE "slot_type" = 'top' AND "name" = 'わくわく アート くも ふわふわコート' AND "asset_ref" = 't3 coat #2f9baa';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの パーカー' WHERE "slot_type" = 'top' AND "name" = 'わくわく ナチュラル ひみつ ほしぞらパーカー' AND "asset_ref" = 't3 hoodie #e8785a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'わくわく ギャラクシー にじ ティーシャツ' AND "asset_ref" = 't3 tee #e0973a';
  -- T4
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こがねちゃいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'きらめき スターリー ほのお めいさいブルゾン' AND "asset_ref" = 't4 jacket #8a6a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおみどりの ブラウス' WHERE "slot_type" = 'top' AND "name" = 'きらめき めいさい さかな フリルブラウス' AND "asset_ref" = 't4 blouse #1f6b78';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあかの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'きらめき マリン ほし ワンピース' AND "asset_ref" = 't4 dress #b83a2e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こげちゃいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'きらめき スイーツ ひかり デニムジャケット' AND "asset_ref" = 't4 jacket #c97a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの もりのみどりの ティーシャツ' WHERE "slot_type" = 'top' AND "name" = 'きらめき トロピカル うちゅう ボーダーカットソー' AND "asset_ref" = 't4 tee #2f7a4e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおの コート' WHERE "slot_type" = 'top' AND "name" = 'きらめき アート ひょうざん ふわふわコート' AND "asset_ref" = 't4 coat #2a6fa8';
  -- T5
  UPDATE "wardrobe_items" SET "name" = 'ひかる こいあかの ブラウス' WHERE "slot_type" = 'top' AND "name" = 'とっておき めいさい くも フリルブラウス' AND "asset_ref" = 't5 blouse #c9203e';
  UPDATE "wardrobe_items" SET "name" = 'ひかる こいあおの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'とっておき マリン ひみつ ワンピース' AND "asset_ref" = 't5 dress #1a4fa8';
  UPDATE "wardrobe_items" SET "name" = 'ひかる きんいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'とっておき スイーツ にじ デニムジャケット' AND "asset_ref" = 't5 jacket #d4af37';
  -- T6
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの バイオレットの ワンピース' WHERE "slot_type" = 'top' AND "name" = 'とびきり マリン ふうせん ワンピース' AND "asset_ref" = 't6 dress #7a2fe0';
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの こはくいろの ジャケット' WHERE "slot_type" = 'top' AND "name" = 'とびきり スイーツ きらきら デニムジャケット' AND "asset_ref" = 't6 jacket #ffb020';
