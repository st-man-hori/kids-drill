import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LinkButton } from "@/components/link-button";
import { RankingBoard } from "@/components/ranking-board";
import { getRanking } from "@/lib/ranking-store";

const RankingPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const ranking = await getRanking(session.user.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.75rem,3vh,1.75rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
      <h1 className="text-[clamp(1.25rem,2.5vh+0.75rem,2rem)] font-bold text-foreground">
        ランキング
      </h1>

      <RankingBoard ranking={ranking} />

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <LinkButton href="/time-attack" variant="primary">
          たいむあたっくで あそぶ
        </LinkButton>
        <LinkButton href="/mypage" variant="secondary">
          マイページへ もどる
        </LinkButton>
      </div>
    </div>
  );
};

export default RankingPage;
