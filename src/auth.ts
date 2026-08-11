import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";

// docs/architecture.md の認証設計を参照。ログインはID + 6桁PIN（子どもごとの唯一のアカウント、親アカウント層はない）。
// TODO: 本番投入前に、ブルートフォース対策（Upstash Ratelimit）と
// タイミング攻撃対策（ID不在時もダミーハッシュと比較して所要時間を揃える）を追加する。
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        loginId: { label: "ID" },
        pin: { label: "ひみつのことば" },
      },
      authorize: async (credentials) => {
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
