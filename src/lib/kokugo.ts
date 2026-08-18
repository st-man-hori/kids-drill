// よみがなモード（国語スパイク）の出題まわりの純粋なロジック。practice.tsと同じく
// KokugoSession（Client Component）からも読み込むため、DBアクセスやnode専用APIを
// 持ち込まないこと。DBを触る進捗まわりは kokugo-progress.ts 側に置いている。
//
// レベルアップ・降級・ポイント計算・お祝いの段階（shouldLevelUp / calculatePoints /
// celebrationTier など）はresults: boolean[]だけを見る教科非依存のロジックなので、
// practice.tsのものをそのまま使う（docs/architecture.md「報酬まわりはそのまま流用できる」）。

export const KOKUGO_SUBJECT_SLUG = "kokugo";
export const KANJI_YOMI_SKILL_TYPE = "kanji_yomi";

// 同じ漢字が連続で出るのを避けるための引き直し回数。practice.tsのMAX_REDRAWSと同じ考え方
const MAX_REDRAWS = 8;

export type KanjiQuestionBankEntry = {
  id: string;
  kanji: string;
  correctReading: string;
  distractorReadings: string[];
};

export type KanjiQuestion = {
  id: string;
  kanji: string;
  correctReading: string;
  // 正解を含む4択。表示順はシャッフル済み
  choices: string[];
};

// 出題はゲーム用の乱数で、暗号学的な安全性は不要（practice.tsのrandomIntInRangeと
// 同じ理由でnode:cryptoは使わない。ブラウザ・サーバー両方で動く必要がある）
const shuffle = <T,>(items: readonly T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const toQuestion = (entry: KanjiQuestionBankEntry): KanjiQuestion => ({
  id: entry.id,
  kanji: entry.kanji,
  correctReading: entry.correctReading,
  choices: shuffle([entry.correctReading, ...entry.distractorReadings]),
});

// レベルの問題バンク(pool)からcount問選ぶ。poolがcountより少ないレベルもある
// ため（このプロトタイプでは1レベル5字）、重複ありで選ぶが、直前と同じ漢字が
// 連続しないようには引き直す。
export const pickKanjiQuestions = (
  pool: readonly KanjiQuestionBankEntry[],
  count: number,
): KanjiQuestion[] => {
  if (pool.length === 0) return [];

  const questions: KanjiQuestion[] = [];
  for (let i = 0; i < count; i++) {
    let entry = pool[Math.floor(Math.random() * pool.length)];
    const previous = questions[questions.length - 1];
    for (
      let redraw = 0;
      redraw < MAX_REDRAWS && pool.length > 1 && previous && previous.kanji === entry.kanji;
      redraw++
    ) {
      entry = pool[Math.floor(Math.random() * pool.length)];
    }
    questions.push(toQuestion(entry));
  }

  return questions;
};
