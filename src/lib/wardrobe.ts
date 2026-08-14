// 着せ替え（wardrobe）まわりの純粋なロジック。DBアクセスは持ち込まないこと
// （Client Componentからも読み込むため）。DBを触る処理は wardrobe-store.ts 側。
// 設計の一次情報源は docs/game-design.md の「着せ替えアバター」。

// アイテムスロット。将来 帽子・メガネ などを足す場合はここに追加する
// （docs/game-design.md: slot_typeを足すだけでよい設計）
export const SLOT_TYPES = ["hair", "top", "bottom", "necklace"] as const;
export type SlotType = (typeof SLOT_TYPES)[number];

export const SLOT_LABELS: Record<SlotType, string> = {
  hair: "かみがた",
  top: "トップス",
  bottom: "ボトムス",
  necklace: "ネックレス",
};

// アバターの重ね順（後ろ → 前）。髪はからだより後ろ、ネックレスは一番手前
export const SLOT_DRAW_ORDER: readonly SlotType[] = [
  "hair",
  "bottom",
  "top",
  "necklace",
];

export const isSlotType = (value: unknown): value is SlotType =>
  typeof value === "string" && (SLOT_TYPES as readonly string[]).includes(value);

// 解放条件。docs/data-model.md の unlock_condition_type / unlock_condition_value に対応する。
// 種類を増やすときはここと isUnlocked の両方を足す（アイテム追加自体はレコードだけで済む）
export type UnlockCondition =
  | { type: "always" }
  | { type: "total_correct"; count: number }
  | { type: "level_reached"; skillType: string; levelNumber: number }
  | { type: "time_attack_score"; score: number };

// 解放判定に使う、その子の実績のスナップショット
export type ChildAchievement = {
  // 練習モードの累計正解数
  totalCorrect: number;
  // skillType（add / subtract ...）ごとの到達レベル
  reachedLevels: Readonly<Record<string, number>>;
  // タイムアタックの自己ベスト（未プレイなら0）
  bestTimeAttackScore: number;
};

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

// DBのjsonbは何でも入りうるので、読めない条件はnullを返して「解放しない」に倒す。
// 壊れたデータで全アイテムが解放されてしまうより、出ないほうが安全
export const parseUnlockCondition = (
  type: string,
  value: unknown,
): UnlockCondition | null => {
  const record = typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

  switch (type) {
    case "always":
      return { type: "always" };
    case "total_correct": {
      const count = asNumber(record.count);
      return count === null ? null : { type: "total_correct", count };
    }
    case "level_reached": {
      const levelNumber = asNumber(record.levelNumber);
      const skillType = record.skillType;
      return levelNumber === null || typeof skillType !== "string"
        ? null
        : { type: "level_reached", skillType, levelNumber };
    }
    case "time_attack_score": {
      const score = asNumber(record.score);
      return score === null ? null : { type: "time_attack_score", score };
    }
    default:
      return null;
  }
};

export const isUnlocked = (
  condition: UnlockCondition | null,
  achievement: ChildAchievement,
): boolean => {
  if (!condition) return false;

  switch (condition.type) {
    case "always":
      return true;
    case "total_correct":
      return achievement.totalCorrect >= condition.count;
    case "level_reached":
      return (achievement.reachedLevels[condition.skillType] ?? 0) >= condition.levelNumber;
    case "time_attack_score":
      return achievement.bestTimeAttackScore >= condition.score;
  }
};

// 解放条件の説明文。まだ手に入らないアイテムに「なにをすれば貰えるか」を見せる。
// 平仮名/カタカナのみ（docs/design.md の文言ルール）
export const unlockConditionLabel = (condition: UnlockCondition | null): string => {
  if (!condition) return "まだ ひみつ";

  switch (condition.type) {
    case "always":
      return "さいしょから つかえるよ";
    case "total_correct":
      return `ぜんぶで ${condition.count}もん せいかいすると もらえるよ`;
    case "level_reached":
      return `レベル${condition.levelNumber}まで すすむと もらえるよ`;
    case "time_attack_score":
      return `タイムアタックで ${condition.score}てん とると もらえるよ`;
  }
};

// 画面に出すアイテム1件の状態。サーバー側で導出し、クライアントの申告は信用しない
export type ItemStatus =
  | "equipped" // 今つけている
  | "owned" // 持っている（つけられる）
  | "affordable" // 条件は満たしていて、ポイントも足りる
  | "tooExpensive" // 条件は満たしているが、ポイントが足りない
  | "locked"; // 解放条件をまだ満たしていない

export const itemStatus = ({
  owned,
  equipped,
  unlocked,
  pricePoints,
  pointsBalance,
}: {
  owned: boolean;
  equipped: boolean;
  unlocked: boolean;
  pricePoints: number | null;
  pointsBalance: number;
}): ItemStatus => {
  if (equipped) return "equipped";
  if (owned) return "owned";
  if (!unlocked) return "locked";
  // price_pointsがnullのアイテムは条件を満たした時点で無料開放される
  // （docs/data-model.md）。その場合ここには来ない想定だが、
  // 付与前に画面を見た場合に備えて「もらえる」扱いにしておく
  if (pricePoints === null) return "affordable";
  return pointsBalance >= pricePoints ? "affordable" : "tooExpensive";
};

// 持っているアイテムかどうか。きせかえ画面とおみせ画面の振り分けに使う
export const isOwnedStatus = (status: ItemStatus): boolean =>
  status === "equipped" || status === "owned";

// 一覧の並び順。前から順に「今の状態 → もうすぐ手が届くもの」になるようにして、
// 一覧そのものが進み具合を語るようにする
const STATUS_ORDER: Record<ItemStatus, number> = {
  equipped: 0,
  owned: 1,
  affordable: 2,
  tooExpensive: 3,
  locked: 4,
};

// 同じ状態のなかでは安いものから並べる。おみせでは「つぎの目標」が
// 上に来るほうが分かりやすいため。無料（null）はいちばん前
export const compareItems = <T extends { status: ItemStatus; pricePoints: number | null; name: string }>(
  a: T,
  b: T,
): number =>
  STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
  (a.pricePoints ?? -1) - (b.pricePoints ?? -1) ||
  a.name.localeCompare(b.name, "ja");

// ダミーのアセット表現。実画像を用意するまでの暫定で、asset_refに
// 「バリアント名 色」を入れておき、図形はコード側のバリアントで描く。
// この形式なら、同じバリアントで色違いのアイテムを足すのはレコード追加だけで済む
// （docs/game-design.md: 新アイテム追加はレコード1件で足りる、という要件）
export type AvatarAsset = { variant: string; color: string };

const FALLBACK_ASSET: AvatarAsset = { variant: "a", color: "#cbd5e1" };

export const parseAssetRef = (assetRef: string): AvatarAsset => {
  const [variant, color] = assetRef.trim().split(/\s+/);
  if (!variant || !color || !/^#[0-9a-fA-F]{3,8}$/.test(color)) return FALLBACK_ASSET;
  return { variant, color };
};
