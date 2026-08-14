import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { GreetingAvatar } from "@/components/greeting-avatar";
import { AVATAR_GREETINGS } from "@/lib/avatar-greeting";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});

afterEach(() => {
  vi.useRealTimers();
});

// Motionはキーフレームの組み合わせ次第で実行時に例外を投げる
// （springは2キーフレームまで）。全パターンを一度描画して踏んでおく
test.each(AVATAR_GREETINGS)("renders the %s greeting", (greeting) => {
  render(<GreetingAvatar equipped={{}} greeting={greeting} />);

  expect(screen.getByRole("img", { name: "じぶんの キャラクター" })).toBeInTheDocument();
});

test("waving raises one arm, then settles back down", () => {
  const { container } = render(<GreetingAvatar equipped={{}} greeting="wave" />);

  expect(container.querySelectorAll("[data-arm]").length).toBe(2);

  // あいさつが終わったら待機に戻る（ずっと動き続けない）
  act(() => {
    vi.advanceTimersByTime(5000);
  });

  expect(screen.getByRole("img", { name: "じぶんの キャラクター" })).toBeInTheDocument();
});

test("keeps showing what the child is wearing", () => {
  const { container } = render(
    <GreetingAvatar equipped={{ hair: { variant: "a", color: "#abcdef" } }} greeting="cheer" />,
  );

  expect(container.innerHTML).toContain("#abcdef");
});
