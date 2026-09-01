import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import { KanjiQuizSession } from "@/components/kanji-quiz-session";
import {
  KANJI_QUIZ_QUESTION_COUNT,
  isKanjiSupportedGrade,
  kanjiBankForGrade,
  kanjiBankForLevel,
  kanjiSkillType,
  prepareKanjiQuestions,
  type KanjiLevelConfig,
} from "@/lib/kanji-quiz";
import { getCurrentLevel, getKokugoSubjectId } from "@/lib/practice-progress";
import { getEquippedAssets } from "@/lib/wardrobe-store";

// ログイン必須かつ出題内容が利用者の学年・現在レベルで変わるページなので検索結果には出さない
export const metadata: Metadata = {
  title: "かんじの読みクイズ",
  robots: { index: false, follow: false },
};

const KanjiQuizPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [child, equipped] = await Promise.all([
    db.query.childProfiles.findFirst({
      where: eq(childProfiles.id, session.user.id),
      columns: { grade: true },
    }),
    getEquippedAssets(session.user.id),
  ]);
  const grade = child?.grade ?? 1;

  // 5・6年生ぶんはまだ問題バンクを生成していない（docs/architecture.md
  // 「かんじよみクイズ」）。difficulty_levelsの行も無いためgetCurrentLevelを
  // 呼ばずに空の問題リストを返す。KanjiQuizSessionは0件を「もんだいが
  // まだ ないみたい」と案内するだけなので、これで安全に表示できる
  if (!isKanjiSupportedGrade(grade)) {
    return <KanjiQuizSession questions={[]} equipped={equipped} />;
  }

  const skillType = kanjiSkillType(grade);
  const kokugoSubjectId = await getKokugoSubjectId();

  // 出題レベルはchild_progressの現在レベル（未記録ならLv1）。
  // practice/add/page.tsxと同じ扱い
  const level = await getCurrentLevel<KanjiLevelConfig>(
    session.user.id,
    kokugoSubjectId,
    skillType,
  );

  // 出題とシャッフルはここ（サーバー）で行う。Client Component側でMath.randomを
  // 引くとSSRとハイドレーションで食い違うため（practice/add/page.tsxと同じ理由）
  const questions = prepareKanjiQuestions(
    KANJI_QUIZ_QUESTION_COUNT,
    kanjiBankForLevel(level.config, kanjiBankForGrade(grade)),
  );

  return <KanjiQuizSession questions={questions} equipped={equipped} />;
};

export default KanjiQuizPage;
