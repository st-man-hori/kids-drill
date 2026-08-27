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

// T4〜T6の髪には星やきらめきなどの装飾があるが、髪はからだより後ろに
// 描く(hairBack)ため頭にほぼ隠れてしまっていた（実機フィードバック:
// 「かみがたのレアものの星が...表示されない」）。前髪レイヤー
// (HairFringeがmaskで前面に出す部分)にも同じ装飾が含まれていること
test("shows tier decorations (e.g. the T6 star) in the front hair layer, not only hidden behind the head", () => {
  const { container } = render(
    <Avatar equipped={{ hair: { variant: "t6", color: "#8a5a3a", motif: "fluffy" } }} />,
  );

  const fringeGroup = container.querySelector("g[mask]");
  expect(fringeGroup).not.toBeNull();
  // T6の頭頂の星デコレーション
  expect(fringeGroup!.innerHTML).toContain("M50 2 L54 12");
});

test.each(["down", "cheer"] as const)("has two arms in the %s pose", (armPose) => {
  const { container } = render(<Avatar equipped={{}} armPose={armPose} />);

  expect(container.querySelectorAll("[data-arm]").length).toBe(2);
});

// うでは肩を軸に回す。ここが真ん中になっていると、肩から腕が上がらず、
// 腕の中央を中心にくるっと回るだけの不自然な動きになる。
//
// うで(data-arm)はそで(TOP_SLEEVE_LENGTH)と同じmotion.gに入れて一緒に回すため、
// 軸はそのgroup自身のbboxではなく、キャンバス全体(0 0 100 140)を覆う透明な
// 参照rect(CANVAS_BBOX_REF)基準の割合になっている。そでの丈でbboxが変わっても
// 軸がずれないようにするための仕組み（avatar.tsxのARM_PIVOT_LEFT/RIGHTのコメント
// 参照）。左右で異なるx、共通のy（肩の高さ、キャンバス上半分）になっているはず
//
// Framer MotionはSVGにtransformを書くとき transform-origin を自前で組み立て直す。
// CSSの transform-origin で書くとアニメーション開始時に "50% 50%" へ化けるため、
// originX/originY 経由で渡っていること（＝Motionが認識していること）を確かめる
test("pivots the arms at the shoulder, not at their middle", () => {
  const { container } = render(<Avatar equipped={{}} armPose="cheer" />);
  const arms = [...container.querySelectorAll<SVGElement>("[data-arm]")];

  expect(arms).toHaveLength(2);

  for (const arm of arms) {
    const [x, y] = arm.style.transformOrigin.split(/\s+/);

    // キャンバス中央(50%)ではなく、左右それぞれの肩の位置になっていること
    expect(x).not.toBe("50%");

    // 肩の高さ＝キャンバス上半分。腕の中央(bboxの50%)や下半分ではないこと
    const yPercent = Number.parseFloat(y);
    expect(Number.isNaN(yPercent)).toBe(false);
    expect(yPercent).toBeLessThan(50);
  }
});
