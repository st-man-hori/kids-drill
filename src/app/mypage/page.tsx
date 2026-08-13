import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import { getTimeBasedGreeting } from "@/lib/greeting";
import { LogoutButton } from "@/components/logout-button";
import { CtaButton } from "@/components/cta-button";

const MyPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const greeting = getTimeBasedGreeting(new Date());

  // 練習で貯まったポイント。使い道（着せ替えアイテム）は未実装だが、
  // 貯まっていくこと自体が中期の報酬になるので今から見せる（docs/game-design.md）
  const child = await db.query.childProfiles.findFirst({
    where: eq(childProfiles.id, session.user.id),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1rem,4vh,2.5rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
      <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground">
        {greeting}、{session.user.name}さん！
      </h1>
      <p className="rounded-sm bg-brand/15 px-5 py-2 font-bold text-foreground">
        もっている ポイント {child?.pointsBalance ?? 0}
      </p>
      <CtaButton href="/practice/add" variant="primary">
        たしざん
      </CtaButton>
      <LogoutButton />
    </div>
  );
};

export default MyPage;
