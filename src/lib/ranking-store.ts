import { and, desc, eq, gte, max } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles, timeAttackRuns } from "@/db/schema";
import { RANKING_DISPLAY_LIMIT, getWeekStart } from "@/lib/ranking";

// ランキングのDBアクセス。判定そのものはranking.tsの純粋関数に寄せてある。
//
// docs/data-model.md: 「ランキングは専用テーブルを持たず、time_attack_runsを
// 都度集計するクエリベースにする」。学年別セグメント・週間リセットは
// ここで都度フィルタする。

export type RankingRow = {
  childId: string;
  nickname: string;
  score: number;
  isSelf: boolean;
};

export type RankingView = {
  // 全期間の自己ベスト。自己ベストとの比較を主役にする（docs/game-design.md）
  allTimeBest: number;
  // 今週の自己ベスト。今週まだ挑戦していなければnull
  weeklyBest: number | null;
  // 今週・同学年内での順位（1始まり）。未挑戦ならnull
  rank: number | null;
  // 今週・同学年で挑戦した人数
  totalParticipants: number;
  // 上位者一覧（最大RANKING_DISPLAY_LIMIT件）
  topRows: RankingRow[];
};

export const getRanking = async (childId: string): Promise<RankingView> => {
  const child = await db.query.childProfiles.findFirst({
    where: eq(childProfiles.id, childId),
  });
  if (!child) throw new Error("子どものプロフィールが見つかりません");

  const weekStart = getWeekStart(new Date());
  const bestScore = max(timeAttackRuns.correctCount);

  // 同学年・今週の、子どもごとの最高スコアをスコア降順で並べる
  const weeklyBests = await db
    .select({
      childId: timeAttackRuns.childId,
      nickname: childProfiles.displayNickname,
      score: bestScore,
    })
    .from(timeAttackRuns)
    .innerJoin(childProfiles, eq(timeAttackRuns.childId, childProfiles.id))
    .where(and(eq(childProfiles.grade, child.grade), gte(timeAttackRuns.playedAt, weekStart)))
    .groupBy(timeAttackRuns.childId, childProfiles.displayNickname)
    .orderBy(desc(bestScore));

  const totalParticipants = weeklyBests.length;
  const rankIndex = weeklyBests.findIndex((row) => row.childId === childId);
  const rank = rankIndex === -1 ? null : rankIndex + 1;
  const weeklyBest = rankIndex === -1 ? null : Number(weeklyBests[rankIndex].score);

  const [allTime] = await db
    .select({ best: max(timeAttackRuns.correctCount) })
    .from(timeAttackRuns)
    .where(eq(timeAttackRuns.childId, childId));

  const topRows: RankingRow[] = weeklyBests.slice(0, RANKING_DISPLAY_LIMIT).map((row) => ({
    childId: row.childId,
    nickname: row.nickname,
    score: Number(row.score),
    isSelf: row.childId === childId,
  }));

  return {
    allTimeBest: Number(allTime?.best ?? 0),
    weeklyBest,
    rank,
    totalParticipants,
    topRows,
  };
};
