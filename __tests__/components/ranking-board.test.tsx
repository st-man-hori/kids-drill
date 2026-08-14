import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RankingBoard } from "@/components/ranking-board";
import type { RankingView } from "@/lib/ranking-store";

const ranking = (over: Partial<RankingView> = {}): RankingView => ({
  allTimeBest: 12,
  weeklyBest: 8,
  rank: 2,
  totalParticipants: 4,
  topRows: [
    { childId: "child-2", nickname: "げんきなトラ402", score: 10, isSelf: false },
    { childId: "child-1", nickname: "しずかなネコ118", score: 8, isSelf: true },
  ],
  ...over,
});

test("always shows the all-time personal best", () => {
  render(<RankingBoard ranking={ranking()} />);

  expect(screen.getByText("じこベスト 12てん")).toBeInTheDocument();
});

test("shows this week's percentile badge and weekly best when the child has played", () => {
  render(<RankingBoard ranking={ranking({ rank: 1, totalParticipants: 4, weeklyBest: 10 })} />);

  // 1/4 = 25%
  expect(screen.getByText("じょうい 25%")).toBeInTheDocument();
  expect(screen.getByText("こんしゅうの ベスト 10てん")).toBeInTheDocument();
});

test("encourages a first attempt when the child hasn't played this week", () => {
  render(<RankingBoard ranking={ranking({ rank: null, weeklyBest: null })} />);

  expect(screen.getByText("こんしゅうは まだ ちょうせん していないよ")).toBeInTheDocument();
  expect(screen.queryByText(/じょうい/)).not.toBeInTheDocument();
});

test("the detailed ranking list is hidden until asked for", async () => {
  const user = userEvent.setup();
  render(<RankingBoard ranking={ranking()} />);

  expect(screen.queryByText(/げんきなトラ402/)).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "くわしい じゅんいを みる" }));

  expect(screen.getByText(/げんきなトラ402/)).toBeInTheDocument();
  expect(screen.getByText(/しずかなネコ118/)).toBeInTheDocument();
});

test("can close the detailed list again", async () => {
  const user = userEvent.setup();
  render(<RankingBoard ranking={ranking()} />);

  await user.click(screen.getByRole("button", { name: "くわしい じゅんいを みる" }));
  await user.click(screen.getByRole("button", { name: "じゅんいを とじる" }));

  expect(screen.queryByText(/げんきなトラ402/)).not.toBeInTheDocument();
});

test("shows an empty state when nobody has played this week yet", async () => {
  const user = userEvent.setup();
  render(<RankingBoard ranking={ranking({ topRows: [], rank: null, weeklyBest: null })} />);

  await user.click(screen.getByRole("button", { name: "くわしい じゅんいを みる" }));

  expect(screen.getByText("まだ だれも ちょうせんしていないよ")).toBeInTheDocument();
});
