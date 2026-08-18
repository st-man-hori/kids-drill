import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KokugoSession } from "@/components/kokugo-session";
import { KANJI_YOMI_SKILL_TYPE, pickKanjiQuestions } from "@/lib/kokugo";
import { getCurrentLevel, getKanjiQuestionPool } from "@/lib/kokugo-progress";
import { TOTAL_QUESTIONS } from "@/lib/practice";
import { getEquippedAssets } from "@/lib/wardrobe-store";

// practice/add/page.tsxと同じ構造。最初の10問はここ（サーバー）で選んでpropsとして
// 渡す理由（hydration mismatch回避）もそちらと同じ

const PracticeKokugoPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [level, equipped] = await Promise.all([
    getCurrentLevel(session.user.id, KANJI_YOMI_SKILL_TYPE),
    getEquippedAssets(session.user.id),
  ]);

  const pool = await getKanjiQuestionPool(level.id);
  const questions = pickKanjiQuestions(pool, TOTAL_QUESTIONS);

  return <KokugoSession pool={pool} questions={questions} equipped={equipped} />;
};

export default PracticeKokugoPage;
