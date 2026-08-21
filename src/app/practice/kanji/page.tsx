import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KanjiQuizSession } from "@/components/kanji-quiz-session";
import {
  KANJI_QUIZ_QUESTION_COUNT,
  KANJI_SKILL_TYPE,
  kanjiBankForLevel,
  prepareKanjiQuestions,
  type KanjiLevelConfig,
} from "@/lib/kanji-quiz";
import { getCurrentLevel, getKokugoSubjectId } from "@/lib/practice-progress";
import { getEquippedAssets } from "@/lib/wardrobe-store";

const KanjiQuizPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const kokugoSubjectId = await getKokugoSubjectId();

  // 出題レベルはchild_progressの現在レベル（未記録ならLv1）。
  // practice/add/page.tsxと同じ扱い
  const [level, equipped] = await Promise.all([
    getCurrentLevel<KanjiLevelConfig>(session.user.id, kokugoSubjectId, KANJI_SKILL_TYPE),
    getEquippedAssets(session.user.id),
  ]);

  // 出題とシャッフルはここ（サーバー）で行う。Client Component側でMath.randomを
  // 引くとSSRとハイドレーションで食い違うため（practice/add/page.tsxと同じ理由）
  const questions = prepareKanjiQuestions(
    KANJI_QUIZ_QUESTION_COUNT,
    kanjiBankForLevel(level.config),
  );

  return <KanjiQuizSession questions={questions} equipped={equipped} />;
};

export default KanjiQuizPage;
