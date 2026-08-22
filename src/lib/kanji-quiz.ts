// 漢字よみクイズ（国語）の出題ロジック。純粋関数のみを置く
// （KanjiQuizSessionというClient Componentからも読み込むため、DBアクセスや
// node専用APIは持ち込まないこと。practice.tsと同じ方針）。
//
// 問題データ自体はコード変更ではなく scripts/kokugo-ai/generate-distractors.ts
// の再実行で作る（教育漢字API + さくらのAIによる例文の難易度選定・誤答生成）。

import grade1Bank from "@/data/kanji-quiz/grade1.json";
import grade2Bank from "@/data/kanji-quiz/grade2.json";
import grade3Bank from "@/data/kanji-quiz/grade3.json";
import grade4Bank from "@/data/kanji-quiz/grade4.json";

export type KanjiQuizQuestion = {
  id: string;
  kanji: string;
  correctReading: string;
  readingType: "on" | "kun";
  // 教育漢字APIが返す画数。難易度レベルの区切り（KANJI_LEVELS_BY_GRADE）に使う
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

// 問題バンクが生成済み＝出題可能な学年。5・6年生ぶんはまだ生成していないため
// 対象外（docs/architecture.md「かんじよみクイズ」）
export const KANJI_SUPPORTED_GRADES: readonly number[] = [1, 2, 3, 4];

export const isKanjiSupportedGrade = (grade: number): boolean =>
  KANJI_SUPPORTED_GRADES.includes(grade);

// practice_sessions / difficulty_levels の skill_type に記録する値。学年ごとに
// バンク・レベルのしきい値が違う（下記KANJI_LEVELS_BY_GRADE）ため、学年別に分けている
export const kanjiSkillType = (grade: number): string => `kanji_reading_grade${grade}`;

export type KanjiLevelConfig = {
  // このレベルで出題してよい画数の上限。nullは上限なし（＝その学年の全字が対象）。
  // 難易度軸に画数を使うのは、どの字を学校で習ったかはアプリから分からない
  // （docs/architecture.md「かんじよみクイズ」）が、画数はどの子にも共通して
  // 測れる指標だから（たし算の「繰り上がりの有無」と同じ発想）
  maxStrokeCount: number | null;
};

// 学年ごとの画数分布から、各学年をおよそ4等分するしきい値を決めている
// （累計字数がtotal*1/4, 2/4, 3/4に最も近い画数を境目に選ぶ）。学年が上がるほど
// 字数も画数も増えるため、しきい値は学年ごとに別々に持つ必要がある
// （grade1の3/4/6画をそのまま他学年に流用すると、grade2以降は偏った区切りになる）。
// 上のレベルほど画数の上限が上がるが下限は設けていない＝レベルが上がるほど
// 出題プールが広がる（すでに解けるようになった易しい字も引き続き出題対象に
// 残る。累積方式）。実行時にアプリが読むのはDBのdifficulty_levels.config
// （ADD_LEVELSと同じ扱い。practice.ts参照）で、この定義は設計の原稿とテスト用の値
export const KANJI_LEVELS_BY_GRADE: Readonly<Record<number, readonly KanjiLevelConfig[]>> = {
  1: [{ maxStrokeCount: 3 }, { maxStrokeCount: 4 }, { maxStrokeCount: 6 }, { maxStrokeCount: null }],
  2: [{ maxStrokeCount: 5 }, { maxStrokeCount: 7 }, { maxStrokeCount: 10 }, { maxStrokeCount: null }],
  3: [{ maxStrokeCount: 7 }, { maxStrokeCount: 9 }, { maxStrokeCount: 11 }, { maxStrokeCount: null }],
  4: [{ maxStrokeCount: 7 }, { maxStrokeCount: 9 }, { maxStrokeCount: 12 }, { maxStrokeCount: null }],
};

const KANJI_BANKS_BY_GRADE: Readonly<Record<number, KanjiQuizQuestion[]>> = {
  1: (grade1Bank as { questions: KanjiQuizQuestion[] }).questions,
  2: (grade2Bank as { questions: KanjiQuizQuestion[] }).questions,
  3: (grade3Bank as { questions: KanjiQuizQuestion[] }).questions,
  4: (grade4Bank as { questions: KanjiQuizQuestion[] }).questions,
};

const BANK = KANJI_BANKS_BY_GRADE[1];

// その学年の問題バンクを返す。未生成の学年（5・6年生）は空配列——KanjiQuizSession
// は問題が0件のとき「もんだいが まだ ないみたい」と案内するだけなので、
// 呼び出し側で特別扱いしなくても安全に空のまま流せる
export const kanjiBankForGrade = (grade: number): readonly KanjiQuizQuestion[] =>
  KANJI_BANKS_BY_GRADE[grade] ?? [];

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
