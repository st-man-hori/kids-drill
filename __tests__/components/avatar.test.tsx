import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "@/components/avatar";
import { SLOT_TYPES } from "@/lib/wardrobe";

const asset = (color: string, variant = "a") => ({ variant, color });

test("draws a character even with nothing equipped", () => {
  const { container } = render(<Avatar equipped={{}} />);

  expect(screen.getByRole("img", { name: "じぶんの キャラクター" })).toBeInTheDocument();
  // 素体だけでも人の形になっていること
  expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
});

test("uses the colour of each equipped item", () => {
  const { container } = render(
    <Avatar
      equipped={{
        hair: asset("#111111"),
        top: asset("#222222"),
        bottom: asset("#333333"),
        necklace: asset("#444444"),
      }}
    />,
  );

  const markup = container.innerHTML;
  for (const color of ["#111111", "#222222", "#333333", "#444444"]) {
    expect(markup).toContain(color);
  }
});

// アイテムのレコードを足しただけで画面が壊れないこと
test.each(SLOT_TYPES)("falls back to a known shape for an unknown %s variant", (slot) => {
  const { container } = render(<Avatar equipped={{ [slot]: asset("#abcdef", "zzz") }} />);

  expect(container.innerHTML).toContain("#abcdef");
});

test("hair is drawn behind the body so it frames the head", () => {
  const { container } = render(<Avatar equipped={{ hair: asset("#111111") }} />);

  const markup = container.innerHTML;
  // 髪の色が、顔のパーツ（目の色）より前に現れる＝先に描かれている
  expect(markup.indexOf("#111111")).toBeLessThan(markup.indexOf("#3f3a36"));
});

test.each(["down", "cheer"] as const)("has two arms in the %s pose", (armPose) => {
  const { container } = render(<Avatar equipped={{}} armPose={armPose} />);

  expect(container.querySelectorAll("[data-arm]").length).toBe(2);
});

// うでは肩を軸に回す。ここがずれると、うでが胴から離れて回ってしまう
test("pivots the arms at the shoulder", () => {
  const { container } = render(<Avatar equipped={{}} armPose="cheer" />);

  for (const arm of container.querySelectorAll<SVGElement>("[data-arm]")) {
    // 要素自身のバウンディングボックス基準で、上端中央あたりを軸にする
    expect(arm.style.transformBox).toBe("fill-box");
    expect(arm.style.transformOrigin).toBe("50% 8%");
  }
});
