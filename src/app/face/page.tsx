import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FacePicker } from "@/components/face-picker";
import { LinkButton } from "@/components/link-button";
import { getChildFace } from "@/lib/face-store";

// ログイン必須かつ内容が利用者ごとに異なるページなので検索結果には出さない
export const metadata: Metadata = {
  title: "顔を選ぶ",
  robots: { index: false, follow: false },
};

const FacePage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const face = await getChildFace(session.user.id);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-[clamp(0.5rem,2vh,1.25rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)]">
      <h1 className="text-[clamp(1.25rem,2.5vh+0.75rem,2rem)] font-bold text-foreground">
        かおを えらぶ
      </h1>

      <FacePicker initialFace={face} />

      <LinkButton href="/mypage" variant="secondary">
        マイページへ もどる
      </LinkButton>
    </div>
  );
};

export default FacePage;
