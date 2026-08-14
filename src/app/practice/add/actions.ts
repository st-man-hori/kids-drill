"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles, practiceSessions } from "@/db/schema";
import { auth } from "@/auth";
import {
  ADD_SKILL_TYPE,
  TOTAL_QUESTIONS,
  calculatePoints,
  shouldLevelUp,
  type LevelConfig,
} from "@/lib/practice";
import {
  advanceToNextLevel,
  demoteIfStruggling,
  getCurrentLevel,
} from "@/lib/practice-progress";

export type PracticeSessionResult = {
  pointsEarned: number;
  leveledUp: boolean;
  // レベルが変わった場合は変更後のレベル、変わらなければ今のレベル。
  // クライアントは「もっとやる」で出す次の10問をこのconfigから生成する。
  // 降級した場合もここが下のレベルになるが、leveledUpはfalseのまま
  levelNumber: number;
  config: LevelConfig;
};

// クライアントから受け取るのは「各問に正解したかどうか」だけにしている。
// レベル（＝どの問題を解いたか）と獲得ポイントはサーバー側でchild_progressから
// 導出する。Server Actionは直接POSTできてしまうため、点数やレベルIDを
// クライアント申告のまま信用しないこと（docs: Next.jsのServer Actionsガイド）。
export const submitPracticeSession = async ({
  results,
  startedAt,
}: {
  results: boolean[];
  startedAt: string;
}): Promise<PracticeSessionResult | null> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return null;

  if (
    !Array.isArray(results) ||
    results.length === 0 ||
    results.length > TOTAL_QUESTIONS ||
    results.some((result) => typeof result !== "boolean")
  ) {
    return null;
  }

  const finishedAt = new Date();
  const parsedStartedAt = new Date(startedAt);
  // 不正な値・未来の日時が来たら終了時刻で代替する（記録が壊れるのを防ぐ）
  const startedAtDate =
    Number.isNaN(parsedStartedAt.getTime()) || parsedStartedAt > finishedAt
      ? finishedAt
      : parsedStartedAt;

  const level = await getCurrentLevel(childId, ADD_SKILL_TYPE);

  await db.insert(practiceSessions).values({
    childId,
    levelId: level.id,
    totalQuestions: results.length,
    correctCount: results.filter(Boolean).length,
    startedAt: startedAtDate,
    finishedAt,
  });

  const pointsEarned = calculatePoints(results);
  if (pointsEarned > 0) {
    // 読んでから書くとセッションが重なったときに加算が消えるため、SQL側で加算する
    await db
      .update(childProfiles)
      .set({ pointsBalance: sql`${childProfiles.pointsBalance} + ${pointsEarned}` })
      .where(eq(childProfiles.id, childId));
  }

  // レベル変更の判定は「このセッションを終えた時点」で行う。practice_sessionsは
  // 変更前のレベルで記録済みなので、先に記録→後で判定の順にしている
  // （降級判定は今回のセッションを含む直近の記録を見るため、この順序が必要）。
  const leveledUp = shouldLevelUp(results);
  const nextLevel = leveledUp
    ? await advanceToNextLevel(childId, ADD_SKILL_TYPE, level.levelNumber)
    : await demoteIfStruggling(childId, ADD_SKILL_TYPE, level);

  return {
    pointsEarned,
    // 降級は演出しない（レベルが下がったことを子どもに告げない）ため、
    // 昇級したときだけtrueにする
    leveledUp: leveledUp && nextLevel !== null,
    levelNumber: (nextLevel ?? level).levelNumber,
    config: (nextLevel ?? level).config,
  };
};
