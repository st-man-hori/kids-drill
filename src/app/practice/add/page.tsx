import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PracticeSession } from "@/components/practice-session";
import { ADD_SKILL_TYPE, TOTAL_QUESTIONS, generateQuestions } from "@/lib/practice";
import { getCurrentLevel } from "@/lib/practice-progress";
import { getEquippedAssets } from "@/lib/wardrobe-store";

const PracticeAddPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // 出題レベルはchild_progressの現在レベル（未記録ならLv1）
  const [level, equipped] = await Promise.all([
    getCurrentLevel(session.user.id, ADD_SKILL_TYPE),
    // 育てているキャラクターは問題を解いている間もそばに居させる
    // （docs/game-design.md の「キャラ反応」）
    getEquippedAssets(session.user.id),
  ]);

  // 最初の10問はここ（サーバー）で生成してpropsとして渡す。
  // Client Component側のuseState初期化関数で生成すると、SSR時とハイドレーション
  // 時とで別々の乱数が使われて数字が食い違い、hydration mismatchになるため。
  // 2セット目以降は「もっとやる」を押した後＝クライアント側で生成する。
  const questions = generateQuestions(level.config, TOTAL_QUESTIONS);

  return (
    <PracticeSession config={level.config} questions={questions} equipped={equipped} />
  );
};

export default PracticeAddPage;
