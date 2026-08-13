import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Upstashの無料枠はRedis DBを1つしか作れないため、開発と本番で同じDBを共有する。
// キーの先頭に環境名を入れて名前空間を分けることで、ローカルでの動作確認が
// 本番側のレート制限状態に影響しないようにする（VERCEL_ENVはVercelが
// 自動で設定する値。ローカルでは未設定のためdevelopmentにフォールバック）。
const ENV = process.env.VERCEL_ENV ?? "development";

// 新規登録の乱発防止。1時間に5回まで（きょうだいで複数アカウント作る
// ケースを想定しつつ、無限にアカウントが作られないようにする）
export const signupRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: `ratelimit:${ENV}:signup`,
});

// ログインのブルートフォース対策（docs/architecture.md参照）。IPベース。
// 10分間に10回まで。PINは6桁(100万通り)なので、この制限下では
// 総当たりが現実的な時間で終わらない
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: `ratelimit:${ENV}:login`,
});

// ログインIDごとの連続失敗ロック。IPを変えて特定の1アカウントだけを
// 狙い撃ちされるケースはIPベースのloginRateLimitでは防げないため、
// アカウント単位でも別途制限する。5回連続で失敗したら15分ロックし、
// 1回でも成功したらカウントをリセットする。
const MAX_CONSECUTIVE_FAILURES = 5;
const LOCKOUT_SECONDS = 15 * 60;

const loginAttemptsKey = (loginId: string) => `lockout:${ENV}:login:${loginId}`;

export const isLoginLocked = async (loginId: string): Promise<boolean> => {
  const count = await redis.get<number>(loginAttemptsKey(loginId));
  return (count ?? 0) >= MAX_CONSECUTIVE_FAILURES;
};

export const recordFailedLogin = async (loginId: string): Promise<void> => {
  const key = loginAttemptsKey(loginId);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, LOCKOUT_SECONDS);
  }
};

export const resetLoginAttempts = async (loginId: string): Promise<void> => {
  await redis.del(loginAttemptsKey(loginId));
};
