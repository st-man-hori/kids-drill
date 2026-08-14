import { defineConfig } from "drizzle-kit";

// マイグレーション(DDL)はPgBouncer経由のプール接続ではなく直接接続で流す。
// Vercel-Neon連携が設定するDATABASE_URL_UNPOOLEDがあればそれを優先する。
//
// `??`ではなく`||`なのは、.env.local.exampleをそのままコピーした環境では
// `DATABASE_URL_UNPOOLED=`（空文字）になっており、`??`だとその空文字が
// そのまま採用されて接続文字列が空のまま実行されてしまうため。
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL（または DATABASE_URL_UNPOOLED）が設定されていません。",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
