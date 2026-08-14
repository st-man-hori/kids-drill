import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReactingAvatar, type AvatarMood } from "@/components/reacting-avatar";

const MOODS: AvatarMood[] = ["idle", "correct", "incorrect", "celebrate"];

// Motionはキーフレームの組み合わせによっては実行時に例外を投げる
// （springは2キーフレームまで）。全ムードを一度描画して踏むようにしておく
test.each(MOODS)("renders the avatar in the %s mood", (mood) => {
  render(<ReactingAvatar equipped={{}} mood={mood} />);

  expect(screen.getByRole("img", { name: "じぶんの キャラクター" })).toBeInTheDocument();
});

test("keeps showing what the child is wearing while it reacts", () => {
  const { container } = render(
    <ReactingAvatar equipped={{ hair: { variant: "a", color: "#abcdef" } }} mood="correct" />,
  );

  expect(container.innerHTML).toContain("#abcdef");
});
