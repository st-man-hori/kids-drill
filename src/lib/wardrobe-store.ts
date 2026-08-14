import { and, eq, isNull, max, sql, sum } from "drizzle-orm";
import { db } from "@/db";
import {
  childEquippedItems,
  childOwnedWardrobeItems,
  childProfiles,
  difficultyLevels,
  practiceSessions,
  timeAttackRuns,
  wardrobeItems,
} from "@/db/schema";
import {
  isSlotType,
  isUnlocked,
  itemStatus,
  parseAssetRef,
  parseUnlockCondition,
  unlockConditionLabel,
  type AvatarAsset,
  type ChildAchievement,
  type ItemStatus,
  type SlotType,
} from "@/lib/wardrobe";

// 着せ替えのDBアクセス。判定そのものは wardrobe.ts の純粋関数に寄せてあり、
// ここは「DBから材料を集めて、判定にかけて、書き戻す」だけを受け持つ。

export type WardrobeItemView = {
  id: string;
  slotType: SlotType;
  name: string;
  asset: AvatarAsset;
  pricePoints: number | null;
  status: ItemStatus;
  // まだ解放されていないアイテムに「なにをすれば貰えるか」を出すための文言
  unlockLabel: string;
};

export type Wardrobe = {
  pointsBalance: number;
  items: WardrobeItemView[];
};

// 解放条件の判定に使う実績を集める。
//
// 到達レベルは child_progress の現在レベルではなく practice_sessions に残った
// 最高レベルから求める。降級（docs/game-design.md）があるため現在レベルは
// 下がりうるが、「レベル3まで すすむと もらえる」条件が後から不成立に戻るのは
// 子どもへの裏切りになるため。
export const getChildAchievement = async (
  childId: string,
): Promise<ChildAchievement> => {
  const [correct] = await db
    .select({ total: sum(practiceSessions.correctCount) })
    .from(practiceSessions)
    .where(eq(practiceSessions.childId, childId));

  const levels = await db
    .select({
      skillType: difficultyLevels.skillType,
      levelNumber: max(difficultyLevels.levelNumber),
    })
    .from(practiceSessions)
    .innerJoin(difficultyLevels, eq(practiceSessions.levelId, difficultyLevels.id))
    .where(eq(practiceSessions.childId, childId))
    .groupBy(difficultyLevels.skillType);

  const [timeAttack] = await db
    .select({ best: max(timeAttackRuns.correctCount) })
    .from(timeAttackRuns)
    .where(eq(timeAttackRuns.childId, childId));

  return {
    // sum()は行が無いとnull、あってもドライバによっては文字列で返る
    totalCorrect: Number(correct?.total ?? 0),
    reachedLevels: Object.fromEntries(
      levels.map((level) => [level.skillType, level.levelNumber ?? 0]),
    ),
    bestTimeAttackScore: timeAttack?.best ?? 0,
  };
};

const getOwnedItemIds = async (childId: string): Promise<Set<string>> => {
  const owned = await db
    .select({ id: childOwnedWardrobeItems.wardrobeItemId })
    .from(childOwnedWardrobeItems)
    .where(eq(childOwnedWardrobeItems.childId, childId));
  return new Set(owned.map((row) => row.id));
};

const getEquippedItemIds = async (childId: string): Promise<Set<string>> => {
  const equipped = await db
    .select({ id: childEquippedItems.wardrobeItemId })
    .from(childEquippedItems)
    .where(eq(childEquippedItems.childId, childId));
  return new Set(equipped.map((row) => row.id));
};

// そのスロットにまだ何も着ていなければ着せる。すでに着ているものは奪わない
// （UNIQUE(child_id, slot_type) の衝突を「何もしない」に倒すことで実現する）
const equipIfSlotEmpty = async (
  childId: string,
  slotType: SlotType,
  wardrobeItemId: string,
): Promise<void> => {
  await db
    .insert(childEquippedItems)
    .values({ childId, slotType, wardrobeItemId })
    .onConflictDoNothing({
      target: [childEquippedItems.childId, childEquippedItems.slotType],
    });
};

// 解放条件を満たした「無料の」アイテムを配る。新しく配ったものを返すので、
// 呼び出し側はそれを結果画面などで知らせられる（docs/game-design.md の報酬ループ）。
//
// price_points が入っているアイテムはここでは配らない。条件を満たすと
// 「ポイントで交換できるようになる」だけ（docs/data-model.md）。
export const grantUnlockedFreeItems = async (
  childId: string,
): Promise<{ id: string; name: string }[]> => {
  const [achievement, ownedIds] = await Promise.all([
    getChildAchievement(childId),
    getOwnedItemIds(childId),
  ]);

  const freeItems = await db
    .select()
    .from(wardrobeItems)
    .where(isNull(wardrobeItems.pricePoints));

  const toGrant = freeItems.filter(
    (item) =>
      !ownedIds.has(item.id) &&
      isSlotType(item.slotType) &&
      isUnlocked(
        parseUnlockCondition(item.unlockConditionType, item.unlockConditionValue),
        achievement,
      ),
  );

  if (toGrant.length === 0) return [];

  await db
    .insert(childOwnedWardrobeItems)
    .values(toGrant.map((item) => ({ childId, wardrobeItemId: item.id })))
    // 同時に2回走っても二重登録にならないようにする
    .onConflictDoNothing({
      target: [childOwnedWardrobeItems.childId, childOwnedWardrobeItems.wardrobeItemId],
    });

  // 初めて手に入れたスロットは自動で着せる。着るものが無くて
  // アバターが裸のまま、という状態を作らないため
  for (const item of toGrant) {
    if (isSlotType(item.slotType)) {
      await equipIfSlotEmpty(childId, item.slotType, item.id);
    }
  }

  return toGrant.map((item) => ({ id: item.id, name: item.name }));
};

// 図鑑（カタログ）全件を、その子から見た状態つきで返す
export const getWardrobe = async (childId: string): Promise<Wardrobe> => {
  const [child, achievement, ownedIds, equippedIds, catalog] = await Promise.all([
    db.query.childProfiles.findFirst({ where: eq(childProfiles.id, childId) }),
    getChildAchievement(childId),
    getOwnedItemIds(childId),
    getEquippedItemIds(childId),
    db.select().from(wardrobeItems),
  ]);

  const pointsBalance = child?.pointsBalance ?? 0;

  const items = catalog
    .filter((item) => isSlotType(item.slotType))
    .map((item) => {
      const condition = parseUnlockCondition(
        item.unlockConditionType,
        item.unlockConditionValue,
      );
      return {
        id: item.id,
        slotType: item.slotType as SlotType,
        name: item.name,
        asset: parseAssetRef(item.assetRef),
        pricePoints: item.pricePoints,
        status: itemStatus({
          owned: ownedIds.has(item.id),
          equipped: equippedIds.has(item.id),
          unlocked: isUnlocked(condition, achievement),
          pricePoints: item.pricePoints,
          pointsBalance,
        }),
        unlockLabel: unlockConditionLabel(condition),
      };
    });

  return { pointsBalance, items };
};

export type WardrobeActionResult =
  | { ok: true }
  | { ok: false; reason: "notFound" | "locked" | "alreadyOwned" | "notEnoughPoints" | "notOwned" };

// ポイントとアイテムを交換する。
//
// neon-httpドライバはトランザクションを張れないため、次の順で進める。
//   1. 所持レコードを先に入れる（UNIQUE制約で二重購入を防ぐ）
//   2. 残高が足りている場合だけ減算する（条件付きUPDATEで同時実行に耐える）
//   3. 減算できなければ1を取り消す
// この順にしたのは、途中で落ちたときに「ポイントだけ減ってアイテムが無い」より
// 「アイテムだけ手に入る」ほうが子どもへの実害が小さいため。
export const purchaseItem = async (
  childId: string,
  wardrobeItemId: string,
): Promise<WardrobeActionResult> => {
  const item = await db.query.wardrobeItems.findFirst({
    where: eq(wardrobeItems.id, wardrobeItemId),
  });
  if (!item || !isSlotType(item.slotType)) return { ok: false, reason: "notFound" };
  if (item.pricePoints === null) return { ok: false, reason: "notFound" };

  const achievement = await getChildAchievement(childId);
  const condition = parseUnlockCondition(item.unlockConditionType, item.unlockConditionValue);
  if (!isUnlocked(condition, achievement)) return { ok: false, reason: "locked" };

  const claimed = await db
    .insert(childOwnedWardrobeItems)
    .values({ childId, wardrobeItemId })
    .onConflictDoNothing({
      target: [childOwnedWardrobeItems.childId, childOwnedWardrobeItems.wardrobeItemId],
    })
    .returning({ id: childOwnedWardrobeItems.wardrobeItemId });

  if (claimed.length === 0) return { ok: false, reason: "alreadyOwned" };

  const paid = await db
    .update(childProfiles)
    .set({
      pointsBalance: sql`${childProfiles.pointsBalance} - ${item.pricePoints}`,
    })
    .where(
      and(
        eq(childProfiles.id, childId),
        sql`${childProfiles.pointsBalance} >= ${item.pricePoints}`,
      ),
    )
    .returning({ id: childProfiles.id });

  if (paid.length === 0) {
    await db
      .delete(childOwnedWardrobeItems)
      .where(
        and(
          eq(childOwnedWardrobeItems.childId, childId),
          eq(childOwnedWardrobeItems.wardrobeItemId, wardrobeItemId),
        ),
      );
    return { ok: false, reason: "notEnoughPoints" };
  }

  await equipIfSlotEmpty(childId, item.slotType, wardrobeItemId);
  return { ok: true };
};

// 持っているアイテムを着る。1部位1アイテムはDBのUNIQUE制約で担保されている
// （docs/data-model.md）ので、ここはupsertで置き換えるだけでよい
export const equipItem = async (
  childId: string,
  wardrobeItemId: string,
): Promise<WardrobeActionResult> => {
  const item = await db.query.wardrobeItems.findFirst({
    where: eq(wardrobeItems.id, wardrobeItemId),
  });
  if (!item || !isSlotType(item.slotType)) return { ok: false, reason: "notFound" };

  const owned = await db.query.childOwnedWardrobeItems.findFirst({
    where: and(
      eq(childOwnedWardrobeItems.childId, childId),
      eq(childOwnedWardrobeItems.wardrobeItemId, wardrobeItemId),
    ),
  });
  // 持っていないものは着られない（アプリ側で担保する、と docs/data-model.md）
  if (!owned) return { ok: false, reason: "notOwned" };

  await db
    .insert(childEquippedItems)
    .values({ childId, slotType: item.slotType, wardrobeItemId })
    .onConflictDoUpdate({
      target: [childEquippedItems.childId, childEquippedItems.slotType],
      set: { wardrobeItemId, equippedAt: new Date() },
    });

  return { ok: true };
};
