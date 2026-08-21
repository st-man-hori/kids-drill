import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  childProgress,
  difficultyLevels,
  practiceSessions,
  subjects,
} from "@/db/schema";
import { LEVEL_DOWN_STREAK, isStrugglingSession } from "@/lib/practice";

// child_progress（子どもごとの現在レベル）の読み書き。DBに触るためClient
// Componentからは読み込まないこと（出題ロジックの純粋な部分は practice.ts /
// kanji-quiz.ts）。算数・かんじよみクイズなど複数のスキルがこのレベル昇降の
// 仕組みを共有するため、configの型はジェネリクスにして呼び出し側に委ねている

export type PracticeLevel<TConfig = unknown> = {
  id: string;
  levelNumber: number;
  config: TConfig;
};

const MATH_SUBJECT_SLUG = "math";
const KOKUGO_SUBJECT_SLUG = "kokugo";

// マイグレーション未適用の環境で「なぜ動かないのか」が分かるようにする。
// マスタデータはマイグレーションで投入される（docs/architecture.md参照）
const LEVELS_MISSING_MESSAGE =
  "レベルデータが見つかりません。npm run db:migrate を実行してください。";

const subjectMissingMessage = (name: string) =>
  `${name}のマスタデータが見つかりません。npm run db:migrate を実行してください。`;

const getSubjectIdBySlug = async (slug: string, label: string): Promise<string> => {
  const subject = await db.query.subjects.findFirst({
    where: eq(subjects.slug, slug),
  });
  if (!subject) throw new Error(subjectMissingMessage(label));
  return subject.id;
};

// タイムアタックの記録（time-attack/actions.ts）も同じ「算数」subject_idを
// 使うため、ここから公開する
export const getMathSubjectId = (): Promise<string> =>
  getSubjectIdBySlug(MATH_SUBJECT_SLUG, "算数");

// かんじよみクイズ（practice/kanji/actions.ts, page.tsx）用
export const getKokugoSubjectId = (): Promise<string> =>
  getSubjectIdBySlug(KOKUGO_SUBJECT_SLUG, "国語");

const toPracticeLevel = <TConfig>(level: {
  id: string;
  levelNumber: number;
  config: unknown;
}): PracticeLevel<TConfig> => ({
  id: level.id,
  levelNumber: level.levelNumber,
  // configはjsonb（unknown）。中身の妥当性はマイグレーション側で担保している前提
  config: level.config as TConfig,
});

const findLevelByNumber = async <TConfig>(
  subjectId: string,
  skillType: string,
  levelNumber: number,
): Promise<PracticeLevel<TConfig> | null> => {
  const level = await db.query.difficultyLevels.findFirst({
    where: and(
      eq(difficultyLevels.subjectId, subjectId),
      eq(difficultyLevels.skillType, skillType),
      eq(difficultyLevels.levelNumber, levelNumber),
    ),
  });
  return level ? toPracticeLevel<TConfig>(level) : null;
};

// 現在のレベルを返す。child_progressの行がまだ無い子どもはLv1から。
// ここでは行を作らない（表示のためのGETで書き込みを起こさないため）。
// 行はレベルアップ時にupsertで初めて作られる。
export const getCurrentLevel = async <TConfig>(
  childId: string,
  subjectId: string,
  skillType: string,
): Promise<PracticeLevel<TConfig>> => {
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
    if (level) return toPracticeLevel<TConfig>(level);
  }

  const firstLevel = await findLevelByNumber<TConfig>(subjectId, skillType, 1);
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

// 次のレベルへ進める。最高レベルに到達済みで次が無ければnullを返す
// （その場合はchild_progressを更新しない）。
export const advanceToNextLevel = async <TConfig>(
  childId: string,
  subjectId: string,
  skillType: string,
  currentLevelNumber: number,
): Promise<PracticeLevel<TConfig> | null> => {
  const nextLevel = await findLevelByNumber<TConfig>(subjectId, skillType, currentLevelNumber + 1);
  if (!nextLevel) return null;

  await setCurrentLevel(childId, subjectId, skillType, nextLevel.id);

  return nextLevel;
};

// 直近の成績が振るわない場合に1つ下のレベルへ戻す。戻したときだけ新しいレベルを返す。
//
// 昇級だけあって降級が無いと、まぐれで8問正解して上がった子が「毎回2〜3問しか
// 解けないレベル」に固定され、自力で戻れなくなる（報酬ループが全部止まる）。
// docs/game-design.md の「降級」を参照。
//
// 判定対象を「今のレベルで解いたセッション」に絞っているため、降級した直後は
// 対象セッションが0件になり、連続で下げ続けることはない。
export const demoteIfStruggling = async <TConfig>(
  childId: string,
  subjectId: string,
  skillType: string,
  currentLevel: PracticeLevel<TConfig>,
): Promise<PracticeLevel<TConfig> | null> => {
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
    // finished_atはnull許容（並び順にnullが混ざりうる）ため、notNullのstarted_atで並べる
    .orderBy(desc(practiceSessions.startedAt))
    .limit(LEVEL_DOWN_STREAK);

  if (recentSessions.length < LEVEL_DOWN_STREAK) return null;
  if (!recentSessions.every(isStrugglingSession)) return null;

  const previousLevel = await findLevelByNumber<TConfig>(
    subjectId,
    skillType,
    currentLevel.levelNumber - 1,
  );
  if (!previousLevel) return null;

  await setCurrentLevel(childId, subjectId, skillType, previousLevel.id);

  return previousLevel;
};
