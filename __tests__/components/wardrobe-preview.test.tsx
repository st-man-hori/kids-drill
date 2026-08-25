import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WardrobePreview } from "@/components/wardrobe-preview";
import type { CatalogItemView } from "@/lib/wardrobe-store";

// 開発用プレビュー(/dev/wardrobe-preview)のクリック試着が実際に動くことの確認。
// 本番導線ではないため解放条件・ポイントは無く、asset(variant/color/motif)が
// 一致するかどうかだけで「これは今つけているものか」を判定している

const item = (over: Partial<CatalogItemView> = {}): CatalogItemView => ({
  id: "item-1",
  slotType: "hair",
  name: "ふわふわヘア",
  asset: { variant: "t1", color: "#7a5a44", motif: "fluffy" },
  pricePoints: null,
  unlockLabel: "さいしょから つかえるよ",
  ...over,
});

test("tapping an item equips it on the preview avatar", async () => {
  const user = userEvent.setup();
  render(
    <WardrobePreview
      catalog={[
        item({ id: "hair-1", name: "ふわふわヘア" }),
        item({ id: "hair-2", name: "ツインヘア", asset: { variant: "t1", color: "#4f6ed9", motif: "twin" } }),
      ]}
    />,
  );

  const target = screen.getByRole("button", { name: /ツインヘア/ });
  await user.click(target);

  expect(target).toHaveClass("ring-2");
});

test("tapping the same item again unequips it", async () => {
  const user = userEvent.setup();
  render(<WardrobePreview catalog={[item()]} />);

  const target = screen.getByRole("button", { name: /ふわふわヘア/ });
  await user.click(target);
  expect(target).toHaveClass("ring-2");

  await user.click(target);
  expect(target).not.toHaveClass("ring-2");
});

test("switching slot tabs shows that slot's items and keeps other slots equipped", async () => {
  const user = userEvent.setup();
  render(
    <WardrobePreview
      catalog={[
        item({ id: "hair-1", name: "ふわふわヘア" }),
        item({
          id: "neck-1",
          slotType: "necklace",
          name: "ほしのペンダント",
          asset: { variant: "t1", color: "#f2c14e", motif: "star" },
        }),
      ]}
    />,
  );

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));
  expect(screen.queryByText("ほしのペンダント")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "ネックレス" }));
  const necklaceTile = screen.getByRole("button", { name: /ほしのペンダント/ });
  expect(necklaceTile).toBeInTheDocument();

  await user.click(necklaceTile);
  expect(necklaceTile).toHaveClass("ring-2");
  // 髪タブへ戻っても、さっき付けたふわふわヘアの選択は消えない
  await user.click(screen.getByRole("button", { name: "かみがた" }));
  expect(screen.getByRole("button", { name: /ふわふわヘア/ })).toHaveClass("ring-2");
});

test("ぜんぶ ぬがせる clears every equipped slot", async () => {
  const user = userEvent.setup();
  render(<WardrobePreview catalog={[item()]} />);

  const target = screen.getByRole("button", { name: /ふわふわヘア/ });
  await user.click(target);
  expect(target).toHaveClass("ring-2");

  await user.click(screen.getByRole("button", { name: "ぜんぶ ぬがせる" }));
  expect(target).not.toHaveClass("ring-2");
});
