import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authorizeChild } from "@/lib/authorize-child";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

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
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
