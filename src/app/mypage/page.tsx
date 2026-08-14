import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import { getTimeBasedGreeting } from "@/lib/greeting";
import { getEquippedAssets } from "@/lib/wardrobe-store";
import { LogoutButton } from "@/components/logout-button";
import { CtaButton } from "@/components/cta-button";
import { Avatar } from "@/components/avatar";

const MyPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const greeting = getTimeBasedGreeting(new Date());

  const [child, equipped] = await Promise.all([
    db.query.childProfiles.findFirst({
      where: eq(childProfiles.id, session.user.id),
    }),
    getEquippedAssets(session.user.id),
  ]);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,3vh,2rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
      <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground">
        {greeting}、{session.user.name}さん！
      </h1>

      {/* 育てているキャラクターを毎回見せる。着せ替えが長期の報酬として
          働くのは「いつも目に入る」ことが前提（docs/game-design.md） */}
      <Avatar equipped={equipped} className="h-[clamp(6rem,20vh,10rem)] w-auto" />

      <p className="rounded-sm bg-brand/15 px-5 py-2 font-bold text-foreground">
        もっている ポイント {child?.pointsBalance ?? 0}
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <CtaButton href="/practice/add" variant="primary">
          たしざん
        </CtaButton>
        <CtaButton href="/wardrobe" variant="secondary">
          きせかえ
        </CtaButton>
      </div>

      <LogoutButton />
    </div>
  );
};

export default MyPage;
