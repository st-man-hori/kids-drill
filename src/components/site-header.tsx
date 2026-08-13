import { auth } from "@/auth";
import { SiteHeaderContent } from "@/components/site-header-content";

export const SiteHeader = async () => {
  const session = await auth();
  return <SiteHeaderContent isLoggedIn={Boolean(session?.user)} />;
};
