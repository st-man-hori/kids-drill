// さくらのAI Engine（OpenAI互換 Chat Completions）への薄いクライアント。
// 誤答生成にしか使わないため、最小限の実装に留める

export type ChatMessage = { role: "system" | "user"; content: string };

export const chatCompletion = async (
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<string> => {
  const baseUrl = process.env.SAKURA_AI_BASE_URL;
  const apiKey = process.env.SAKURA_AI_API_KEY;
  const model = process.env.SAKURA_AI_MODEL;
  if (!baseUrl || !apiKey || !model) {
    throw new Error(
      "SAKURA_AI_BASE_URL / SAKURA_AI_API_KEY / SAKURA_AI_MODEL が未設定です（.envを確認してください）",
    );
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.7 }),
  });

  if (!res.ok) {
    throw new Error(`Sakura AI ${res.status} ${res.statusText}: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error(`Sakura AI: unexpected response shape: ${JSON.stringify(data)}`);
  }
  return content;
};
