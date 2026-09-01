import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PracticeSession } from "@/components/practice-session";
import {
  ADD_SKILL_TYPE,
  TOTAL_QUESTIONS,
  generateQuestions,
  type LevelConfig,
} from "@/lib/practice";
import { getCurrentLevel, getMathSubjectId } from "@/lib/practice-progress";
import { getEquippedAssets } from "@/lib/wardrobe-store";

// ログイン必須かつ出題内容が利用者の現在レベルで変わるページなので検索結果には出さない
export const metadata: Metadata = {
  title: "算数の練習",
  robots: { index: false, follow: false },
};

const PracticeAddPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const mathSubjectId = await getMathSubjectId();

  // 出題レベルはchild_progressの現在レベル（未記録ならLv1）
  const [level, equipped] = await Promise.all([
    getCurrentLevel<LevelConfig>(session.user.id, mathSubjectId, ADD_SKILL_TYPE),
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
