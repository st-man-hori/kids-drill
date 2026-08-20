import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  childProgress,
  difficultyLevels,
  kanjiQuestions,
  practiceSessions,
  subjects,
} from "@/db/schema";
import { LEVEL_DOWN_STREAK, isStrugglingSession } from "@/lib/practice";
import { KOKUGO_SUBJECT_SLUG, type KanjiQuestionBankEntry } from "@/lib/kokugo";

// child_progress（子どもごとの現在レベル）の読み書き。practice-progress.tsと同じ構造だが、
// このプロトタイプはmainへマージしない前提のため、算数側（practice-progress.ts、および
// そのテスト）は変更せず並行する形で置いている（詳細はscripts/kokugo-ai/README.md）。

export type KokugoLevel = { id: string; levelNumber: number };

const LEVELS_MISSING_MESSAGE =
  "国語のレベルデータが見つかりません。npm run db:migrate を実行してください。";

export const getKokugoSubjectId = async (): Promise<string> => {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, KOKUGO_SUBJECT_SLUG),
  });
  if (!subject) throw new Error(LEVELS_MISSING_MESSAGE);
  return subject.id;
};

const findLevelByNumber = async (
  subjectId: string,
  skillType: string,
  levelNumber: number,
): Promise<KokugoLevel | null> => {
  const level = await db.query.difficultyLevels.findFirst({
    where: and(
      eq(difficultyLevels.subjectId, subjectId),
      eq(difficultyLevels.skillType, skillType),
      eq(difficultyLevels.levelNumber, levelNumber),
    ),
  });
  return level ? { id: level.id, levelNumber: level.levelNumber } : null;
};

// 現在のレベルを返す。child_progressの行がまだ無い子どもはLv1から
export const getCurrentLevel = async (
  childId: string,
  skillType: string,
): Promise<KokugoLevel> => {
  const subjectId = await getKokugoSubjectId();

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
    if (level) return { id: level.id, levelNumber: level.levelNumber };
  }

  const firstLevel = await findLevelByNumber(subjectId, skillType, 1);
  if (!firstLevel) throw new Error(LEVELS_MISSING_MESSAGE);
  return firstLevel;
};

const setCurrentLevel = async (
  childId: string,
  subjectId: string,
  skillType: string,
  levelId: string,
): Promise<void> => {
  await db
    .insert(childProgress)
    .values({
      childId,
      subjectId,
      skillType,
      currentLevelId: levelId,
    })
    .onConflictDoUpdate({
      target: [childProgress.childId, childProgress.subjectId, childProgress.skillType],
      set: { currentLevelId: levelId, updatedAt: new Date() },
    });
};

export const advanceToNextLevel = async (
  childId: string,
  skillType: string,
  currentLevelNumber: number,
): Promise<KokugoLevel | null> => {
  const subjectId = await getKokugoSubjectId();
  const nextLevel = await findLevelByNumber(subjectId, skillType, currentLevelNumber + 1);
  if (!nextLevel) return null;

  await setCurrentLevel(childId, subjectId, skillType, nextLevel.id);

  return nextLevel;
};

export const demoteIfStruggling = async (
  childId: string,
  skillType: string,
  currentLevel: KokugoLevel,
): Promise<KokugoLevel | null> => {
  if (currentLevel.levelNumber <= 1) return null;

  const recentSessions = await db
    .select({
      correctCount: practiceSessions.correctCount,
      totalQuestions: practiceSessions.totalQuestions,
    })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.childId, childId),
        eq(practiceSessions.levelId, currentLevel.id),
      ),
    )
    .orderBy(desc(practiceSessions.startedAt))
    .limit(LEVEL_DOWN_STREAK);

  if (recentSessions.length < LEVEL_DOWN_STREAK) return null;
  if (!recentSessions.every(isStrugglingSession)) return null;

  const subjectId = await getKokugoSubjectId();
  const previousLevel = await findLevelByNumber(
    subjectId,
    skillType,
    currentLevel.levelNumber - 1,
  );
  if (!previousLevel) return null;

  await setCurrentLevel(childId, subjectId, skillType, previousLevel.id);

  return previousLevel;
};

// 指定レベルの漢字問題バンクを返す
export const getKanjiQuestionPool = async (
  levelId: string,
): Promise<KanjiQuestionBankEntry[]> => {
  const rows = await db.query.kanjiQuestions.findMany({
    where: eq(kanjiQuestions.levelId, levelId),
  });

  return rows.map((row) => ({
    id: row.id,
    kanji: row.kanji,
    correctReading: row.correctReading,
    distractorReadings: row.distractorReadings as string[],
    exampleWord: row.exampleWord,
    readingTemplate: row.readingTemplate,
  }));
};
