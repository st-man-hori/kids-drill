import { beforeEach, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WardrobeCloset } from "@/components/wardrobe-closet";
import { wearWardrobeItem } from "@/app/wardrobe/actions";
import type { WardrobeItemView } from "@/lib/wardrobe-store";
import type { ChildFace } from "@/lib/face";

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

const face: ChildFace = { skinTone: "light", eyeStyle: "dot", mouthStyle: "smile" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(wearWardrobeItem).mockResolvedValue({ ok: true });
});

test("shows the points the child has", () => {
  render(<WardrobeCloset pointsBalance={420} items={[item()]} face={face} />);

  expect(screen.getByText("もっている ポイント 420")).toBeInTheDocument();
});

test("wearing an owned item asks the server to save it", async () => {
  const user = userEvent.setup();
  render(<WardrobeCloset pointsBalance={0} items={[item()]} face={face} />);

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(wearWardrobeItem).toHaveBeenCalledWith("item-1");
});

test("the item already worn cannot be tapped again", async () => {
  const user = userEvent.setup();
  render(<WardrobeCloset pointsBalance={0} items={[item({ status: "equipped" })]} face={face} />);

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(wearWardrobeItem).not.toHaveBeenCalled();
  expect(screen.getByText("きているよ")).toBeInTheDocument();
});

test("points the child to the shop when a slot has nothing in it", () => {
  render(<WardrobeCloset pointsBalance={0} items={[item({ slotType: "top" })]} face={face} />);

  // 初期表示は かみがた。トップスしか持っていないので空
  expect(
    screen.getByText("まだ かみがたを もっていないよ。おみせを のぞいてみよう"),
  ).toBeInTheDocument();
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
      face={face}
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
  render(<WardrobeCloset pointsBalance={0} items={[item()]} face={face} />);

  await user.click(screen.getByRole("button", { name: /ふわふわヘア/ }));

  expect(
    await screen.findByText("うまく きられなかったよ。もういちど ためしてね"),
  ).toBeInTheDocument();
});
