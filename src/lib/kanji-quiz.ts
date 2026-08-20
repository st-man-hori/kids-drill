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
  distractors: string[];
  exampleWord: string;
  meaning: string;
};

export type KanjiQuizChoice = { text: string; correct: boolean };

export type KanjiQuizQuestionWithChoices = KanjiQuizQuestion & {
  choices: KanjiQuizChoice[];
};

// 練習モードのTOTAL_QUESTIONS(10)に揃える。まだポイント・レベル等の
// 報酬経済とは接続していない独立モードだが、1回のプレイ感は他モードと揃える
export const KANJI_QUIZ_QUESTION_COUNT = 10;

const BANK: KanjiQuizQuestion[] = (grade1Bank as { questions: KanjiQuizQuestion[] }).questions;

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

// 4択の選択肢をシャッフルして返す。サーバー側（ページ）で呼び、Client
// Componentへは確定済みの配列をpropsとして渡す（Math.randomをクライアント側で
// 引くとSSRとハイドレーションで食い違うため。practice.tsのgenerateQuestionsと同じ理由）
export const buildKanjiChoices = (question: KanjiQuizQuestion): KanjiQuizChoice[] =>
  shuffle([
    { text: question.correctReading, correct: true },
    ...question.distractors.map((text) => ({ text, correct: false })),
  ]);

export const prepareKanjiQuestions = (
  count: number = KANJI_QUIZ_QUESTION_COUNT,
  bank: readonly KanjiQuizQuestion[] = BANK,
): KanjiQuizQuestionWithChoices[] =>
  pickKanjiQuestions(count, bank).map((question) => ({
    ...question,
    choices: buildKanjiChoices(question),
  }));
