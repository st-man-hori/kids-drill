import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { childProgress, difficultyLevels, subjects } from "@/db/schema";
import type { LevelConfig } from "@/lib/practice";

// child_progress（子どもごとの現在レベル）の読み書き。DBに触るためClient
// Componentからは読み込まないこと（出題ロジックの純粋な部分は practice.ts）。

export type PracticeLevel = {
  id: string;
  levelNumber: number;
  config: LevelConfig;
};

const MATH_SUBJECT_SLUG = "math";

// npm run db:seed が未実行の環境で「なぜ動かないのか」が分かるようにする
const SEED_REQUIRED_MESSAGE =
  "算数のレベルデータが見つかりません。npm run db:seed を実行してください。";

const toPracticeLevel = (level: {
  id: string;
  levelNumber: number;
  config: unknown;
}): PracticeLevel => ({
  id: level.id,
  levelNumber: level.levelNumber,
  // configはjsonb（unknown）。中身の妥当性はseed側で担保している前提
  config: level.config as LevelConfig,
});

const getMathSubjectId = async (): Promise<string> => {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, MATH_SUBJECT_SLUG),
  });
  if (!subject) throw new Error(SEED_REQUIRED_MESSAGE);
  return subject.id;
};

const findLevelByNumber = async (
  subjectId: string,
  skillType: string,
  levelNumber: number,
): Promise<PracticeLevel | null> => {
  const level = await db.query.difficultyLevels.findFirst({
    where: and(
      eq(difficultyLevels.subjectId, subjectId),
      eq(difficultyLevels.skillType, skillType),
      eq(difficultyLevels.levelNumber, levelNumber),
    ),
  });
  return level ? toPracticeLevel(level) : null;
};

// 現在のレベルを返す。child_progressの行がまだ無い子どもはLv1から。
// ここでは行を作らない（表示のためのGETで書き込みを起こさないため）。
// 行はレベルアップ時にupsertで初めて作られる。
export const getCurrentLevel = async (
  childId: string,
  skillType: string,
): Promise<PracticeLevel> => {
  const subjectId = await getMathSubjectId();

  const progress = await db.query.childProgress.findFirst({
    where: and(
      eq(childProgress.childId, childId),
      eq(childProgress.subjectId, subjectId),
      eq(childProgress.skillType, skillType),
    ),
  });

  if (progress) {
    const level = await db.query.difficultyLevels.findFirst({
      where: eq(difficultyLevels.id, progress.currentLevelId),
    });
    if (level) return toPracticeLevel(level);
  }

  const firstLevel = await findLevelByNumber(subjectId, skillType, 1);
  if (!firstLevel) throw new Error(SEED_REQUIRED_MESSAGE);
  return firstLevel;
};

// 次のレベルへ進める。最高レベルに到達済みで次が無ければnullを返す
// （その場合はchild_progressを更新しない）。
export const advanceToNextLevel = async (
  childId: string,
  skillType: string,
  currentLevelNumber: number,
): Promise<PracticeLevel | null> => {
  const subjectId = await getMathSubjectId();
  const nextLevel = await findLevelByNumber(subjectId, skillType, currentLevelNumber + 1);
  if (!nextLevel) return null;

  await db
    .insert(childProgress)
    .values({
      childId,
      subjectId,
      skillType,
      currentLevelId: nextLevel.id,
    })
    .onConflictDoUpdate({
      target: [childProgress.childId, childProgress.subjectId, childProgress.skillType],
      set: { currentLevelId: nextLevel.id, updatedAt: new Date() },
    });

  return nextLevel;
};
