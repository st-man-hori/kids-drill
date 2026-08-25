import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WardrobeShop } from "@/components/wardrobe-shop";
import { buyWardrobeItem } from "@/app/wardrobe/actions";
import type { WardrobeItemView } from "@/lib/wardrobe-store";

vi.mock("@/app/wardrobe/actions", () => ({
  buyWardrobeItem: vi.fn(),
  wearWardrobeItem: vi.fn(),
}));

const item = (over: Partial<WardrobeItemView> = {}): WardrobeItemView => ({
  id: "item-1",
  slotType: "hair",
  name: "きんいろヘア",
  asset: { variant: "c", color: "#f2c14e" },
  pricePoints: 400,
  status: "affordable",
  unlockLabel: "ぜんぶで 200もん せいかいすると もらえるよ",
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(buyWardrobeItem).mockResolvedValue({ ok: true });
});

test("shows the price of an item on sale", () => {
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  expect(screen.getByText("400 ポイント")).toBeInTheDocument();
});

test("filters items by required points", async () => {
  const user = userEvent.setup();
  render(
    <WardrobeShop
      pointsBalance={500}
      items={[
        item({ id: "item-1", name: "みずいろヘア", pricePoints: 240 }),
        item({ id: "item-2", name: "ほしぞらヘア", pricePoints: 1650 }),
      ]}
    />,
  );

  await user.click(screen.getByRole("button", { name: "300まで" }));

  expect(screen.getByText("みずいろヘア")).toBeInTheDocument();
  expect(screen.queryByText("ほしぞらヘア")).not.toBeInTheDocument();
});

test("shows a helper message when no item matches the selected point band", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item({ pricePoints: 400 })]} />);

  await user.click(screen.getByRole("button", { name: "1401いじょう" }));

  expect(screen.getByText("この ポイントたいには まだ ないよ")).toBeInTheDocument();
});

// タップ即購入だとポイントが意図せず減ってしまう（issue #7）ため、
// affordableなアイテムは確認ダイアログを挟んでから購入する
test("tapping an item asks for confirmation instead of buying right away", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toHaveTextContent("400 ポイントで こうかんするよ。いい？");
});

test("confirming the dialog buys the item", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));
  await user.click(screen.getByRole("button", { name: "こうかんする" }));

  expect(buyWardrobeItem).toHaveBeenCalledWith("item-1");
  expect(
    await screen.findByText("きんいろヘアを てにいれた！ きせかえで きてみよう"),
  ).toBeInTheDocument();
});

test("what was just bought disappears from the shop", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));
  await user.click(screen.getByRole("button", { name: "こうかんする" }));

  expect(await screen.findByText("かみがたは ぜんぶ てにいれたよ！")).toBeInTheDocument();
});

test("cancelling the dialog does not buy the item", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));
  await user.click(screen.getByRole("button", { name: "やめる" }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  // ダイアログを閉じただけで、まだ おみせ に残っている
  expect(screen.getByText("きんいろヘア")).toBeInTheDocument();
});

test("tapping outside the dialog cancels without buying", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));
  // ダイアログのカード自体ではなく、背景（オーバーレイ）をクリックする
  await user.click(screen.getByRole("dialog").parentElement!);

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("pressing Escape cancels the dialog without buying", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={500} items={[item()]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));
  await user.keyboard("{Escape}");

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("does not reveal what a locked item is, only how to get it", () => {
  render(<WardrobeShop pointsBalance={0} items={[item({ status: "locked" })]} />);

  expect(screen.queryByText("きんいろヘア")).not.toBeInTheDocument();
  expect(screen.getByText("？？？")).toBeInTheDocument();
  expect(screen.getByText("ぜんぶで 200もん せいかいすると もらえるよ")).toBeInTheDocument();
});

test("a locked item cannot be bought however rich the child is", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={99999} items={[item({ status: "locked" })]} />);

  await user.click(screen.getByRole("button", { name: /？？？/ }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
});

test("an item the child cannot afford is not bought", async () => {
  const user = userEvent.setup();
  render(<WardrobeShop pointsBalance={10} items={[item({ status: "tooExpensive" })]} />);

  await user.click(screen.getByRole("button", { name: /きんいろヘア/ }));

  expect(buyWardrobeItem).not.toHaveBeenCalled();
  expect(screen.getByText("ポイントを ためてから また きてね")).toBeInTheDocument();
  expect(screen.getByText("ポイントが たりないよ")).toBeInTheDocument();
});

test("tells the child when a slot is fully collected", () => {
  render(<WardrobeShop pointsBalance={0} items={[item({ slotType: "top" })]} />);

  // 初期表示は かみがた。トップスしか売っていないので空
  expect(screen.getByText("かみがたは ぜんぶ てにいれたよ！")).toBeInTheDocument();
});
