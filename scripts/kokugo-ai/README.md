# 国語（漢字のよみ）誤答生成パイプライン

漢字よみクイズは単独の漢字ではなく**熟語の穴埋め**（例: 「一番」の「○○ばん」を埋めさせる）。
正解データ（`kanji`・`example_word`・`reading_template`・`correct_reading`）は自作API
[kyoiku-kanji-api](../../../kyoiku-kanji-api)（教育漢字1026字の読み・画数・学年・例文データ）から
取得した確定データとし、誤答3つ（`distractor_readings`）だけをさくらのAI Engineに考えさせて、正解
データと機械的に突き合わせて検証する。詳細な設計判断は`docs/architecture.md`の「国語（漢字のよみ）」
を参照。

## アプリ本体との関係

`kanji_questions`テーブルへの投入は、このスクリプトの出力を人間がレビューした上で
drizzleのdata migrationとして行う（他の`difficulty_levels`のマスタデータと同じ運用。
`docs/architecture.md`「マスタデータもマイグレーションで投入する」）。このスクリプト自体は
アプリの実行時パスからは呼ばれない standalone Node スクリプト。

## fetch-kanji-master.ts（正解データの取得）

kyoiku-kanji-apiからgrade=1の80字を取得し、以下を機械的に決定する。

- **`example_word` / `reading_template` / `correct_reading`**: その漢字の`examples`（熟語と読みの
  ペア）を先頭から見て、対象漢字が1文字目なら「熟語の読み全体が対象漢字の既知の読みで始まるか」、
  2文字目なら「終わるか」を判定し、最初に一致した熟語を採用する（`findDecomposableExample`）。
  一致した部分が`correct_reading`、残りが`reading_template`の○○の外側になる。読みが複数併記されて
  いる熟語（例: "十七（じゅうしち/じゅうなな）"）は対象外。連濁・促音便で読みが変化する熟語
  （一杯＝いち+はい→いっぱい 等）も一致しないため自動的に除外される
  - 候補が複数ある場合、①漢字1字＋送り仮名の形（例: 「出る」。新出漢字の導入時にそのまま教わる
    基本形で最も日常語らしい）→②熟語のもう片方の漢字の学年が低いもの、の順で優先する。ただし
    学年は語の平易さそのものではなく万能ではない（「子音」は相方の学年こそ低いが専門語）ため、
    `MANUAL_EXAMPLE_OVERRIDES`で10字を人手上書きしている（examplesを全件目視して選定。
    理由はコード内コメント参照）
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

プロンプトには熟語（`example_word`）と穴埋めテンプレート（`reading_template`）を渡し、その○○に
当てはめても不自然に見えない誤った読みを考えさせる。AIが返した誤答候補は、以下を満たすものだけを
採用する（`validateDistractors`）。

- ひらがなのみ（漢字・カタカナ・記号が混ざっていたら却下）
- そのkanjiの`correctReadings`（訓読み・音読み全部）のいずれとも不一致
  - ＝ AIの誤答候補が偶然「その漢字の別の正しい読み方」と一致し、4択の中に正解が2つ紛れ込む
    事故を防ぐのがここの目的
  - **この検証はkyoiku-kanji-apiが返す読みリストが基準のため万能ではない。** 実際に「空（あく）」
    でAI候補「すく」がすり抜けたことがあった（APIの読みリストには無いが、空くの実在の別読み）。
    機械検証を通っても、人間が最終レビューする前提は変わらない
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
