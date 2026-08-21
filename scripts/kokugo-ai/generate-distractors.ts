// 教育漢字API（api.kyoiku-kanji.st-man.com）の学年別データ + さくらのAI
// （誤答プール生成）から、かんじよみクイズの問題データを作るスクリプト。
// 手動実行が前提。
//
//   npx tsx scripts/kokugo-ai/generate-distractors.ts [--grade=1] [--grades=1-6]
//
// --grades=1-6 のように範囲指定すると複数学年をまとめて処理する。1学年ずつ
// 順に処理し、学年が終わるたびにファイルを書き出すので、途中で落ちても
// それまでの学年ぶんは残る。省略時は --grade=1 のみを処理する
//
// 出力: src/data/kanji-quiz/grade{N}.json （アプリがそのままimportして使う）
// 生の教育漢字APIレスポンスは scripts/kokugo-ai/output/ にキャッシュする
// （デバッグ用途。gitでは追跡しない。最終成果物は src/data 側のみ）
//
// 誤答は1回の生成で終わらせず、字ごとに複数ラウンド・1字1リクエストで
// プールを積み増す方式にしている（scripts/kokugo-ai/lib/build-distractors.ts）。
// アプリ側はプレイのたびにプールから一部をランダムサンプリングして4択を作る
// （src/lib/kanji-quiz.ts）ので、同じ字でも毎回同じ誤答セットにならない
//
// Yahoo!テキスト解析APIは今回使っていない。教育漢字APIが読み仮名を
// 構造化データとして返すため、形態素解析で読みを抜き出す必要がなかったため

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchKanjiByGrade } from "./lib/kyoiku-kanji-client";
import { selectPrimaryReading } from "./lib/select-reading";
import { generateDistractorPools, type DistractorTarget } from "./lib/build-distractors";

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

const parseGrades = (): number[] => {
  const rangeArg = process.argv.find((arg) => arg.startsWith("--grades="))?.split("=")[1];
  if (rangeArg) {
    const rangeMatch = rangeArg.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const start = Number(rangeMatch[1]);
      const end = Number(rangeMatch[2]);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    return rangeArg.split(",").map(Number);
  }
  const gradeArg = process.argv.find((arg) => arg.startsWith("--grade="))?.split("=")[1];
  return [Number(gradeArg ?? "1")];
};

type KanjiQuizQuestion = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
  distractorPool: string[];
  exampleWord: string;
  maskedReading: string;
  meaning: string;
};

type Target = DistractorTarget & {
  exampleWord: string;
  maskedReading: string;
  meaning: string;
};

const processGrade = async (grade: number): Promise<void> => {
  console.log(`\n=== grade ${grade} ===`);

  console.log(`[1/4] fetching grade ${grade} kanji from kyoiku-kanji API...`);
  const entries = await fetchKanjiByGrade(grade);
  console.log(`  got ${entries.length} kanji`);

  await mkdir(OUTPUT_CACHE_DIR, { recursive: true });
  await writeFile(
    path.join(OUTPUT_CACHE_DIR, `kanji-master.grade${grade}.json`),
    JSON.stringify(entries, null, 2),
    "utf-8",
  );

  console.log("[2/4] selecting a reading + disambiguating example for each kanji...");
  const targets: Target[] = [];
  for (const entry of entries) {
    const selected = selectPrimaryReading(entry);
    // 用例から読みを一意に切り出せなかった字は出題しない（文脈なしで「この字の
    // 読みは？」と聞くと、複数の読みを持つ字で誤答が実は別の場面の正しい読み
    // だった、という事故が起きるため。詳細はselect-reading.tsのコメント参照）
    if (!selected || !selected.example) {
      console.warn(`  skip ${entry.kanji}: no unambiguous example-based reading found`);
      continue;
    }
    targets.push({
      id: `${entry.kanji}-${selected.reading}`,
      kanji: entry.kanji,
      correctReading: selected.reading,
      readingType: selected.readingType,
      exampleWord: selected.example.word,
      maskedReading: selected.example.maskedReading,
      meaning: entry.meaning,
    });
  }
  console.log(`  ${targets.length}/${entries.length} kanji have a usable question`);

  console.log(`[3/4] generating distractor pools via Sakura AI (${targets.length} kanji)...`);
  const poolsById = await generateDistractorPools(targets, (message) =>
    console.log(`  ${message}`),
  );

  console.log("[4/4] writing question bank...");
  const questions: KanjiQuizQuestion[] = targets.map((target) => ({
    id: target.id,
    kanji: target.kanji,
    correctReading: target.correctReading,
    readingType: target.readingType,
    distractorPool: poolsById[target.id] ?? [],
    exampleWord: target.exampleWord,
    maskedReading: target.maskedReading,
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

const main = async () => {
  const grades = parseGrades();
  console.log(`grades to process: ${grades.join(", ")}`);
  for (const grade of grades) {
    await processGrade(grade);
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
