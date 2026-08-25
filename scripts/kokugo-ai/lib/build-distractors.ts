import { chatCompletion } from "./sakura-ai-client";

export type DistractorTarget = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
};

export type DistractorPoolResult = Record<string, string[]>; // id -> 誤答プール

// 1回の生成では終わらせず、字ごとに複数ラウンドに分けて「すでに選んだ誤答とは
// 違うものを」と積み増していく。バッチもしない（1字1リクエスト）。ラウンドを
// 分けることで語彙が広がりやすい（1回で6個ちょうだいと聞くより多様になりやすい）。
//
// ラウンド数は「さくらのAI Engine 3000リクエスト」の枠から逆算している。
// 学年1〜6ぶん（使用可能な字は約1000字）× 2ラウンド＝約2000リクエストに、
// 例文の難易度選定（select-example-difficulty.ts、こちらもAI呼び出し。ただし
// ヒューリスティックで大半を裁くため実際は数十リクエストに収まる）を足しても
// 3000には十分な余裕がある。以前は3ラウンド（プール9個）だったが、例文選定を
// 追加した際に合計リクエスト数を2000程度に抑えたく2に減らした
const ROUND_SIZE = 3;
const ROUNDS_PER_TARGET = 2;
export const POOL_SIZE = ROUND_SIZE * ROUNDS_PER_TARGET;
// 同時実行数。8で流したところ429（レート制限）に頻繁に当たり、
// sakura-ai-client.ts側のリトライで吸収しきれない分がフォールバックに
// 落ちていた（grade5/6で発生）。4まで落として様子を見る
const CONCURRENCY = 4;

const isHiragana = (value: string) => /^[ぁ-んー]+$/.test(value);
const isKatakana = (value: string) => /^[ァ-ヶー]+$/.test(value);

const scriptCheckerFor = (readingType: "on" | "kun") =>
  readingType === "on" ? isKatakana : isHiragana;

const extractJsonArray = (text: string): unknown => {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) {
    throw new Error(`AI応答からJSON配列を抽出できませんでした: ${text.slice(0, 200)}`);
  }
  return JSON.parse(match[0]);
};

const buildPrompt = (target: DistractorTarget, exclude: readonly string[]): string => `あなたは小学生向けの漢字よみクイズを作る教材編集者です。
次の問題について、「ただしいよみ」とまぎらわしい・まちがえそうなダミーの選択肢（誤答）を
ちょうど3つ考えてください。

かんじ: "${target.kanji}"
ただしいよみ: "${target.correctReading}"（${
  target.readingType === "on" ? "音読み・カタカナ表記" : "訓読み・ひらがな表記"
}）
${exclude.length > 0 ? `すでに使った誤答（これらとは違うものにする）: ${exclude.join("、")}` : ""}

条件:
- ただしいよみと同じ文字種で答える（音読みならカタカナのみ、訓読みならひらがなのみ）
- ただしいよみ自体、既に使った誤答、3つの中での重複は禁止
- ただしいよみに文字を継ぎ足しただけ（例: 正解が「ダイ」なら「ダイツ」「ダイジ」など）は禁止。
  正解の文字列を含む・正解に含まれる誤答は作らない
- 実在する読み方でも、存在しない読みでもよいが、音の響きが似ている・文字数が近いなど、
  まぎらわしいものにする
- 漢字・ローマ字・記号は使わない

出力は次の形式のJSON配列のみ。説明文や前置き、コードブロックは書かない:
["よみ1", "よみ2", "よみ3"]`;

// 後半ラウンドになるほど、AIが「もう違うのが思いつかない」ときに正解へ
// 文字を継ぎ足しただけの水増し（例:「ダイ」の誤答に「ダイツ」「ダイジ」）を
// 出しがちになる。長さ1の読みに限っては前方一致で弾くと安全な短い読みまで
// 巻き込むため、正解が2文字以上のときだけ包含関係をチェックする
const overlapsWithCorrect = (distractor: string, correctReading: string): boolean =>
  correctReading.length >= 2 &&
  (distractor.includes(correctReading) || correctReading.includes(distractor));

const validateRound = (
  parsed: unknown,
  target: DistractorTarget,
  exclude: readonly string[],
): string[] | null => {
  if (!Array.isArray(parsed) || parsed.length !== ROUND_SIZE) return null;
  const checker = scriptCheckerFor(target.readingType);
  const cleaned = parsed.map((d) => (typeof d === "string" ? d.trim() : ""));
  const excludeSet = new Set([target.correctReading, ...exclude]);
  const valid =
    cleaned.every(
      (d) =>
        d.length > 0 &&
        checker(d) &&
        !excludeSet.has(d) &&
        !overlapsWithCorrect(d, target.correctReading),
    ) && new Set(cleaned).size === ROUND_SIZE;
  return valid ? cleaned : null;
};

// AIの出力が最後まで条件を満たさなかった場合の最終手段。パイプライン自体は
// 必ず完走させる（1件のフォーマット崩れで大量のリクエストが無駄になるのを防ぐ）
const FALLBACK_POOL: Record<"on" | "kun", string[]> = {
  on: [
    "カ", "キョウ", "セイ", "トウ", "リン", "ホウ", "シュウ", "モク", "ライ", "ケン",
    "ジョウ", "ヒョウ", "ダン", "ロン", "エン", "サク", "テン", "ヨウ", "ギ", "コウ",
  ],
  kun: [
    "かわ", "みず", "そら", "やま", "つき", "はな", "うみ", "いえ", "くさ", "とり",
    "つち", "いし", "きし", "たに", "はやし", "もり", "たけ", "いと", "むし", "かい",
  ],
};

const fallbackRound = (target: DistractorTarget, exclude: readonly string[]): string[] => {
  const excludeSet = new Set([target.correctReading, ...exclude]);
  const pool = FALLBACK_POOL[target.readingType].filter((r) => !excludeSet.has(r));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, ROUND_SIZE);
};

const requestRound = async (
  target: DistractorTarget,
  exclude: readonly string[],
): Promise<string[] | null> => {
  try {
    const content = await chatCompletion([{ role: "user", content: buildPrompt(target, exclude) }]);
    return validateRound(extractJsonArray(content), target, exclude);
  } catch {
    return null;
  }
};

const buildPoolForTarget = async (
  target: DistractorTarget,
  log: (message: string) => void,
): Promise<string[]> => {
  const pool: string[] = [];

  for (let round = 0; round < ROUNDS_PER_TARGET; round++) {
    // 失敗したら同じラウンドを1回だけリトライし、それでもダメならフォールバック
    let result = await requestRound(target, pool);
    if (!result) result = await requestRound(target, pool);
    if (!result) {
      log(`  fallback round for ${target.kanji}(${target.correctReading})`);
      result = fallbackRound(target, pool);
    }
    pool.push(...result);
  }

  return pool;
};

// 並行数を絞ったワーカープールで全ターゲットを処理する。字ごとのラウンドは
// （前のラウンドの結果に依存するため）順番に実行するが、字同士は並行して進める
export const generateDistractorPools = async (
  targets: DistractorTarget[],
  log: (message: string) => void = () => {},
): Promise<DistractorPoolResult> => {
  const result: DistractorPoolResult = {};
  let cursor = 0;

  const worker = async () => {
    while (cursor < targets.length) {
      const index = cursor++;
      const target = targets[index];
      const pool = await buildPoolForTarget(target, log);
      result[target.id] = pool;
      log(`[${index + 1}/${targets.length}] ${target.kanji}(${target.correctReading}) -> pool of ${pool.length}`);
    }
  };

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, targets.length) }, worker));
  return result;
};
