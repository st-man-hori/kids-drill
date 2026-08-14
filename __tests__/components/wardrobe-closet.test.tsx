import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WardrobeCloset } from "@/components/wardrobe-closet";
import { buyWardrobeItem, wearWardrobeItem } from "@/app/wardrobe/actions";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

vi.mock("@/app/wardrobe/actions", () => ({
  buyWardrobeItem: vi.fn(),
  wearWardrobeItem: vi.fn(),
}));

const item = (over: Partial<WardrobeItemView> = {}): WardrobeItemView => ({
  id: "item-1",
  slotType: "hair",
  name: "ふわふわヘア",
  asset: { variant: "a", color: "#6b4f3f" },
  pricePoints: null,
  status: "owned",
  unlockLabel: "さいしょから つかえるよ",
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(wearWardrobeItem).mockResolvedValue({ ok: true });
  vi.mocked(buyWardrobeItem).mockResolvedValue({ ok: true });
});

test("shows the points the child has to spend", () => {
  render(<WardrobeCloset pointsBalance={420} items={[item()]} />);

  expect(screen.getByText("もっている ポイント 420")).toBeInTheDocument();
});

test("wearing an owned item asks the server to save it", async () => {
  const user = userEvent.setup();
  render(<WardrobeCloset pointsBalance={0} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(wearWardrobeItem).toHaveBeenCalledWith("item-1");
});

test("does not reveal what a locked item is, only how to get it", () => {
  render(
    <WardrobeCloset
      pointsBalance={0}
      items={[
        item({
          name: "きんいろヘア",
          status: "locked",
          unlockLabel: "ぜんぶで 200もん せいかいすると もらえるよ",
        }),
      ]}
    />,
  );

  expect(screen.queryByText("きんいろヘア")).not.toBeInTheDocument();
  expect(screen.getByText("？？？")).toBeInTheDocument();
  expect(screen.getByText("ぜんぶで 200もん せいかいすると もらえるよ")).toBeInTheDocument();
});

test("a locked item cannot be tapped", async () => {
  const user = userEvent.setup();
  render(<WardrobeCloset pointsBalance={99999} items={[item({ status: "locked" })]} />);

  await user.click(screen.getByRole("button", { name: /？？？/ }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(wearWardrobeItem).not.toHaveBeenCalled();
});

test("shows the price of an item that can be exchanged", () => {
  render(
    <WardrobeCloset
      pointsBalance={500}
      items={[item({ status: "affordable", pricePoints: 400 })]}
    />,
  );

  expect(screen.getByText("400 ポイント")).toBeInTheDocument();
});

test("exchanging an affordable item tells the child they got it", async () => {
  const user = userEvent.setup();
  render(
    <WardrobeCloset
      pointsBalance={500}
      items={[item({ status: "affordable", pricePoints: 400 })]}
    />,
  );

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(buyWardrobeItem).toHaveBeenCalledWith("item-1");
  expect(await screen.findByText("ふわふわヘアを てにいれた！")).toBeInTheDocument();
});

test("an item the child cannot afford is not bought", async () => {
  const user = userEvent.setup();
  render(
    <WardrobeCloset
      pointsBalance={10}
      items={[item({ status: "tooExpensive", pricePoints: 400 })]}
    />,
  );

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.getByText("ポイントを ためてから また きてね")).toBeInTheDocument();
});

test("only shows the items of the selected slot", async () => {
  const user = userEvent.setup();
  render(
    <WardrobeCloset
      pointsBalance={0}
      items={[
        item({ id: "hair-1", slotType: "hair", name: "ふわふわヘア" }),
        item({ id: "top-1", slotType: "top", name: "パーカー" }),
      ]}
    />,
  );

  expect(screen.getByText("ふわふわヘア")).toBeInTheDocument();
  expect(screen.queryByText("パーカー")).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "トップス" }));

  expect(screen.getByText("パーカー")).toBeInTheDocument();
  expect(screen.queryByText("ふわふわヘア")).not.toBeInTheDocument();
});

test("puts the look back when the server refuses to save it", async () => {
  vi.mocked(wearWardrobeItem).mockResolvedValue({ ok: false, reason: "notOwned" });
  const user = userEvent.setup();
  render(<WardrobeCloset pointsBalance={0} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(
    await screen.findByText("うまく きられなかったよ。もういちど ためしてね"),
  ).toBeInTheDocument();
});
