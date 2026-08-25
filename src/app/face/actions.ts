"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { updateChildFace } from "@/lib/face-store";
import { isEyeStyle, isMouthStyle, isSkinTone, type ChildFace } from "@/lib/face";

// Server Actionは画面を経由せず直接POSTできる。送られてきた値が本当に
// 定義済みの選択肢かはサーバー側で必ず確かめる（クライアントの申告を信じない）。
// wardrobe/actions.tsと同じ方針（docs/game-design.md）。

export const updateFaceAction = async (
  patch: Partial<ChildFace>,
): Promise<{ ok: boolean }> => {
  const session = await auth();
  const childId = session?.user?.id;
  if (!childId) return { ok: false };

  const safePatch: Partial<ChildFace> = {};
  if (patch.skinTone && isSkinTone(patch.skinTone)) safePatch.skinTone = patch.skinTone;
  if (patch.eyeStyle && isEyeStyle(patch.eyeStyle)) safePatch.eyeStyle = patch.eyeStyle;
  if (patch.mouthStyle && isMouthStyle(patch.mouthStyle)) safePatch.mouthStyle = patch.mouthStyle;
  if (Object.keys(safePatch).length === 0) return { ok: false };

  await updateChildFace(childId, safePatch);
  revalidatePath("/face");
  revalidatePath("/mypage");
  revalidatePath("/wardrobe");
  return { ok: true };
};
