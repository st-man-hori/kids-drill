// マイページを開いたときにアバターがする「あいさつ」の種類。
// 毎回おなじ動きだと2回目から目に入らなくなるので、訪れるたびに引き直す。
//
// どれを出すかは**サーバー側で決めてpropsで渡す**こと。Client Component側で
// Math.randomを引くと、SSR時とハイドレーション時とで別の結果になり
// hydration mismatchになる（practice/add/page.tsx の出題生成と同じ理由）。

export const AVATAR_GREETINGS = ["wave", "cheer", "hop", "spin", "bow"] as const;

export type AvatarGreeting = (typeof AVATAR_GREETINGS)[number];

// randomは0以上1未満を想定。テストしやすいよう関数ではなく値で受ける
export const pickGreeting = (random: number = Math.random()): AvatarGreeting => {
  const index = Math.floor(random * AVATAR_GREETINGS.length);
  // random が 1 や 負の値、NaN でも配列の外に出ないようにする。
  // Math.max(NaN, 0) は NaN を返すので、クランプの前に弾く必要がある
  if (!Number.isFinite(index)) return AVATAR_GREETINGS[0];
  return AVATAR_GREETINGS[Math.min(Math.max(index, 0), AVATAR_GREETINGS.length - 1)];
};
