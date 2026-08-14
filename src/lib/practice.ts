// 出題・採点まわりの純粋なロジック。PracticeSession（Client Component）からも
// 読み込むため、このファイルにはDBアクセスやnode専用APIを持ち込まないこと。
// DBを触る進捗まわりは practice-progress.ts 側に置いている。

// 1セッション（＝practice_sessions 1レコード）の問題数。docs/game-design.md の
// 「デフォルト10問」および「直近10問中8問正解で次のレベルへ」の10。
export const TOTAL_QUESTIONS = 10;

// レベルアップ判定の正解数（TOTAL_QUESTIONS問中）
export const LEVEL_UP_CORRECT_COUNT = 8;

// 降級判定（docs/game-design.md）。この正解数以下のセッションが
// LEVEL_DOWN_STREAK回続いたらレベルを1つ下げる。
// 4問以下なのは「当てずっぽうでも当たる範囲を下回っている」水準だから。
// 2回連続を条件にするのは、眠い・気が散ったといった1回のコケで下げないため。
export const LEVEL_DOWN_CORRECT_COUNT = 4;
export const LEVEL_DOWN_STREAK = 2;

// 獲得ポイント（docs/game-design.md）。着せ替えアイテムの価格が未定のため
// 暫定値で、アイテム実装時にバランス調整する前提の数値。
export const POINTS_PER_CORRECT = 10;
export const PERFECT_BONUS_POINTS = 50;

// 何問連続で正解したらコンボ演出を出すか
export const COMBO_THRESHOLD = 3;

// 自動で次の問題へ進むまでの待ち時間(ms)。正解・不正解どちらも自動で進めるが、
// 不正解のときは正しい答えに目をやる時間が要るので長めに取る
// （シェイク演出0.4秒 + 答えを見る時間）。
export const CORRECT_ADVANCE_DELAY_MS = 800;
export const INCORRECT_ADVANCE_DELAY_MS = 2500;

export type LevelConfig = {
  minA: number;
  maxA: number;
  minB: number;
  maxB: number;
  carry: boolean;
};

export type Question = { a: number; b: number; answer: number };

// たし算のskill_type（difficulty_levels.skill_type）。ひき算追加時は "subtract" を足す
export const ADD_SKILL_TYPE = "add";

// docs/game-design.md のたし算Lv1〜5。carryは「一の位の繰り上がりが
// 発生するか」で判定する（(a % 10) + b >= 10）。1桁+1桁でも2桁+1桁でも
// 同じ式で扱える。docsの「和≤10 / 和11〜18」という表現とは、和がちょうど
// 10のときの扱いが1問分だけ異なりうるが、docs自体が「たたき台」と
// 明記している範囲の調整として、carryの数学的な定義に忠実にした。
//
// 注意: 実行時にアプリが読むのはDBの difficulty_levels.config であって、この配列
// ではない（practice-progress.ts）。ここはレベル設計の原稿とテスト用の値であり、
// 変更してもマイグレーションを追加しない限り本番の出題は変わらない。
export const ADD_LEVELS: readonly LevelConfig[] = [
  { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: false }, // Lv1: 1桁+1桁、繰り上がりなし
  { minA: 1, maxA: 9, minB: 1, maxB: 9, carry: true }, // Lv2: 1桁+1桁、繰り上がりあり
  { minA: 10, maxA: 10, minB: 1, maxB: 9, carry: false }, // Lv3: 10+1桁
  { minA: 11, maxA: 19, minB: 1, maxB: 9, carry: false }, // Lv4: 2桁(11〜19)+1桁、繰り上がりなし
  { minA: 11, maxA: 19, minB: 1, maxB: 9, carry: true }, // Lv5: 2桁(11〜19)+1桁、繰り上がりあり
];

const MAX_ATTEMPTS = 100;

// 同じ問題が連続で出るのを避けるための引き直し回数。Lv3のように組み合わせが
// 9通りしかないレベルもあるため、引き直しは有限回で諦める（諦めても
// 「たまに連続する」だけで、出題自体は成立する）。
const MAX_REDRAWS = 8;

const hasCarry = (a: number, b: number) => (a % 10) + b >= 10;

// 出題はゲーム用の乱数で、暗号学的な安全性は不要（signup用のcredentials.ts
// とは異なりnode:cryptoは使わない）。ブラウザ・サーバーどちらでも動く必要が
// あるため（PracticeSessionはClient Componentからこの関数を呼ぶ）Math.random
// を使う。node:cryptoをここで使うと、クライアント向けバンドル時にNext.jsが
// node:cryptoをcrypto-browserify（randomInt未実装）へ差し替えてしまい壊れる。
const randomIntInRange = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const generateQuestion = (config: LevelConfig): Question => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const a = randomIntInRange(config.minA, config.maxA);
    const b = randomIntInRange(config.minB, config.maxB);
    if (hasCarry(a, b) === config.carry) {
      return { a, b, answer: a + b };
    }
  }
  // 条件を満たす組み合わせが極端に少ない設定ミス時のフォールバック
  const a = config.minA;
  const b = config.minB;
  return { a, b, answer: a + b };
};

export const generateQuestions = (config: LevelConfig, count: number): Question[] => {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    let question = generateQuestion(config);
    const previous = questions[questions.length - 1];
    for (
      let redraw = 0;
      redraw < MAX_REDRAWS && previous && previous.a === question.a && previous.b === question.b;
      redraw++
    ) {
      question = generateQuestion(config);
    }
    questions.push(question);
  }

  return questions;
};

// 入力欄の桁数上限。そのレベルで出る最大の答えの桁数までしか入力させない
// （何桁でも打ててしまうと、子どもが誤って長い数字を入力したときに表示が壊れる）
export const answerMaxLength = (config: LevelConfig): number =>
  String(config.maxA + config.maxB).length;

// docs/game-design.md「直近10問中8問正解で次のレベルへ」。1セッション=10問で
// 運用しているため通常は直近1セッション分の判定になるが、定義に忠実に
// 「最後のTOTAL_QUESTIONS問」で評価する。
export const shouldLevelUp = (results: readonly boolean[]): boolean => {
  if (results.length < TOTAL_QUESTIONS) return false;
  const recent = results.slice(-TOTAL_QUESTIONS);
  return recent.filter(Boolean).length >= LEVEL_UP_CORRECT_COUNT;
};

// 1セッション分の記録が「手が出ていない」水準かどうか。practice_sessionsの
// レコードから判定するため、resultsの配列ではなく件数で受ける。
// 「もっとやる」の途中終了など10問に満たないセッションは判定に含めない
// （shouldLevelUpが満了セッションのみを見るのと揃えている）。
export const isStrugglingSession = (session: {
  correctCount: number;
  totalQuestions: number;
}): boolean =>
  session.totalQuestions >= TOTAL_QUESTIONS &&
  session.correctCount <= LEVEL_DOWN_CORRECT_COUNT;

// 結果画面の祝い方の段階。しきい値はレベルの昇降とわざと揃えてある
// （紙吹雪が出る＝レベルアップ圏、いちばん静かな段階＝降級圏）。
// 演出と難易度の手応えがズレないようにするため。
export type CelebrationTier = "perfect" | "great" | "good" | "gentle";

export const celebrationTier = (
  correctCount: number,
  totalQuestions: number,
): CelebrationTier => {
  if (totalQuestions > 0 && correctCount === totalQuestions) return "perfect";
  if (correctCount >= LEVEL_UP_CORRECT_COUNT) return "great";
  if (correctCount > LEVEL_DOWN_CORRECT_COUNT) return "good";
  return "gentle";
};

export const calculatePoints = (results: readonly boolean[]): number => {
  const correctCount = results.filter(Boolean).length;
  const perfect = results.length > 0 && correctCount === results.length;
  return correctCount * POINTS_PER_CORRECT + (perfect ? PERFECT_BONUS_POINTS : 0);
};
