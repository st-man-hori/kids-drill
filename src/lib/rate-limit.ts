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

// ログインのブルートフォース対策（docs/architecture.md参照）。
// 10分間に10回まで。PINは6桁(100万通り)なので、この制限下では
// 総当たりが現実的な時間で終わらない
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 m"),
  prefix: `ratelimit:${ENV}:login`,
});
