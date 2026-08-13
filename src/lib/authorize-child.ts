import type { User } from "next-auth";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import {
  isLoginLocked,
  loginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
} from "@/lib/rate-limit";

// docs/architecture.md の認証設計を参照。ログインはID + 6桁PIN（子どもごとの唯一のアカウント、親アカウント層はない）。
// TODO: 本番投入前に、タイミング攻撃対策（ID不在時もダミーハッシュと
// 比較して所要時間を揃える）を追加する。
//
// next-authパッケージへのランタイム依存を持たせないために単独ファイルに
// している（next-authをimportするとnext/serverの解決が必要になり、
// Vitest側でこの関数を単体テストできなくなるため）。
export const authorizeChild = async (
  credentials: Partial<Record<"loginId" | "pin", unknown>>,
  request: Request,
): Promise<User | null> => {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const { success: withinLimit } = await loginRateLimit.limit(ip);
  if (!withinLimit) return null;

  const loginId = credentials?.loginId as string | undefined;
  const pin = credentials?.pin as string | undefined;
  if (!loginId || !pin) return null;

  if (await isLoginLocked(loginId)) return null;

  const child = await db.query.childProfiles.findFirst({
    where: eq(childProfiles.loginId, loginId),
  });

  const valid = child ? await bcrypt.compare(pin, child.pinHash) : false;
  if (!child || !valid) {
    await recordFailedLogin(loginId);
    return null;
  }

  await resetLoginAttempts(loginId);
  return { id: child.id, name: child.displayNickname };
};
