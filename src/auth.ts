import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeChild } from "@/lib/authorize-child";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        loginId: { label: "ID" },
        pin: { label: "ひみつのばんごう" },
      },
      authorize: authorizeChild,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
});
