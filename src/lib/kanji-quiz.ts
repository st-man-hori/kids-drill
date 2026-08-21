// 漢字よみクイズ（国語・小1）の出題ロジック。純粋関数のみを置く
// （KanjiQuizSessionというClient Componentからも読み込むため、DBアクセスや
// node専用APIは持ち込まないこと。practice.tsと同じ方針）。
//
// 問題データ自体はコード変更ではなく scripts/kokugo-ai/generate-distractors.ts
// の再実行で作る（教育漢字API + さくらのAIによる誤答生成）。

import grade1Bank from "@/data/kanji-quiz/grade1.json";

export type KanjiQuizQuestion = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
  // 教育漢字APIが返す画数。難易度レベルの区切り（KANJI_LEVELS）に使う
  strokeCount: number;
  // 誤答の候補プール（生成スクリプトが1字あたり複数ラウンドかけて作る。
  // scripts/kokugo-ai/lib/build-distractors.ts）。プレイのたびにこの中から
  // 3件だけランダムサンプリングするので、同じ字でも毎回同じ4択にならない
  distractorPool: string[];
  exampleWord: string;
  // 対象の字が担う読みだけを○で伏せた熟語のふりがな（例:「○○がく」）。
  // 「この字単体の読みは？」だと複数の読みを持つ字で問いが一意に決まらない
  // （docs/architecture.md「かんじよみクイズ」）ため、出題そのものに含めて
  // 文脈で読みを一意にする
  maskedReading: string;
  meaning: string;
};

export type KanjiQuizChoice = { text: string; correct: boolean };

// exampleWordは「七時（しちじ）」のようにふりがな付きで持っている。ふりがなを
// そのまま出題時に見せると答え（maskedReadingで伏せた部分）が漏れるため、
// 熟語のかな表記部分だけを取り除いた「七時」を返す。読みを与えていないので、
// 対象の字以外に小1で習わない字が混ざっていても安全に出題前から見せられる
export const kanjiOnlyWord = (exampleWord: string): string =>
  exampleWord.split(/[（(]/)[0].trim();

export type KanjiQuizQuestionWithChoices = KanjiQuizQuestion & {
  choices: KanjiQuizChoice[];
};

// 練習モードのTOTAL_QUESTIONS(10)に揃える。1回のプレイ感を他モードと揃えるため
export const KANJI_QUIZ_QUESTION_COUNT = 10;

// practice_sessions / difficulty_levels の skill_type に記録する値
export const KANJI_SKILL_TYPE = "kanji_reading";

export type KanjiLevelConfig = {
  // このレベルで出題してよい画数の上限。nullは上限なし（＝そのグレードの
  // 全字が対象）。難易度軸に画数を使うのは、どの字を学校で習ったかは
  // アプリから分からない（docs/architecture.md「かんじよみクイズ」）が、
  // 画数はどの子にも共通して測れる指標だから（たし算の「繰り上がりの有無」と
  // 同じ発想）
  maxStrokeCount: number | null;
};

// grade1（配当漢字80字）の画数分布から決めた区切り。上のレベルほど画数の上限が
// 上がるが、下限は設けていない＝レベルが上がるほど出題プールが広がる
// （すでに解けるようになった易しい字も引き続き出題対象に残る。累積方式）。
// 実行時にアプリが読むのはDBのdifficulty_levels.config（ADD_LEVELSと同じ扱い。
// practice.ts参照）で、この配列は設計の原稿とテスト用の値
export const KANJI_LEVELS: readonly KanjiLevelConfig[] = [
  { maxStrokeCount: 3 }, // Lv1: 1〜3画
  { maxStrokeCount: 4 }, // Lv2: 1〜4画
  { maxStrokeCount: 6 }, // Lv3: 1〜6画
  { maxStrokeCount: null }, // Lv4: 全字
];

const BANK: KanjiQuizQuestion[] = (grade1Bank as { questions: KanjiQuizQuestion[] }).questions;

// 現在のレベルで出題してよい字だけに絞る。generateQuestions（practice.ts）が
// レベルのconfigから問題を生成するのと同じ位置づけで、こちらは固定バンクを
// レベルのconfigでフィルタする
export const kanjiBankForLevel = (
  config: KanjiLevelConfig,
  bank: readonly KanjiQuizQuestion[] = BANK,
): KanjiQuizQuestion[] =>
  bank.filter(
    (question) => config.maxStrokeCount === null || question.strokeCount <= config.maxStrokeCount,
  );

const shuffle = <T,>(items: readonly T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// 出題する問題をランダムにcount問選ぶ（重複なし）。バンクがcount未満でも
// 例外は投げず、あるだけ返す
export const pickKanjiQuestions = (
  count: number = KANJI_QUIZ_QUESTION_COUNT,
  bank: readonly KanjiQuizQuestion[] = BANK,
): KanjiQuizQuestion[] => shuffle(bank).slice(0, Math.min(count, bank.length));

const DISTRACTOR_COUNT = 3;

const sample = <T,>(items: readonly T[], count: number): T[] =>
  shuffle(items).slice(0, Math.min(count, items.length));

// 4択の選択肢をシャッフルして返す。サーバー側（ページ）で呼び、Client
// Componentへは確定済みの配列をpropsとして渡す（Math.randomをクライアント側で
// 引くとSSRとハイドレーションで食い違うため。practice.tsのgenerateQuestionsと同じ理由）
export const buildKanjiChoices = (question: KanjiQuizQuestion): KanjiQuizChoice[] =>
  shuffle([
    { text: question.correctReading, correct: true },
    ...sample(question.distractorPool, DISTRACTOR_COUNT).map((text) => ({
      text,
      correct: false,
    })),
  ]);

export const prepareKanjiQuestions = (
  count: number = KANJI_QUIZ_QUESTION_COUNT,
  bank: readonly KanjiQuizQuestion[] = BANK,
): KanjiQuizQuestionWithChoices[] =>
  pickKanjiQuestions(count, bank).map((question) => ({
    ...question,
    choices: buildKanjiChoices(question),
  }));
