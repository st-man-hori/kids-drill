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

// パーセンタイル（1〜100、小さいほど上位）。rankは1始まり（1位＝いちばん上位）。
// 同学年・今週挑戦した人数の中での位置を返す。%という表現は小学校低学年には
// まだ理解できない（算数で習うのはもっと後）ため、直接画面には出さない
// （→ rankTier）。バケット分けの材料としてのみ使う
export const percentile = (rank: number, totalParticipants: number): number => {
  if (totalParticipants <= 0) return 100;
  return Math.max(1, Math.ceil((rank / totalParticipants) * 100));
};

export type RankTier = "top" | "middle" | "growing";

// %の数字を出す代わりに、ざっくりした言葉のグループに変換する。
// 境界値はプロトタイプとしての目安（後でバランスを見て調整する前提）
const RANK_TIER_TOP_MAX_PERCENTILE = 20;
const RANK_TIER_MIDDLE_MAX_PERCENTILE = 60;

// rankTierの表示文言。docs/design.mdの文言ルール（平仮名/カタカナのみ）と
// 「否定的な言葉は使わない」方針に沿い、いちばん下の段階でも前向きな表現にする
export const RANK_TIER_LABEL: Record<RankTier, string> = {
  top: "じょうい グループだよ！",
  middle: "まんなかへんだよ",
  growing: "これから ぐんぐん のびるよ",
};

// 1〜3位は参加人数によらず常にtop扱いにする。参加者がまだ少ない
// （サービス立ち上げ初期・マイナーな学年）とパーセンタイルだけでは
// 「1位なのにtopにならない」ことが起きるため（例: 4人中1位は25%）
const ALWAYS_TOP_RANK = 3;

export const rankTier = (rank: number, totalParticipants: number): RankTier => {
  if (rank <= ALWAYS_TOP_RANK) return "top";

  const value = percentile(rank, totalParticipants);
  if (value <= RANK_TIER_TOP_MAX_PERCENTILE) return "top";
  if (value <= RANK_TIER_MIDDLE_MAX_PERCENTILE) return "middle";
  return "growing";
};
