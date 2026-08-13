// サーバーの実行タイムゾーンに依存する（対象がほぼ国内利用のため、
// デプロイ先のリージョンを日本時間に合わせておく前提）。
export const getTimeBasedGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour >= 5 && hour < 10) return "おはよう";
  if (hour >= 10 && hour < 18) return "こんにちは";
  return "こんばんは";
};
