import { chatCompletion } from "./sakura-ai-client";

export type DistractorTarget = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
};

export type DistractorResult = Record<string, string[]>; // id -> ちょうど3件のよみ

// 1リクエストあたりの問題数。80字を丸ごと1リクエストにすると出力トークンが
// 膨らみJSONが壊れやすくなるため、数バッチに分けて信頼性を優先する
const CHUNK_SIZE = 15;

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

const buildPrompt = (targets: DistractorTarget[]): string => {
  const lines = targets
    .map(
      (t) =>
        `- id: "${t.id}", かんじ: "${t.kanji}", ただしいよみ: "${t.correctReading}"（${
          t.readingType === "on" ? "音読み・カタカナ表記" : "訓読み・ひらがな表記"
        }）`,
    )
    .join("\n");

  return `あなたは小学1年生向けの漢字よみクイズを作る教材編集者です。
以下の各問題について、「ただしいよみ」とまぎらわしい・小学1年生がまちがえそうな
ダミーの選択肢（誤答）をちょうど3つずつ考えてください。

条件:
- ただしいよみと同じ文字種で答える（音読みの問題ならカタカナのみ、訓読みの問題ならひらがなのみ）
- ただしいよみ自体、および3つの中での重複は禁止
- 実在する読み方（他の漢字の読みなど）でも、存在しない読みでもよいが、
  音の響きが似ている・文字数が近いなど、まぎらわしいものにする
- 漢字・ローマ字・記号は使わない

出力は次の形式のJSON配列のみ。説明文や前置き、コードブロックは書かない:
[{"id": "問題のid", "distractors": ["よみ1", "よみ2", "よみ3"]}, ...]

問題一覧:
${lines}`;
};

const validateDistractors = (
  distractors: unknown,
  target: DistractorTarget,
): string[] | null => {
  if (!Array.isArray(distractors) || distractors.length !== 3) return null;
  const checker = scriptCheckerFor(target.readingType);
  const cleaned = distractors.map((d) => (typeof d === "string" ? d.trim() : ""));
  const valid =
    cleaned.every((d) => d.length > 0 && checker(d) && d !== target.correctReading) &&
    new Set(cleaned).size === 3;
  return valid ? cleaned : null;
};

// AIの出力が最後まで条件を満たさなかった場合の最終手段。パイプライン自体は
// 必ず完走させる（1件のフォーマット崩れで80件ぶんの生成が無駄になるのを防ぐ）
const FALLBACK_POOL: Record<"on" | "kun", string[]> = {
  on: ["カ", "キョウ", "セイ", "トウ", "リン", "ホウ", "シュウ", "モク", "ライ", "ケン"],
  kun: ["かわ", "みず", "そら", "やま", "つき", "はな", "うみ", "いえ", "くさ", "とり"],
};

const fallbackDistractors = (target: DistractorTarget): string[] => {
  const pool = FALLBACK_POOL[target.readingType].filter((r) => r !== target.correctReading);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const chunk = <T,>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, i * size + size),
  );

const parseBatchResponse = (content: string): Map<string, unknown> => {
  const parsed = extractJsonArray(content);
  if (!Array.isArray(parsed)) return new Map();
  return new Map(
    parsed
      .filter(
        (item): item is { id: string; distractors: unknown } =>
          typeof item === "object" && item !== null && typeof (item as { id?: unknown }).id === "string",
      )
      .map((item) => [item.id, item.distractors]),
  );
};

export const generateDistractors = async (
  targets: DistractorTarget[],
  log: (message: string) => void = () => {},
): Promise<DistractorResult> => {
  const result: DistractorResult = {};

  for (const batch of chunk(targets, CHUNK_SIZE)) {
    log(`distractor batch: ${batch.map((t) => t.kanji).join("")}`);

    let byId = new Map<string, unknown>();
    try {
      const content = await chatCompletion([{ role: "user", content: buildPrompt(batch) }]);
      byId = parseBatchResponse(content);
    } catch (error) {
      log(`  batch request failed, will retry per item: ${(error as Error).message}`);
    }

    for (const target of batch) {
      const validated = validateDistractors(byId.get(target.id), target);
      if (validated) {
        result[target.id] = validated;
        continue;
      }

      // バッチ全体、またはこの項目だけ形式が崩れていた場合は単独で1回だけリトライする
      try {
        const content = await chatCompletion([{ role: "user", content: buildPrompt([target]) }]);
        const retryById = parseBatchResponse(content);
        const retryValidated = validateDistractors(retryById.get(target.id), target);
        if (retryValidated) {
          result[target.id] = retryValidated;
          continue;
        }
      } catch {
        // 単独リトライも失敗したらフォールバックへ
      }

      log(`  fallback used for ${target.kanji}(${target.correctReading})`);
      result[target.id] = fallbackDistractors(target);
    }
  }

  return result;
};
