import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TimeAttackSession } from "@/components/time-attack-session";
import { ADD_SKILL_TYPE, type LevelConfig } from "@/lib/practice";
import { getCurrentLevel, getMathSubjectId } from "@/lib/practice-progress";
import { getEquippedAssets } from "@/lib/wardrobe-store";

const TimeAttackPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const mathSubjectId = await getMathSubjectId();

  // タイムアタック専用の難易度は持たず、練習モードと同じchild_progressの
  // 現在レベルをそのまま使う(出題ロジックの導出元を分けない)
  const [level, equipped] = await Promise.all([
    getCurrentLevel<LevelConfig>(session.user.id, mathSubjectId, ADD_SKILL_TYPE),
    getEquippedAssets(session.user.id),
  ]);

  return <TimeAttackSession config={level.config} equipped={equipped} />;
};

export default TimeAttackPage;
