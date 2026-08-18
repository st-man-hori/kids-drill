import {
  pgTable,
  uuid,
  text,
  integer,
  jsonb,
  timestamp,
  unique,
  index,
} from "drizzle-orm/pg-core";

// docs/data-model.md がこのスキーマの一次情報源。テーブル追加・変更時はそちらも更新すること。

export const childProfiles = pgTable("child_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  loginId: text("login_id").notNull().unique(),
  pinHash: text("pin_hash").notNull(),
  displayNickname: text("display_nickname").notNull().unique(),
  grade: integer("grade").notNull(),
  pointsBalance: integer("points_balance").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const difficultyLevels = pgTable("difficulty_levels", {
  id: uuid("id").primaryKey().defaultRandom(),
  subjectId: uuid("subject_id")
    .notNull()
    .references(() => subjects.id),
  skillType: text("skill_type").notNull(),
  levelNumber: integer("level_number").notNull(),
  config: jsonb("config").notNull(),
});

export const childProgress = pgTable(
  "child_progress",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfiles.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    skillType: text("skill_type").notNull(),
    currentLevelId: uuid("current_level_id")
      .notNull()
      .references(() => difficultyLevels.id),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.childId, t.subjectId, t.skillType)],
);

// よみがなモード（国語スパイク、docs/architecture.mdの着手順序をあえて前倒しした
// プロトタイプ。詳細はscripts/kokugo-ai/README.md）の4択問題バンク。
// 正解データ・誤答データとも人間レビュー済みのものだけをマイグレーションで投入する
// （scripts/kokugo-ai/generate-distractors.tsが生成する候補はneedsHumanReview: true）。
export const kanjiQuestions = pgTable("kanji_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  levelId: uuid("level_id")
    .notNull()
    .references(() => difficultyLevels.id),
  kanji: text("kanji").notNull(),
  correctReading: text("correct_reading").notNull(),
  // string[]。4択のうち正解以外の3つ
  distractorReadings: jsonb("distractor_readings").notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id")
    .notNull()
    .references(() => childProfiles.id),
  levelId: uuid("level_id")
    .notNull()
    .references(() => difficultyLevels.id),
  totalQuestions: integer("total_questions").notNull(),
  correctCount: integer("correct_count").notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
});

export const timeAttackRuns = pgTable(
  "time_attack_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfiles.id),
    subjectId: uuid("subject_id")
      .notNull()
      .references(() => subjects.id),
    skillType: text("skill_type").notNull(),
    correctCount: integer("correct_count").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(60),
    playedAt: timestamp("played_at").notNull().defaultNow(),
  },
  (t) => [
    // ランキング集計（src/lib/ranking-store.ts）の gte(playedAt, weekStart) が
    // 全期間の行を毎回フルスキャンしないようにする
    index().on(t.playedAt),
    // 自己ベスト集計（time-attack/actions.ts, ranking-store.ts）の
    // eq(childId, ...) 用
    index().on(t.childId),
  ],
);

export const wardrobeItems = pgTable("wardrobe_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotType: text("slot_type").notNull(),
  name: text("name").notNull(),
  assetRef: text("asset_ref").notNull(),
  unlockConditionType: text("unlock_condition_type").notNull(),
  unlockConditionValue: jsonb("unlock_condition_value").notNull(),
  pricePoints: integer("price_points"),
});

export const childOwnedWardrobeItems = pgTable(
  "child_owned_wardrobe_items",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfiles.id),
    wardrobeItemId: uuid("wardrobe_item_id")
      .notNull()
      .references(() => wardrobeItems.id),
    acquiredAt: timestamp("acquired_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.childId, t.wardrobeItemId)],
);

export const childEquippedItems = pgTable(
  "child_equipped_items",
  {
    childId: uuid("child_id")
      .notNull()
      .references(() => childProfiles.id),
    slotType: text("slot_type").notNull(),
    wardrobeItemId: uuid("wardrobe_item_id")
      .notNull()
      .references(() => wardrobeItems.id),
    equippedAt: timestamp("equipped_at").notNull().defaultNow(),
  },
  // 1部位につき1アイテムしか装備できないことをDBレベルで保証する（docs/data-model.md参照）
  (t) => [unique().on(t.childId, t.slotType)],
);
