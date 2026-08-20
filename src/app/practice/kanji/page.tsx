import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KanjiQuizSession } from "@/components/kanji-quiz-session";
import { prepareKanjiQuestions } from "@/lib/kanji-quiz";
import { getEquippedAssets } from "@/lib/wardrobe-store";

const KanjiQuizPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const equipped = await getEquippedAssets(session.user.id);

  // 出題とシャッフルはここ（サーバー）で行う。Client Component側でMath.randomを
  // 引くとSSRとハイドレーションで食い違うため（practice/add/page.tsxと同じ理由）
  const questions = prepareKanjiQuestions();

  return <KanjiQuizSession questions={questions} equipped={equipped} />;
};

export default KanjiQuizPage;
