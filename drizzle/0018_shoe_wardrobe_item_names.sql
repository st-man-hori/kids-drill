-- Custom SQL migration file, put your code below! --

-- 0017のティア制シューズ47件は、0007の名前生成パターン(ティア語+ランダム
-- 形容詞+ランダム名詞+モチーフ名)をそのまま踏襲していたが、モチーフ名
-- 以外の2語(がくえん/ほのお等)は実際の見た目と無関係な飾り言葉で、
-- 「のびのび がくえん ほのお うんどうぐつ」のように中身と乖離した名前に
-- なっていた（実機フィードバック）。
--
-- ここでは、SHOE(src/components/avatar.tsx)のティア別演出に実際に対応する
-- 形容(t2=グラデーションのつや / t3=ハイライトのてかり / t4=玉飾り /
-- t5=明滅するグロー / t6=ほしバッジ+ういているきらきら)と、asset_refの色
-- (t1のパレット順)・モチーフ名だけで名前を組み立て直す。t1は演出が
-- 無地+ふちどりのみなので形容詞なし（既存のalwaysアイテムと同じ体裁）。
--
-- 0009/0012〜0014/0016と同じく、過去のマイグレーションは書き換えず
-- 新しいマイグレーションで補正する。旧名+asset_refの組でWHERE指定し、
-- 誤って別行を更新しないようにする

  -- T1
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて スポーティ ひかり ながぐつ' AND "asset_ref" = 't1 rainboots #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて ポップ うちゅう サンダル' AND "asset_ref" = 't1 sandals #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて ナイト ひょうざん ストラップシューズ' AND "asset_ref" = 't1 maryjane #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの バレエシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて がくえん ふうせん バレエシューズ' AND "asset_ref" = 't1 slipon #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの うんどうぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて ミュージック きらきら うんどうぐつ' AND "asset_ref" = 't1 sports #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの もこもこブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて スターリー はな もこもこブーツ' AND "asset_ref" = 't1 winter #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの スニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて めいさい しんかんせん スニーカー' AND "asset_ref" = 't1 sneaker #f5e6c8';
  UPDATE "wardrobe_items" SET "name" = 'あわいみどりの ハイカットスニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて マリン キャンディ ハイカットスニーカー' AND "asset_ref" = 't1 hightop #d7f0e0';
  UPDATE "wardrobe_items" SET "name" = 'ももいろの ブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて スイーツ くも ブーツ' AND "asset_ref" = 't1 boots #fcd7c9';
  UPDATE "wardrobe_items" SET "name" = 'クリームいろの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて トロピカル ひみつ ながぐつ' AND "asset_ref" = 't1 rainboots #fde8c8';
  UPDATE "wardrobe_items" SET "name" = 'うすみどりの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて アート にじ サンダル' AND "asset_ref" = 't1 sandals #d9f2d1';
  UPDATE "wardrobe_items" SET "name" = 'みずいろの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて ナチュラル とけい ストラップシューズ' AND "asset_ref" = 't1 maryjane #cfeaf5';
  UPDATE "wardrobe_items" SET "name" = 'うすむらさきの バレエシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて ギャラクシー どうぶつ バレエシューズ' AND "asset_ref" = 't1 slipon #e6d9f7';
  UPDATE "wardrobe_items" SET "name" = 'さくらいろの うんどうぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて フューチャー ほのお うんどうぐつ' AND "asset_ref" = 't1 sports #fbdce7';
  UPDATE "wardrobe_items" SET "name" = 'ベージュの もこもこブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'はじめて クール さかな もこもこブーツ' AND "asset_ref" = 't1 winter #f5e6c8';

  -- T2
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび ポップ とけい ストラップシューズ' AND "asset_ref" = 't2 maryjane #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの バレエシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび ナイト どうぶつ バレエシューズ' AND "asset_ref" = 't2 slipon #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの うんどうぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび がくえん ほのお うんどうぐつ' AND "asset_ref" = 't2 sports #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの もこもこブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび ミュージック さかな もこもこブーツ' AND "asset_ref" = 't2 winter #7fc7e0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの むらさきの スニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび スターリー ほし スニーカー' AND "asset_ref" = 't2 sneaker #b39ce0';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの ピンクの ハイカットスニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび めいさい ひかり ハイカットスニーカー' AND "asset_ref" = 't2 hightop #f0a3c4';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの きんいろの ブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび マリン うちゅう ブーツ' AND "asset_ref" = 't2 boots #e0c15a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの エメラルドいろの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび スイーツ ひょうざん ながぐつ' AND "asset_ref" = 't2 rainboots #6fb8c9';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの コーラルいろの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび トロピカル ふうせん サンダル' AND "asset_ref" = 't2 sandals #f4a988';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの からしいろの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび アート きらきら ストラップシューズ' AND "asset_ref" = 't2 maryjane #f7c86b';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みどりの バレエシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび ナチュラル はな バレエシューズ' AND "asset_ref" = 't2 slipon #8fd39a';
  UPDATE "wardrobe_items" SET "name" = 'つやつやの みずいろの うんどうぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'のびのび ギャラクシー しんかんせん うんどうぐつ' AND "asset_ref" = 't2 sports #7fc7e0';

  -- T3
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの うんどうぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく ナイト しんかんせん うんどうぐつ' AND "asset_ref" = 't3 sports #e8785a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの オレンジの もこもこブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく がくえん キャンディ もこもこブーツ' AND "asset_ref" = 't3 winter #e0973a';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいみどりの スニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく ミュージック くも スニーカー' AND "asset_ref" = 't3 sneaker #4fae6b';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおの ハイカットスニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく スターリー ひみつ ハイカットスニーカー' AND "asset_ref" = 't3 hightop #3f9fd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいむらさきの ブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく めいさい にじ ブーツ' AND "asset_ref" = 't3 boots #8f6bd6';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの こいピンクの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく マリン とけい ながぐつ' AND "asset_ref" = 't3 rainboots #d6558f';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの きんちゃいろの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく スイーツ どうぶつ サンダル' AND "asset_ref" = 't3 sandals #c99a2e';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あおみどりの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく トロピカル ほのお ストラップシューズ' AND "asset_ref" = 't3 maryjane #2f9baa';
  UPDATE "wardrobe_items" SET "name" = 'ピカピカの あかオレンジの バレエシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'わくわく アート さかな バレエシューズ' AND "asset_ref" = 't3 slipon #e8785a';

  -- T4
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあかの スニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき がくえん うちゅう スニーカー' AND "asset_ref" = 't4 sneaker #b83a2e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こげちゃいろの ハイカットスニーカー' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき ミュージック ひょうざん ハイカットスニーカー' AND "asset_ref" = 't4 hightop #c97a1a';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの もりのみどりの ブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき スターリー ふうせん ブーツ' AND "asset_ref" = 't4 boots #2f7a4e';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいあおの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき めいさい きらきら ながぐつ' AND "asset_ref" = 't4 rainboots #2a6fa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの こいむらさきの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき マリン はな サンダル' AND "asset_ref" = 't4 sandals #5a3aa8';
  UPDATE "wardrobe_items" SET "name" = 'たまかざりの ワインいろの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'きらめき スイーツ しんかんせん ストラップシューズ' AND "asset_ref" = 't4 maryjane #a8215f';

  -- T5
  UPDATE "wardrobe_items" SET "name" = 'ひかる きんいろの ブーツ' WHERE "slot_type" = 'shoes' AND "name" = 'とっておき ミュージック どうぶつ ブーツ' AND "asset_ref" = 't5 boots #d4af37';
  UPDATE "wardrobe_items" SET "name" = 'ひかる ぶどういろの ながぐつ' WHERE "slot_type" = 'shoes' AND "name" = 'とっておき スターリー ほのお ながぐつ' AND "asset_ref" = 't5 rainboots #7a1fa8';
  UPDATE "wardrobe_items" SET "name" = 'ひかる くじゃくいろの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'とっておき めいさい さかな サンダル' AND "asset_ref" = 't5 sandals #1a8f8f';

  -- T6
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ネオンピンクの サンダル' WHERE "slot_type" = 'shoes' AND "name" = 'とびきり スターリー キャンディ サンダル' AND "asset_ref" = 't6 sandals #ff3d7f';
  UPDATE "wardrobe_items" SET "name" = 'きらきらぼしの ターコイズいろの ストラップシューズ' WHERE "slot_type" = 'shoes' AND "name" = 'とびきり めいさい くも ストラップシューズ' AND "asset_ref" = 't6 maryjane #2de0c2';
