# 国語（漢字のよみ）誤答生成パイプライン

漢字よみクイズの4択のうち、正解（`kanji`・`correct_reading`）は自作API
[kyoiku-kanji-api](../../../kyoiku-kanji-api)（教育漢字1026字の読み・画数・学年データ）から取得した
確定データとし、誤答3つ（`distractor_readings`）だけをさくらのAI Engineに考えさせて、正解データと
機械的に突き合わせて検証する。詳細な設計判断は`docs/architecture.md`の「国語（漢字のよみ）」を参照。

## アプリ本体との関係

`kanji_questions`テーブルへの投入は、このスクリプトの出力を人間がレビューした上で
drizzleのdata migrationとして行う（他の`difficulty_levels`のマスタデータと同じ運用。
`docs/architecture.md`「マスタデータもマイグレーションで投入する」）。このスクリプト自体は
アプリの実行時パスからは呼ばれない standalone Node スクリプト。

## fetch-kanji-master.ts（正解データの取得）

kyoiku-kanji-apiからgrade=1の80字を取得し、以下を機械的に決定する。

- **`correct_reading`**: 訓読みがあれば訓読みの1つ目、無ければ音読みの1つ目（カタカナ→ひらがな変換）。
  教科書がどちらを先に教えるかまでは配当表からは分からないため、あくまで既定値。違和感があれば
  マイグレーションを書く際に個別に上書きする
- **レベル分け**: 画数（`strokeCount`）昇順で5字ずつ機械的に区切る（16レベル）

AIを呼ばずにこの取得結果だけを確認したいときは以下を実行する。

```bash
npm run kokugo:fetch-kanji-master
```

## generate-distractors.ts（誤答データの生成）

fetch-kanji-masterの結果を使い、漢字ごとに誤答3つをさくらのAI Engineに生成させる。

```bash
npm run kokugo:generate-distractors
```

`.env`に以下を設定しておく（`.env.local.example`参照）。

```
SAKURA_AI_API_KEY=
SAKURA_AI_BASE_URL=
SAKURA_AI_MODEL=
```

`SAKURA_AI_BASE_URL`はさくらのAI Engineのコントロールパネルに表示されるOpenAI互換エンドポイント
のベースURLをそのまま設定する（このリポジトリ側では決め打ちにしていない）。

`KYOIKU_KANJI_API_BASE_URL`は省略時、本番URL（`https://api.kyoiku-kanji.st-man.com`）を使う。
kyoiku-kanji-apiをローカルで動かして試したい場合のみ上書きする。

### 検証ロジック

AIが返した誤答候補は、以下を満たすものだけを採用する（`validateDistractors`）。

- ひらがなのみ（漢字・カタカナ・記号が混ざっていたら却下）
- そのkanjiの`correctReadings`（訓読み・音読み全部）のいずれとも不一致
  - ＝ AIの誤答候補が偶然「その漢字の別の正しい読み方」と一致し、4択の中に正解が2つ紛れ込む
    事故を防ぐのがここの目的
- 重複していない

検証後に3件揃わなかった漢字はスキップし、理由を標準出力に出す（再プロンプトのリトライはしない）。

### 出力

`scripts/kokugo-ai/output/quiz-candidates.json`に生成結果を書き出す（`.gitignore`済み・未レビュー
のAI生成物のためコミットしない）。各要素は`needsHumanReview: true`を必ず持つ——人間のレビューを
経るまでは実データとして扱わない、という運用を機械的にも示すため。ここでの人間レビューの実質的な
チェックポイントは、この出力を元に書くマイグレーションのPR差分になる。

## 誤答の日替わりローテーション（未実装）

同じ漢字でも遊ぶたびに誤答の並びが変わるように、`distractor_readings`だけは将来GitHub Actionsで
日次に洗い替える計画。これは意図的に「マスタデータはマイグレーションで投入する」の例外になる
（`docs/architecture.md`「誤答の日替わりローテーションについて」参照）。当面は
`npm run kokugo:generate-distractors`の出力を見ながら手動でマイグレーションを更新する運用とする。
