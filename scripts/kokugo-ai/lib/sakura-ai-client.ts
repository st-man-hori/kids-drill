// さくらのAI Engine（OpenAI互換 Chat Completions）への薄いクライアント。
// 誤答生成にしか使わないため、最小限の実装に留める

export type ChatMessage = { role: "system" | "user"; content: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 429（レート制限）は「その字はもう諦める」でフォールバックへ倒すのではなく、
// Retry-Afterに従って待ってから同じリクエストをやり直す。呼び出し元
// （build-distractors.tsのリトライ・フォールバック）は「本当にAIが
// おかしな内容を返した場合」だけを対象にしたいため、一時的な流量制限は
// ここで吸収してしまう
const MAX_RATE_LIMIT_RETRIES = 5;

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

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.7 }),
    });

    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfterSeconds = Number(res.headers.get("retry-after")) || 10;
      await sleep(retryAfterSeconds * 1000 + 500);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Sakura AI ${res.status} ${res.statusText}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error(`Sakura AI: unexpected response shape: ${JSON.stringify(data)}`);
    }
    return content;
  }

  throw new Error("Sakura AI: rate limited past MAX_RATE_LIMIT_RETRIES");
};
