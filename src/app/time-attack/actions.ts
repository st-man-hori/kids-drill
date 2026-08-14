"use server";

import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { timeAttackRuns } from "@/db/schema";
import { auth } from "@/auth";
import { ADD_SKILL_TYPE } from "@/lib/practice";
import { getMathSubjectId } from "@/lib/practice-progress";
import {
  TIME_ATTACK_DURATION_SECONDS,
  isValidTimeAttackCorrectCount,
} from "@/lib/time-attack";
import { grantUnlockedFreeItems } from "@/lib/wardrobe-store";

export type TimeAttackResult = {
  correctCount: number;
  isNewBest: boolean;
  allTimeBest: number;
  unlockedItems: string[];
};

// クライアントから受け取るのは正解数だけ。採点自体（各問の正誤判定）は
// 練習モードのresultsと同じくクライアント側の入力チェックに依存しているが、
// 際限なく大きい値が送られないよう範囲だけは検証する（isValidTimeAttackCorrectCount）。
export const submitTimeAttackRun = async ({
  correctCount,
}: {
  correctCount: number;
}): Promise<TimeAttackResult | null> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return null;

  if (!isValidTimeAttackCorrectCount(correctCount)) return null;

  const subjectId = await getMathSubjectId();

  const [previousBest] = await db
    .select({ best: max(timeAttackRuns.correctCount) })
    .from(timeAttackRuns)
    .where(eq(timeAttackRuns.childId, childId));
  // max()はドライバによって文字列で返ることがある（wardrobe-store.tsと同じ理由）
  const previousBestScore = Number(previousBest?.best ?? 0);

  await db.insert(timeAttackRuns).values({
    childId,
    subjectId,
    skillType: ADD_SKILL_TYPE,
    correctCount,
    durationSeconds: TIME_ATTACK_DURATION_SECONDS,
  });

  // 解放条件つきの着せ替えアイテムを配る（time_attack_score条件がここで
  // 満たされることがある）。配布に失敗してもゲーム自体は続けられるようにする
  let unlockedItems: string[] = [];
  try {
    const granted = await grantUnlockedFreeItems(childId);
    unlockedItems = granted.map((item) => item.name);
  } catch (error) {
    console.error(error);
  }

  return {
    correctCount,
    isNewBest: correctCount > previousBestScore,
    allTimeBest: Math.max(previousBestScore, correctCount),
    unlockedItems,
  };
};
