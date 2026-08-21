"use server";

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles, practiceSessions } from "@/db/schema";
import { auth } from "@/auth";
import { calculatePoints, shouldLevelUp } from "@/lib/practice";
import {
  KANJI_QUIZ_QUESTION_COUNT,
  KANJI_SKILL_TYPE,
  type KanjiLevelConfig,
} from "@/lib/kanji-quiz";
import {
  advanceToNextLevel,
  demoteIfStruggling,
  getCurrentLevel,
  getKokugoSubjectId,
} from "@/lib/practice-progress";
import { grantUnlockedFreeItems } from "@/lib/wardrobe-store";

export type KanjiQuizSessionResult = {
  pointsEarned: number;
  unlockedItems: string[];
  leveledUp: boolean;
};

// たしざん練習（practice/add/actions.ts）と同じ流れ（記録→加点→レベル判定→
// 着せ替え解放）をそのまま使う。かんじよみクイズの難易度軸は画数
// （KanjiLevelConfig.maxStrokeCount。docs/architecture.md「かんじよみクイズ」）。
//
// クライアントから受け取るのは正誤の配列のみ。点数・レベルはサーバー側で
// child_progressから導出する（申告のまま信用しない。practice/add/actions.tsと同じ理由）
export const submitKanjiQuizSession = async ({
  results,
  startedAt,
}: {
  results: boolean[];
  startedAt: string;
}): Promise<KanjiQuizSessionResult | null> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return null;

  if (
    !Array.isArray(results) ||
    results.length === 0 ||
    results.length > KANJI_QUIZ_QUESTION_COUNT ||
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

  const subjectId = await getKokugoSubjectId();
  const level = await getCurrentLevel<KanjiLevelConfig>(childId, subjectId, KANJI_SKILL_TYPE);

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
  const leveledUp = shouldLevelUp(results);
  const nextLevel = leveledUp
    ? await advanceToNextLevel<KanjiLevelConfig>(childId, subjectId, KANJI_SKILL_TYPE, level.levelNumber)
    : await demoteIfStruggling<KanjiLevelConfig>(childId, subjectId, KANJI_SKILL_TYPE, level);

  // 解放条件つきの着せ替えアイテムを配る。累計正解数を条件にするものがあるため、
  // 今回のセッションを記録し終えたこの時点で判定する（docs/game-design.md）。
  // 配布に失敗してもゲーム自体は続けられるようにする
  let unlockedItems: string[] = [];
  try {
    const granted = await grantUnlockedFreeItems(childId);
    unlockedItems = granted.map((item) => item.name);
  } catch (error) {
    console.error(error);
  }

  return {
    pointsEarned,
    unlockedItems,
    // 降級は演出しない（レベルが下がったことを子どもに告げない）ため、
    // 昇級したときだけtrueにする
    leveledUp: leveledUp && nextLevel !== null,
  };
};
