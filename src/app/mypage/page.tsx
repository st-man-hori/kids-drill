import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getTimeBasedGreeting } from "@/lib/greeting";
import { LogoutButton } from "@/components/logout-button";

const MyPage = async () => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const greeting = getTimeBasedGreeting(new Date());

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(1rem,4vh,2.5rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,1rem)] text-center">
      <h1 className="text-[clamp(1.375rem,3vh+1rem,2.25rem)] font-bold text-foreground">
        {greeting}、{session.user.name}さん！
      </h1>
      <LogoutButton />
    </div>
  );
};

export default MyPage;
