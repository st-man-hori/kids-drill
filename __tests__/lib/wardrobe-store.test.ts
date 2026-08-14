import { beforeEach, expect, test, vi } from "vitest";

// db.select().from()... と db.insert()... のチェーンを、呼び出し順に
// 用意した戻り値で返す簡易モック。着せ替えの購入は「所持を先に入れてから
// 減算し、失敗したら取り消す」順序が肝なので、順序が見えるように記録する
const {
  selectResults,
  calls,
  mockDb,
  insertReturning,
  updateReturning,
} = vi.hoisted(() => {
  const selectResults: unknown[][] = [];
  const calls: string[] = [];
  const insertReturning: unknown[][] = [];
  const updateReturning: unknown[][] = [];

  const thenable = (get: () => unknown) => {
    const chain: Record<string, unknown> = {};
    for (const key of ["from", "where", "innerJoin", "groupBy", "set", "values"]) {
      chain[key] = () => chain;
    }
    chain.onConflictDoNothing = () => chain;
    chain.onConflictDoUpdate = () => chain;
    chain.returning = () => Promise.resolve(get());
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(get()).then(resolve);
    return chain;
  };

  const mockDb = {
    query: {
      childProfiles: { findFirst: vi.fn() },
      wardrobeItems: { findFirst: vi.fn() },
      childOwnedWardrobeItems: { findFirst: vi.fn() },
    },
    select: vi.fn(() => {
      calls.push("select");
      return thenable(() => selectResults.shift() ?? []);
    }),
    insert: vi.fn((table: { _tableName?: string }) => {
      calls.push(`insert:${table?._tableName ?? "?"}`);
      return thenable(() => insertReturning.shift() ?? []);
    }),
    update: vi.fn(() => {
      calls.push("update:points");
      return thenable(() => updateReturning.shift() ?? []);
    }),
    delete: vi.fn(() => {
      calls.push("delete:owned");
      return thenable(() => []);
    }),
  };

  return { selectResults, calls, mockDb, insertReturning, updateReturning };
});

vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema", () => ({
  childProfiles: { id: "id", pointsBalance: "points_balance", _tableName: "childProfiles" },
  childOwnedWardrobeItems: {
    childId: "child_id",
    wardrobeItemId: "wardrobe_item_id",
    _tableName: "owned",
  },
  childEquippedItems: {
    childId: "child_id",
    slotType: "slot_type",
    wardrobeItemId: "wardrobe_item_id",
    _tableName: "equipped",
  },
  practiceSessions: { childId: "child_id", correctCount: "correct_count", levelId: "level_id" },
  difficultyLevels: { id: "id", skillType: "skill_type", levelNumber: "level_number" },
  timeAttackRuns: { childId: "child_id", correctCount: "correct_count" },
  wardrobeItems: { id: "id", pricePoints: "price_points", _tableName: "catalog" },
}));

import { equipItem, purchaseItem } from "@/lib/wardrobe-store";

const PAID_ITEM = {
  id: "item-1",
  slotType: "top",
  name: "パーカー",
  assetRef: "c #f2775a",
  unlockConditionType: "always",
  unlockConditionValue: {},
  pricePoints: 300,
};

// getChildAchievement が撃つ3本のSELECT（累計正解 / 到達レベル / タイムアタック）
const achievementRows = () => {
  selectResults.push([{ total: "500" }], [{ skillType: "add", levelNumber: 5 }], [{ best: 30 }]);
};

beforeEach(() => {
  vi.clearAllMocks();
  selectResults.length = 0;
  calls.length = 0;
  insertReturning.length = 0;
  updateReturning.length = 0;
});

test("buying claims the item before taking the points", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue(PAID_ITEM);
  achievementRows();
  insertReturning.push([{ id: "item-1" }]);
  updateReturning.push([{ id: "child-1" }]);

  const result = await purchaseItem("child-1", "item-1");

  expect(result).toEqual({ ok: true });
  // 所持レコードの登録がポイント減算より先であること。逆にすると、
  // 途中で落ちたときにポイントだけ失う
  expect(calls.indexOf("insert:owned")).toBeLessThan(calls.indexOf("update:points"));
  expect(calls).not.toContain("delete:owned");
});

test("refuses to buy an item that is still locked", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue({
    ...PAID_ITEM,
    unlockConditionType: "total_correct",
    unlockConditionValue: { count: 9999 },
  });
  achievementRows();

  const result = await purchaseItem("child-1", "item-1");

  expect(result).toEqual({ ok: false, reason: "locked" });
  // 条件を満たしていないので、所持レコードもポイントも一切触らない
  expect(calls).not.toContain("insert:owned");
  expect(calls).not.toContain("update:points");
});

test("does not charge twice for an item already owned", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue(PAID_ITEM);
  achievementRows();
  // UNIQUE制約に当たって登録できなかった＝すでに持っている
  insertReturning.push([]);

  const result = await purchaseItem("child-1", "item-1");

  expect(result).toEqual({ ok: false, reason: "alreadyOwned" });
  expect(calls).not.toContain("update:points");
});

test("gives the item back when the points turn out to be short", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue(PAID_ITEM);
  achievementRows();
  insertReturning.push([{ id: "item-1" }]);
  // 残高が足りず、条件付きUPDATEが1行も更新しなかった
  updateReturning.push([]);

  const result = await purchaseItem("child-1", "item-1");

  expect(result).toEqual({ ok: false, reason: "notEnoughPoints" });
  // 取り消しが走ること（トランザクションが張れないため補償で戻す）
  expect(calls).toContain("delete:owned");
});

test("a free item cannot be bought through the purchase path", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue({ ...PAID_ITEM, pricePoints: null });

  const result = await purchaseItem("child-1", "item-1");

  expect(result).toEqual({ ok: false, reason: "notFound" });
});

test("refuses to wear an item the child does not own", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue(PAID_ITEM);
  mockDb.query.childOwnedWardrobeItems.findFirst.mockResolvedValue(undefined);

  const result = await equipItem("child-1", "item-1");

  expect(result).toEqual({ ok: false, reason: "notOwned" });
  expect(calls).not.toContain("insert:equipped");
});

test("wears an owned item", async () => {
  mockDb.query.wardrobeItems.findFirst.mockResolvedValue(PAID_ITEM);
  mockDb.query.childOwnedWardrobeItems.findFirst.mockResolvedValue({ wardrobeItemId: "item-1" });

  const result = await equipItem("child-1", "item-1");

  expect(result).toEqual({ ok: true });
  expect(calls).toContain("insert:equipped");
});
