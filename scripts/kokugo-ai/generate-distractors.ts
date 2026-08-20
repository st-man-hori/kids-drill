// 教育漢字API（api.kyoiku-kanji.st-man.com）の学年別データ + さくらのAI
// （誤答生成）から、かんじよみクイズの問題データを作るスクリプト。
// 手動実行が前提（将来的には定期実行での洗い替えを予定）。
//
//   npx tsx scripts/kokugo-ai/generate-distractors.ts [--grade=1]
//
// 出力: src/data/kanji-quiz/grade{N}.json （アプリがそのままimportして使う）
// 生の教育漢字APIレスポンスは scripts/kokugo-ai/output/ にキャッシュする
// （デバッグ用途。gitでは追跡しない。最終成果物は src/data 側のみ）
//
// Yahoo!テキスト解析APIは今回使っていない。教育漢字APIが読み仮名を
// 構造化データとして返すため、形態素解析で読みを抜き出す必要がなかったため

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchKanjiByGrade } from "./lib/kyoiku-kanji-client";
import { selectPrimaryReading } from "./lib/select-reading";
import { generateDistractors, type DistractorTarget } from "./lib/build-distractors";

try {
  // next dev/build は自前でenvを読むが、このスクリプトは単体実行のためNode
  // 20.6+の機構で明示的に読み込む。既に環境変数がある場合や.envが無い場合は
  // 何もしなくてよいのでエラーは握りつぶす
  process.loadEnvFile(path.join(process.cwd(), ".env"));
} catch {
  // noop
}

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_CACHE_DIR = path.join(SCRIPT_DIR, "output");
const DATA_DIR = path.join(SCRIPT_DIR, "..", "..", "src", "data", "kanji-quiz");

const grade = Number(process.argv.find((arg) => arg.startsWith("--grade="))?.split("=")[1] ?? "1");

type KanjiQuizQuestion = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
  distractors: string[];
  exampleWord: string;
  meaning: string;
};

type Target = DistractorTarget & { exampleWord: string; meaning: string };

const main = async () => {
  console.log(`[1/4] fetching grade ${grade} kanji from kyoiku-kanji API...`);
  const entries = await fetchKanjiByGrade(grade);
  console.log(`  got ${entries.length} kanji`);

  await mkdir(OUTPUT_CACHE_DIR, { recursive: true });
  await writeFile(
    path.join(OUTPUT_CACHE_DIR, `kanji-master.grade${grade}.json`),
    JSON.stringify(entries, null, 2),
    "utf-8",
  );

  console.log("[2/4] selecting the primary reading for each kanji...");
  const targets: Target[] = [];
  for (const entry of entries) {
    const selected = selectPrimaryReading(entry);
    if (!selected) {
      console.warn(`  skip ${entry.kanji}: no bare (non-okurigana) reading found`);
      continue;
    }
    targets.push({
      id: `${entry.kanji}-${selected.reading}`,
      kanji: entry.kanji,
      correctReading: selected.reading,
      readingType: selected.readingType,
      exampleWord: entry.examples[0]?.word ?? "",
      meaning: entry.meaning,
    });
  }
  console.log(`  ${targets.length} questions to generate distractors for`);

  console.log("[3/4] generating distractors via Sakura AI...");
  const distractorsById = await generateDistractors(targets, (message) =>
    console.log(`  ${message}`),
  );

  console.log("[4/4] writing question bank...");
  const questions: KanjiQuizQuestion[] = targets.map((target) => ({
    id: target.id,
    kanji: target.kanji,
    correctReading: target.correctReading,
    readingType: target.readingType,
    distractors: distractorsById[target.id] ?? [],
    exampleWord: target.exampleWord,
    meaning: target.meaning,
  }));

  await mkdir(DATA_DIR, { recursive: true });
  const outputPath = path.join(DATA_DIR, `grade${grade}.json`);
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        grade,
        generatedAt: new Date().toISOString(),
        source: {
          kanjiApi: "https://api.kyoiku-kanji.st-man.com/v1/kanji",
          distractorModel: process.env.SAKURA_AI_MODEL,
        },
        questions,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(`done: ${outputPath} (${questions.length} questions)`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
