import { beforeEach, expect, test, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { submitKokugoSession } from "@/app/practice/kokugo/actions";
import { KokugoSession } from "@/components/kokugo-session";
import {
  CORRECT_ADVANCE_DELAY_MS,
  INCORRECT_ADVANCE_DELAY_MS,
  TOTAL_QUESTIONS,
} from "@/lib/practice";
import type { KanjiQuestionBankEntry } from "@/lib/kokugo";

const { pushMock, refreshMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

vi.mock("@/app/practice/kokugo/actions", () => ({
  submitKokugoSession: vi.fn(),
}));

const POOL: KanjiQuestionBankEntry[] = [
  {
    id: "1",
    kanji: "一",
    correctReading: "いち",
    distractorReadings: ["にん", "さつ", "くん"],
    exampleWord: "一番",
    readingTemplate: "○○ばん",
  },
];

// 出題は常に同じ漢字・同じ選択肢順にする（乱数のシャッフルに依存させない）
const questions = Array.from({ length: TOTAL_QUESTIONS }, () => ({
  id: "1",
  kanji: "一",
  correctReading: "いち",
  exampleWord: "一番",
  readingTemplate: "○○ばん",
  choices: ["いち", "にん", "さつ", "くん"],
}));

const renderSession = () => render(<KokugoSession pool={POOL} questions={questions} />);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(submitKokugoSession).mockResolvedValue({
    pointsEarned: 150,
    unlockedItems: [],
    leveledUp: false,
    levelNumber: 1,
    pool: POOL,
  });
});

test("shows the example word and the blanked reading template", () => {
  renderSession();

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("一番");
  expect(screen.getByText("○○ばん")).toBeInTheDocument();
});

test("tapping the correct reading shows positive feedback", async () => {
  const user = userEvent.setup();
  renderSession();

  await user.click(screen.getByRole("button", { name: "いち" }));

  expect(screen.getByText("せいかい！")).toBeInTheDocument();
});

test("tapping a wrong reading reveals the correct answer", async () => {
  const user = userEvent.setup();
  renderSession();

  await user.click(screen.getByRole("button", { name: "にん" }));

  expect(screen.getByText("ざんねん…こたえは いち だよ")).toBeInTheDocument();
  // 選んでしまった誤答ボタンはすべて押せなくなる（答え合わせ後の共通仕様）
  expect(screen.getByRole("button", { name: "さつ" })).toBeDisabled();
});

const withFakeTimers = async (body: () => Promise<void>) => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  try {
    await body();
  } finally {
    vi.useRealTimers();
  }
};

const tap = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
const elapse = (ms: number) => act(() => vi.advanceTimersByTime(ms));

test("moves on to the next question by itself after a correct answer", async () => {
  await withFakeTimers(async () => {
    renderSession();
    tap("いち");

    expect(screen.getByText("1 もんめ ／ 10もん")).toBeInTheDocument();

    elapse(CORRECT_ADVANCE_DELAY_MS);

    expect(screen.getByText("2 もんめ ／ 10もん")).toBeInTheDocument();
    expect(screen.queryByText("せいかい！")).not.toBeInTheDocument();
  });
});

test("gives more time to read the answer after an incorrect one", async () => {
  await withFakeTimers(async () => {
    renderSession();
    tap("にん");

    elapse(CORRECT_ADVANCE_DELAY_MS);
    expect(screen.getByText("ざんねん…こたえは いち だよ")).toBeInTheDocument();

    elapse(INCORRECT_ADVANCE_DELAY_MS - CORRECT_ADVANCE_DELAY_MS);
    expect(screen.getByText("2 もんめ ／ 10もん")).toBeInTheDocument();
  });
});

test("lets an impatient child tap through early", async () => {
  await withFakeTimers(async () => {
    renderSession();
    tap("いち");
    tap("つぎへ");

    expect(screen.getByText("2 もんめ ／ 10もん")).toBeInTheDocument();

    elapse(CORRECT_ADVANCE_DELAY_MS * 2);
    expect(screen.getByText("2 もんめ ／ 10もん")).toBeInTheDocument();
  });
});

test.each([
  [TOTAL_QUESTIONS, "ぜんもん せいかい！"],
  [8, "すごい！ その ちょうし！"],
  [6, "よく がんばったね！"],
  [0, "さいごまで やりきったね！"],
])("the results headline celebrates %i correct answers appropriately", async (correct, headline) => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: i < correct ? "いち" : "にん" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(headline);
});

test("submits per-question results and shows what was earned", async () => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: i === 0 ? "にん" : "いち" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }

  expect(submitKokugoSession).toHaveBeenCalledOnce();
  const submitted = vi.mocked(submitKokugoSession).mock.calls[0][0];
  expect(submitted.results).toEqual([false, ...Array(TOTAL_QUESTIONS - 1).fill(true)]);

  expect(await screen.findByText("150 ポイント ゲット！")).toBeInTheDocument();
});

test("announces a level up and plays the next set from the new pool", async () => {
  const nextPool: KanjiQuestionBankEntry[] = [
    {
      id: "2",
      kanji: "水",
      correctReading: "すい",
      distractorReadings: ["すう", "すく", "すん"],
      exampleWord: "水中",
      readingTemplate: "○○ちゅう",
    },
  ];
  vi.mocked(submitKokugoSession).mockResolvedValue({
    pointsEarned: 150,
    unlockedItems: [],
    leveledUp: true,
    levelNumber: 2,
    pool: nextPool,
  });
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: "いち" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }

  expect(
    await screen.findByText("レベルアップ！ つぎは もうすこし むずかしいよ"),
  ).toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "もっと やる" }));

  // 次の10問は新しいレベルのプールから選ばれている（今回は1字しか無いので必ずこれになる）
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("水中");
});

test("tells the child when a new wardrobe item was unlocked", async () => {
  vi.mocked(submitKokugoSession).mockResolvedValue({
    pointsEarned: 150,
    unlockedItems: ["ぱっつんヘア"],
    leveledUp: false,
    levelNumber: 1,
    pool: POOL,
  });
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: "いち" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }

  expect(await screen.findByText("あたらしい ぱっつんヘアを てにいれた！")).toBeInTheDocument();
});

test("going back to the my page navigates and refreshes", async () => {
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: "いち" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }
  await user.click(screen.getByRole("button", { name: "マイページへ もどる" }));

  expect(pushMock).toHaveBeenCalledWith("/mypage");
  expect(refreshMock).toHaveBeenCalledOnce();
});

test("still lets the child continue when saving the results fails", async () => {
  vi.mocked(submitKokugoSession).mockRejectedValue(new Error("network down"));
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const user = userEvent.setup();
  renderSession();

  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    await user.click(screen.getByRole("button", { name: "いち" }));
    await user.click(screen.getByRole("button", { name: "つぎへ" }));
  }

  expect(screen.getByText("10もんちゅう 10もん せいかい！")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "もっと やる" }));
  expect(screen.getByText("1 もんめ ／ 10もん")).toBeInTheDocument();

  consoleError.mockRestore();
});
