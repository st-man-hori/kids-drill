// ランキングの純粋なロジック。DBアクセスは持ち込まない（ranking-store.tsに置く）。
// 一次情報源は docs/game-design.md の「ランキング設計」。

// docs: 「見せ方はやさしく...詳細な数値順位は任意で見られる程度に留める」。
// 表に出す上位者は最小限の件数にする
export const RANKING_DISPLAY_LIMIT = 10;

// docs: 「週間リセット」。月曜0時を週の始まりとする。
// サーバーの実行タイムゾーンに依存する（対象がほぼ国内利用のため、デプロイ先を
// 日本時間に合わせておく前提。src/lib/greeting.tsと同じ考え方）
export const getWeekStart = (date: Date): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  // getDay(): 日=0, 月=1, ..., 土=6 → 月曜からの経過日数に変換する
  const daysSinceMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

// 「じょうい◯%」バッジ用のパーセンタイル。rankは1始まり
// （1位＝いちばん上位）。同学年・今週挑戦した人数の中での位置を返す
export const percentile = (rank: number, totalParticipants: number): number => {
  if (totalParticipants <= 0) return 100;
  return Math.max(1, Math.ceil((rank / totalParticipants) * 100));
};
