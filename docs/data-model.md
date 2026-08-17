# data-model

DBスキーマの概念設計（Drizzle実装前のたたき台）。詳細な型・制約は実装時に詰める。

## 方針

- 学年・教科・難易度・着せ替えアイテムなど「コンテンツ」に関わるものはできるだけデータ駆動にする（configをJSONで持つ、カタログテーブルにレコードを足すだけで拡張できる）。コード変更なしで拡張できることを優先する
- ランキングは専用テーブルを持たず、`time_attack_runs`を都度集計するクエリベースにする（パフォーマンスが問題になったら後日マテリアライズを検討）
- DBスキーマは後から変更しづらいため、実際のデータの意味的な関係（例: 「所有している」と「今装備している」は別の事実）を正しく表現するテーブル設計を優先する

## テーブル一覧

### child_profiles（子どもアカウント）
- `id`
- `login_id`（unique、システム発行。登録は親子一緒に行う想定だが、親専用の別アカウント層は持たない）
- `pin_hash`
- `display_nickname`（unique、自動生成。詳細は [game-design.md](./game-design.md) 参照）
- `grade`（学年 1〜6）
- `points_balance`（着せ替えアイテム交換用ポイント）
- `created_at`

### subjects（教科）
- `id`
- `name`（算数・国語など。当面は算数のみ運用）
- `slug`

### difficulty_levels（難易度レベル）
- `id`
- `subject_id`（fk → subjects）
- `skill_type`（算数なら add / subtract、他教科拡張時は教科ごとの値を使う汎用列）
- `level_number`（順序）
- `config`（JSON: `min_a, max_a, min_b, max_b, carry` など）

### child_progress（子どもごとの現在レベル）
- `child_id`（fk → child_profiles）
- `subject_id`
- `skill_type`
- `current_level_id`（fk → difficulty_levels）
- `updated_at`

### practice_sessions（練習モードの記録）
- `id`
- `child_id`
- `level_id`
- `total_questions`
- `correct_count`
- `started_at` / `finished_at`

### time_attack_runs（タイムアタックの記録）
- `id`
- `child_id`
- `subject_id`
- `skill_type`
- `correct_count`（＝スコア）
- `duration_seconds`（固定60を想定）
- `played_at`

ランキング・自己ベストはこのテーブルを学年・週単位で集計して算出する。「都度集計」は
ユーザー数そのものより、集計対象（今週・同学年の行、または1人ぶんの全行）を毎回
フルスキャンしないことが要る。`played_at`・`child_id`にインデックスを張っている
（サービス運用期間ぶん積み上がる全行数からは独立させ、都度集計を維持できる期間を延ばす）。

### wardrobe_items（着せ替えアイテムカタログ）
- `id`
- `slot_type`（hair / top / bottom / necklace。将来slot_typeを追加する場合もレコード追加のみでよい）
- `name`
- `asset_ref`
- `unlock_condition_type`（total_correct / level_reached / time_attack_score など）
- `unlock_condition_value`（JSON or scalar）
- `price_points`（ポイント交換の場合。解放条件達成のみで無料開放するアイテムは null）

### child_owned_wardrobe_items（子どもが所持しているアイテム）
- `child_id`（fk）
- `wardrobe_item_id`（fk）
- `acquired_at`

### child_equipped_items（子どもが今装備しているアイテム）
- `child_id`（fk → child_profiles）
- `slot_type`（hair / top / bottom / necklace...）
- `wardrobe_item_id`（fk → wardrobe_items）
- `equipped_at`
- UNIQUE制約: (`child_id`, `slot_type`) ← 1部位につき1アイテムしか装備できないことを保証する
- ※装備できるのは`child_owned_wardrobe_items`で所持済みのアイテムのみ（アプリ側で担保する）

### 着せ替えの整合性の担保について

neon-httpドライバはトランザクションを張れないため、ポイント交換は次の順で行う（`src/lib/wardrobe-store.ts`）。

1. `child_owned_wardrobe_items`に先に登録する（UNIQUE制約が二重購入を防ぐ）
2. 残高が足りている場合だけ減算する（`WHERE points_balance >= price`の条件付きUPDATE）
3. 2が0行なら1を取り消す

この順にしたのは、途中で落ちたときに「ポイントだけ減ってアイテムが無い」より「アイテムだけ手に入る」ほうが子どもへの実害が小さいため。厳密な原子性が要るようになったら、`drizzle-orm/neon-serverless`（WebSocket）へ切り替えてトランザクションを張る。

`unlock_condition_type`の判定は練習セッションの終了時に行う（バッチ処理はしない）。種類を増やすときは`src/lib/wardrobe.ts`に判定を足す必要があるが、**アイテム自体の追加はマイグレーションでレコードを足すだけでよい**。

## コンテンツ追加の運用

学年・教科拡張時の`subjects` / `difficulty_levels`へのレコード追加は、管理画面は作らずリポジトリ側で行う。当初はシードスクリプト（`seed.ts`）の再実行を想定していたが、**データマイグレーション（`drizzle/`配下のSQL）として追加する方式に変更した**。理由と背景は[architecture.md](./architecture.md)の「マスタデータもマイグレーションで投入する」を参照。

`difficulty_levels`の`config`はアプリが実行時に読む値なので、`src/lib/practice.ts`の配列を編集しただけでは反映されない。レベルの調整・追加には必ずマイグレーションを伴わせること。

## 未決定・TODO（実装時に決定）

- [ ] Drizzleスキーマの具体実装（型・インデックス・外部キー制約）
- [ ] `unlock_condition_type` ごとの判定ロジックの実装方式（方針: 練習/タイムアタックのセッション終了時にその場でチェックする。バッチ処理は不要）
