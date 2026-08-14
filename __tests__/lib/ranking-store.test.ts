import { beforeEach, expect, test, vi } from "vitest";
import { RANKING_DISPLAY_LIMIT } from "@/lib/ranking";

// db.select().from()...のチェーンを、呼び出し順に用意した戻り値で返す簡易モック
// （__tests__/lib/wardrobe-store.test.ts と同じ方式）
const { selectResults, mockDb } = vi.hoisted(() => {
  const selectResults: unknown[][] = [];

  const thenable = (get: () => unknown) => {
    const chain: Record<string, unknown> = {};
    for (const key of ["from", "where", "innerJoin", "groupBy", "orderBy"]) {
      chain[key] = () => chain;
    }
    chain.then = (resolve: (value: unknown) => unknown) => Promise.resolve(get()).then(resolve);
    return chain;
  };

  const mockDb = {
    query: { childProfiles: { findFirst: vi.fn() } },
    select: vi.fn(() => thenable(() => selectResults.shift() ?? [])),
  };

  return { selectResults, mockDb };
});

vi.mock("@/db", () => ({ db: mockDb }));

vi.mock("@/db/schema", () => ({
  childProfiles: { id: "id", grade: "grade", displayNickname: "display_nickname" },
  timeAttackRuns: { childId: "child_id", correctCount: "correct_count", playedAt: "played_at" },
}));

import { getRanking } from "@/lib/ranking-store";

beforeEach(() => {
  vi.clearAllMocks();
  selectResults.length = 0;
  mockDb.query.childProfiles.findFirst.mockResolvedValue({ id: "child-1", grade: 3 });
});

const WEEKLY_BESTS = [
  { childId: "child-2", nickname: "げんきなトラ402", score: 10 },
  { childId: "child-1", nickname: "しずかなネコ118", score: 8 },
  { childId: "child-3", nickname: "はやいウマ550", score: 5 },
];

test("computes the child's rank and weekly best among same-grade players this week", async () => {
  selectResults.push(WEEKLY_BESTS, [{ best: 12 }]);

  const ranking = await getRanking("child-1");

  expect(ranking).toMatchObject({
    allTimeBest: 12,
    weeklyBest: 8,
    rank: 2,
    totalParticipants: 3,
  });
});

test("marks the child's own row in the top list", async () => {
  selectResults.push(WEEKLY_BESTS, [{ best: 12 }]);

  const ranking = await getRanking("child-1");

  expect(ranking.topRows).toEqual([
    { childId: "child-2", nickname: "げんきなトラ402", score: 10, isSelf: false },
    { childId: "child-1", nickname: "しずかなネコ118", score: 8, isSelf: true },
    { childId: "child-3", nickname: "はやいウマ550", score: 5, isSelf: false },
  ]);
});

test("reports no rank when the child hasn't played this week", async () => {
  selectResults.push(
    [{ childId: "child-2", nickname: "げんきなトラ402", score: 10 }],
    [{ best: 0 }],
  );

  const ranking = await getRanking("child-1");

  expect(ranking.rank).toBeNull();
  expect(ranking.weeklyBest).toBeNull();
  expect(ranking.totalParticipants).toBe(1);
});

test("limits the top rows shown even when more players are in range", async () => {
  const manyPlayers = Array.from({ length: RANKING_DISPLAY_LIMIT + 5 }, (_, i) => ({
    childId: `child-${i}`,
    nickname: `プレイヤー${i}`,
    score: 100 - i,
  }));
  selectResults.push(manyPlayers, [{ best: 0 }]);

  const ranking = await getRanking("child-999");

  expect(ranking.topRows).toHaveLength(RANKING_DISPLAY_LIMIT);
  expect(ranking.totalParticipants).toBe(manyPlayers.length);
});

test("falls back to zero when the child has never played time attack", async () => {
  selectResults.push([], [{ best: null }]);

  const ranking = await getRanking("child-1");

  expect(ranking.allTimeBest).toBe(0);
});

test("throws when the child profile cannot be found", async () => {
  mockDb.query.childProfiles.findFirst.mockResolvedValue(undefined);

  await expect(getRanking("ghost")).rejects.toThrow();
});
