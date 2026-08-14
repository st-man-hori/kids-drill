import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // マイグレーション(DDL)はPgBouncer経由のプール接続ではなく直接接続で流す。
    // Neon連携が設定するDATABASE_URL_UNPOOLEDがあればそれを優先する。
    url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL)!,
  },
});
