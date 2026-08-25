import { eq } from "drizzle-orm";
import { db } from "@/db";
import { childProfiles } from "@/db/schema";
import {
  DEFAULT_EYE_STYLE,
  DEFAULT_MOUTH_STYLE,
  DEFAULT_SKIN_TONE,
  isEyeStyle,
  isMouthStyle,
  isSkinTone,
  type ChildFace,
} from "@/lib/face";

// 顔(肌の色・目・口)のDBアクセス。判定そのものは face.ts の純粋関数に寄せてあり、
// ここは「DBから読む/書く」だけを受け持つ（wardrobe-store.tsと同じ方針）。

export const getChildFace = async (childId: string): Promise<ChildFace> => {
  const child = await db.query.childProfiles.findFirst({
    where: eq(childProfiles.id, childId),
    columns: { skinTone: true, eyeStyle: true, mouthStyle: true },
  });

  return {
    skinTone: isSkinTone(child?.skinTone) ? child.skinTone : DEFAULT_SKIN_TONE,
    eyeStyle: isEyeStyle(child?.eyeStyle) ? child.eyeStyle : DEFAULT_EYE_STYLE,
    mouthStyle: isMouthStyle(child?.mouthStyle) ? child.mouthStyle : DEFAULT_MOUTH_STYLE,
  };
};

// 1項目だけの部分更新にも対応する（ピッカーは肌・目・口を別々にタップして
// その場で保存するため、毎回3項目まとめて送らせる必要はない）
export const updateChildFace = async (
  childId: string,
  patch: Partial<ChildFace>,
): Promise<void> => {
  const set: Partial<Record<"skinTone" | "eyeStyle" | "mouthStyle", string>> = {};
  if (patch.skinTone && isSkinTone(patch.skinTone)) set.skinTone = patch.skinTone;
  if (patch.eyeStyle && isEyeStyle(patch.eyeStyle)) set.eyeStyle = patch.eyeStyle;
  if (patch.mouthStyle && isMouthStyle(patch.mouthStyle)) set.mouthStyle = patch.mouthStyle;
  if (Object.keys(set).length === 0) return;

  await db.update(childProfiles).set(set).where(eq(childProfiles.id, childId));
};
