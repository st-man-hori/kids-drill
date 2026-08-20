/**
 * kanji_questions の誤答選択肢（distractor_readings）を、正解データ
 * （kyoiku-kanji-api由来、fetch-kanji-master.ts）ごとにAI（さくらのAI Engine、
 * OpenAI互換API）へ考えさせ、機械的に突き合わせて検証する。
 *
 * 出力（scripts/kokugo-ai/output/quiz-candidates.json）はneedsHumanReview: true
 * 付きのAI生成物。kanji_questionsへは drizzle のdata migrationとして投入し、
 * PRの差分でレビューする（docs/architecture.md「国語（漢字のよみ）」参照）。
 *
 * 実行方法:
 *   npm run kokugo:generate-distractors
 *
 * 必要な環境変数（.env、このプロジェクトのローカル秘密情報の置き場）:
 *   SAKURA_AI_API_KEY  - さくらのAI Engineのコントロールパネルで発行したキー
 *   SAKURA_AI_BASE_URL - OpenAI互換エンドポイントのURL（コントロールパネル記載の値をそのまま使う。
 *                        `/chat/completions`を含む完全なURLでもベースURLのみでもどちらでも可）
 *   SAKURA_AI_MODEL    - 使用するモデル名
 *   KYOIKU_KANJI_API_BASE_URL - 省略時は本番URL（https://api.kyoiku-kanji.st-man.com）
 */
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchGradeOneKanjiMaster, type KanjiMasterEntry } from "./fetch-kanji-master";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** tsxのnode向けdotenv読み込みに依存せず、.envを自前で読む（依存追加を避けるため） */
const loadDotEnv = () => {
  const envPath = join(__dirname, "..", "..", ".env");
  let text: string;
  try {
    text = readFileSync(envPath, "utf-8");
  } catch {
    return;
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadDotEnv();

type QuizCandidate = {
  kanji: string;
  levelNumber: number;
  strokeCount: number;
  exampleWord: string;
  readingTemplate: string;
  correctReading: string;
  distractors: string[];
  model: string;
  generatedAt: string;
  needsHumanReview: true;
};

const DISTRACTOR_COUNT = 3;
const HIRAGANA_ONLY = /^[ぁ-んー]+$/;

const main = async () => {
  const apiKey = requireEnv("SAKURA_AI_API_KEY");
  const baseUrl = requireEnv("SAKURA_AI_BASE_URL");
  const model = requireEnv("SAKURA_AI_MODEL");

  const master = await fetchGradeOneKanjiMaster();
  console.log(`kyoiku-kanji-apiから${master.length}字取得（${master[master.length - 1]?.levelNumber ?? 0}レベル）`);

  const results: QuizCandidate[] = [];
  const skipped: { kanji: string; reason: string }[] = [];

  for (const entry of master) {
    const targetReading = entry.correctReading;
    console.log(`[${entry.kanji}] ${targetReading} の誤答候補を生成中...`);

    let rawDistractors: string[];
    try {
      rawDistractors = await requestDistractors({ apiKey, baseUrl, model }, entry, targetReading);
    } catch (err) {
      skipped.push({ kanji: entry.kanji, reason: `API呼び出し失敗: ${(err as Error).message}` });
      continue;
    }

    const validated = validateDistractors(rawDistractors, entry);
    if (validated.length < DISTRACTOR_COUNT) {
      skipped.push({
        kanji: entry.kanji,
        reason: `検証後に${DISTRACTOR_COUNT}件揃わなかった（候補: ${JSON.stringify(rawDistractors)} → 有効: ${JSON.stringify(validated)}）`,
      });
      continue;
    }

    results.push({
      kanji: entry.kanji,
      levelNumber: entry.levelNumber,
      strokeCount: entry.strokeCount,
      exampleWord: entry.exampleWord,
      readingTemplate: entry.readingTemplate,
      correctReading: targetReading,
      distractors: validated.slice(0, DISTRACTOR_COUNT),
      model,
      generatedAt: new Date().toISOString(),
      needsHumanReview: true,
    });
  }

  const outDir = join(__dirname, "output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "quiz-candidates.json");
  writeFileSync(outPath, JSON.stringify(results, null, 2), "utf-8");

  console.log(`\n生成完了: ${results.length}件 → ${outPath}`);
  if (skipped.length > 0) {
    console.log(`スキップ: ${skipped.length}件`);
    for (const s of skipped) console.log(`  - ${s.kanji}: ${s.reason}`);
  }
  console.log("\n※ 出力はすべて needsHumanReview: true。人間のレビューを経るまでは実データとして扱わないこと。");
};

const requestDistractors = async (
  auth: { apiKey: string; baseUrl: string; model: string },
  entry: KanjiMasterEntry,
  targetReading: string,
): Promise<string[]> => {
  const prompt = [
    "あなたは日本の小学1年生向け「熟語の読み仮名」穴埋め4択クイズの誤答選択肢を作成しています。",
    `熟語「${entry.exampleWord}」の読み方は「${entry.readingTemplate.replace("○○", targetReading)}」で、`,
    `○○の部分（＝漢字「${entry.kanji}」の読み）は「${targetReading}」です。`,
    `漢字「${entry.kanji}」の正しい読み方は他に ${JSON.stringify(entry.correctReadings)} もあります。`,
    "この4択クイズの誤答選択肢として使う、もっともらしいが誤りである読み方をひらがなで3つ考えてください。",
    "条件:",
    "- ひらがなのみ（漢字・カタカナ・記号を含めない）",
    "- 上に挙げた正しい読み方のいずれとも一致しないこと",
    `- **○○の部分だけを置き換える文字列であること。○○の前後に付いている固定の文字（「${entry.readingTemplate}」の○○以外の部分）を候補の中に含めないこと**`,
    `  （悪い例: ○○が「${targetReading}」・テンプレートが「${entry.readingTemplate}」のとき、` +
      "固定部分と同じ読みで終わる/始まる候補を出すと、当てはめたときに同じ音が二重になる誤り）",
    `- 目安として「${targetReading}」と近い文字数であること（○○の場所を置き換えるだけなので、極端に長い/短い候補は不自然）`,
    "- 小学1年生が読める、日常的な音の並びであること（でたらめな音の羅列にしない）",
    "出力は他の文章を含めず、次のJSON形式のみで返してください:",
    '{"distractors": ["よみ1", "よみ2", "よみ3"]}',
  ].join("\n");

  const endpoint = auth.baseUrl.includes("/chat/completions")
    ? auth.baseUrl
    : `${auth.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.apiKey}`,
    },
    body: JSON.stringify({
      model: auth.model,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`レスポンスにcontentが無い: ${JSON.stringify(data)}`);
  }

  return parseDistractorsFromContent(content);
};

const parseDistractorsFromContent = (content: string): string[] => {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : content;
  const parsed = JSON.parse(jsonText);
  if (!Array.isArray(parsed.distractors)) {
    throw new Error(`distractorsが配列でない: ${jsonText}`);
  }
  return parsed.distractors;
};

/** AIの出力を正解データと機械的に突き合わせて検証する（このスパイクの本題） */
const validateDistractors = (candidates: string[], entry: KanjiMasterEntry): string[] => {
  const seen = new Set<string>();
  const valid: string[] = [];

  // readingTemplateの○○以外の固定部分。候補がこれと同じ文字列で終わる/始まると、
  // ○○に当てはめたときに固定部分が二重になる（例: "○○りょく"に対して"さりょく"を
  // 選ぶと「さりょくりょく」になる）ため、そのような候補は却下する
  const blankIndex = entry.readingTemplate.indexOf("○○");
  const fixedPrefix = entry.readingTemplate.slice(0, blankIndex);
  const fixedSuffix = entry.readingTemplate.slice(blankIndex + 2);

  for (const c of candidates) {
    const candidate = c.trim();
    if (!HIRAGANA_ONLY.test(candidate)) continue; // ひらがな以外は却下
    if (candidate.startsWith("ん")) continue; // 「ん」で始まる語は日本語に存在しない
    if (entry.correctReadings.includes(candidate)) continue; // 正解と偶然一致は却下
    if (seen.has(candidate)) continue; // 重複は却下
    if (fixedSuffix && candidate.endsWith(fixedSuffix)) continue; // 当てはめると固定部分が二重になる
    if (fixedPrefix && candidate.startsWith(fixedPrefix)) continue;
    seen.add(candidate);
    valid.push(candidate);
  }

  return valid;
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。.env.local に設定してください（.env.local.example参照）`,
    );
  }
  return value;
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
