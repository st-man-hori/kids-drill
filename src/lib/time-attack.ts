// タイムアタックモードの純粋なロジック・定数。DBアクセスやnode専用APIは
// 持ち込まないこと（TimeAttackSessionはClient Componentからも読み込むため）。
// 一次情報源は docs/game-design.md の「モード設計」。

// docs: 「60秒間固定」
export const TIME_ATTACK_DURATION_SECONDS = 60;

// docs: 「不正解には数秒のペナルティ（例: 3秒ロス）を課し、速さと正確さの
// バランスを取る」
export const TIME_ATTACK_PENALTY_SECONDS = 3;

// カウントダウンの更新間隔(ms)
export const TIME_ATTACK_TICK_MS = 100;

// 正誤フラッシュの表示時間(ms)。docs:「フィードバックは最小限
// （○✕を一瞬フラッシュ、ペナルティ時のみ「-3秒」を一瞬添える程度）で、
// テンポを止めない」ため、練習モードの待ち時間より大幅に短くしている。
// 表示中も次の問題へはすぐ進めるようにする（キー入力を止めない）
export const TIME_ATTACK_FLASH_MS = 450;

// 連続正解のボーナス。docs/game-design.md「連続正解でタイムボーナス」。
// ペナルティと同じ3秒にしているのは、子どもにとって「3秒」を得も損も
// 共通のものさしとして理解しやすくするため
export const TIME_ATTACK_COMBO_STREAK = 5;
export const TIME_ATTACK_COMBO_BONUS_SECONDS = 3;

// 連続正解数がボーナスの節目(5, 10, 15...)かどうか。streakは0始まりではなく
// 「今の連続正解数」をそのまま渡す想定
export const isComboMilestone = (streak: number): boolean =>
  streak > 0 && streak % TIME_ATTACK_COMBO_STREAK === 0;

// correctCountはクライアント申告値（採点自体がクライアント側の入力チェックで
// 行われるのは練習モードのresultsと同じ。src/app/practice/add/actions.tsの
// コメント参照）。際限なく大きい値が来ないよう、60秒間で理論上あり得る範囲で
// ガードする（最速でも1問0.2秒はかかる前提で60÷0.2=300。余裕を見て500とする）
export const TIME_ATTACK_MAX_SANE_CORRECT_COUNT = 500;

export const isValidTimeAttackCorrectCount = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= TIME_ATTACK_MAX_SANE_CORRECT_COUNT;
