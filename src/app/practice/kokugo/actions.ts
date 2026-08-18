"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles, practiceSessions } from "@/db/schema";
import { auth } from "@/auth";
import { TOTAL_QUESTIONS, calculatePoints, shouldLevelUp } from "@/lib/practice";
import { KANJI_YOMI_SKILL_TYPE, type KanjiQuestionBankEntry } from "@/lib/kokugo";
import {
  advanceToNextLevel,
  demoteIfStruggling,
  getCurrentLevel,
  getKanjiQuestionPool,
} from "@/lib/kokugo-progress";
import { grantUnlockedFreeItems } from "@/lib/wardrobe-store";

// practice/add/actions.tsのsubmitPracticeSessionと同じ構造。コメントの詳細はそちらを参照

export type KokugoSessionResult = {
  pointsEarned: number;
  unlockedItems: string[];
  leveledUp: boolean;
  levelNumber: number;
  // クライアントは「もっとやる」で出す次の10問をこのpoolから選ぶ
  pool: KanjiQuestionBankEntry[];
};

export const submitKokugoSession = async ({
  results,
  startedAt,
}: {
  results: boolean[];
  startedAt: string;
}): Promise<KokugoSessionResult | null> => {
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
  const startedAtDate =
    Number.isNaN(parsedStartedAt.getTime()) || parsedStartedAt > finishedAt
      ? finishedAt
      : parsedStartedAt;

  const level = await getCurrentLevel(childId, KANJI_YOMI_SKILL_TYPE);

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
    await db
      .update(childProfiles)
      .set({ pointsBalance: sql`${childProfiles.pointsBalance} + ${pointsEarned}` })
      .where(eq(childProfiles.id, childId));
  }

  const leveledUp = shouldLevelUp(results);
  const nextLevel = leveledUp
    ? await advanceToNextLevel(childId, KANJI_YOMI_SKILL_TYPE, level.levelNumber)
    : await demoteIfStruggling(childId, KANJI_YOMI_SKILL_TYPE, level);

  let unlockedItems: string[] = [];
  try {
    const granted = await grantUnlockedFreeItems(childId);
    unlockedItems = granted.map((item) => item.name);
  } catch (error) {
    console.error(error);
  }

  const finalLevel = nextLevel ?? level;
  const pool = await getKanjiQuestionPool(finalLevel.id);

  return {
    pointsEarned,
    unlockedItems,
    leveledUp: leveledUp && nextLevel !== null,
    levelNumber: finalLevel.levelNumber,
    pool,
  };
};
