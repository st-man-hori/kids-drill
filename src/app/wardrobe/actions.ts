"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { equipItem, purchaseItem, type WardrobeActionResult } from "@/lib/wardrobe-store";

// Server Actionは画面を経由せず直接POSTできる。どのアイテムを持っているか・
// 解放条件を満たしているか・ポイントが足りるかは、すべてサーバー側で
// 導出しなおすこと（クライアントの申告を信じない）。
// 練習モードのactions.tsと同じ方針（docs/game-design.md）。

const NOT_LOGGED_IN: WardrobeActionResult = { ok: false, reason: "notFound" };

const isValidId = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= 64;

export const buyWardrobeItem = async (
  wardrobeItemId: string,
): Promise<WardrobeActionResult> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return NOT_LOGGED_IN;
  if (!isValidId(wardrobeItemId)) return { ok: false, reason: "notFound" };

  const result = await purchaseItem(childId, wardrobeItemId);
  if (result.ok) revalidatePath("/wardrobe");
  return result;
};

export const wearWardrobeItem = async (
  wardrobeItemId: string,
): Promise<WardrobeActionResult> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return NOT_LOGGED_IN;
  if (!isValidId(wardrobeItemId)) return { ok: false, reason: "notFound" };

  const result = await equipItem(childId, wardrobeItemId);
  if (result.ok) revalidatePath("/wardrobe");
  return result;
};
