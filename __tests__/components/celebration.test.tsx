import { expect, test } from "vitest";
import { render } from "@testing-library/react";
import { Celebration } from "@/components/celebration";
import type { CelebrationTier } from "@/lib/practice";

const render_ = (tier: CelebrationTier) => render(<Celebration tier={tier} />).container;
const pieceCount = (tier: CelebrationTier) =>
  render_(tier).querySelectorAll("[data-particle]").length;

test("the confetti gets heavier the better the result", () => {
  expect(pieceCount("perfect")).toBeGreaterThan(pieceCount("great"));
  expect(pieceCount("great")).toBeGreaterThan(0);
});

// perfectは左右2発、greatは中央1発。発数でも差をつけている
test("a perfect run fires more poppers than a merely great one", () => {
  expect(render_("perfect").querySelectorAll("[data-burst]").length).toBe(2);
  expect(render_("great").querySelectorAll("[data-burst]").length).toBe(1);
});

// 「よくがんばったね」以下は紙吹雪なし。見出しのメッセージだけで差をつける
test.each(["good", "gentle"] as const)("does not throw confetti for %s", (tier) => {
  expect(pieceCount(tier)).toBe(0);
});

test("renders nothing at all when there is no confetti to show", () => {
  const { container } = render(<Celebration tier="gentle" />);
  expect(container).toBeEmptyDOMElement();
});
