import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

// DATABASE_URL 未設定でも next build 等がモジュール読み込み時点で落ちないよう、
// 実際にクエリが実行されるまで neon() の呼び出しを遅延させる。
let cached: Db | undefined;

const getDb = (): Db => {
  if (!cached) {
    cached = drizzle(neon(process.env.DATABASE_URL!), { schema });
  }
  return cached;
};

export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    // メソッドはインスタンス本体にbindして返す。bindしないとdb.insert(...)のような
    // 呼び出し時のthisがProxy自身になり、drizzle内部が状態をthisに書き込む場合に
    // 実体ではなく空のProxyターゲットへ書き込まれて消えてしまう。
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
