import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import { loginRateLimit } from "@/lib/rate-limit";

// docs/architecture.md の認証設計を参照。ログインはID + 6桁PIN（子どもごとの唯一のアカウント、親アカウント層はない）。
// TODO: 本番投入前に、タイミング攻撃対策（ID不在時もダミーハッシュと
// 比較して所要時間を揃える）を追加する。
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        loginId: { label: "ID" },
        pin: { label: "ひみつのばんごう" },
      },
      authorize: async (credentials, request) => {
        const ip = request.headers.get("x-forwarded-for") ?? "unknown";
        const { success: withinLimit } = await loginRateLimit.limit(ip);
        if (!withinLimit) return null;

        const loginId = credentials?.loginId as string | undefined;
        const pin = credentials?.pin as string | undefined;
        if (!loginId || !pin) return null;

        const child = await db.query.childProfiles.findFirst({
          where: eq(childProfiles.loginId, loginId),
        });
        if (!child) return null;

        const valid = await bcrypt.compare(pin, child.pinHash);
        if (!valid) return null;

        return { id: child.id, name: child.displayNickname };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
