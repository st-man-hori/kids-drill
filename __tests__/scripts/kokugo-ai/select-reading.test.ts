import { expect, test } from "vitest";
import { selectPrimaryReading } from "../../../scripts/kokugo-ai/lib/select-reading";
import type { KyoikuKanjiEntry } from "../../../scripts/kokugo-ai/lib/kyoiku-kanji-client";

const entry = (over: Partial<KyoikuKanjiEntry>): KyoikuKanjiEntry => ({
  kanji: "?",
  strokeCount: 1,
  meaning: "",
  grade: 1,
  kunyomi: { ja: [], romaji: [] },
  onyomi: { ja: [], romaji: [] },
  examples: [],
  ...over,
});

test("picks a reading disambiguated by an example, not just 'the first' reading (八 -> ハチ via 八月, not the kun-reading や)", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "八",
      kunyomi: { ja: ["や", "や(つ)", "やっ(つ)", "よう"], romaji: [] },
      onyomi: { ja: ["ハチ"], romaji: [] },
      examples: [{ word: "八月（はちがつ）", meaning: "August" }],
    }),
  );

  expect(result?.reading).toBe("ハチ");
  expect(result?.readingType).toBe("on");
  expect(result?.example).toEqual({
    word: "八月（はちがつ）",
    fullReading: "はちがつ",
    maskedReading: "○○がつ",
  });
});

test("masks from the end when the target kanji is the last character of the word (子 in 帽子)", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "子",
      kunyomi: { ja: ["こ"], romaji: [] },
      onyomi: { ja: ["シ", "ス"], romaji: [] },
      examples: [{ word: "帽子（ぼうし）", meaning: "hat" }],
    }),
  );

  expect(result?.reading).toBe("シ");
  expect(result?.example).toEqual({
    word: "帽子（ぼうし）",
    fullReading: "ぼうし",
    maskedReading: "ぼう○",
  });
});

// レポートされた不具合の再現ケース: 大は タイ/ダイ どちらも正しい音読みなので、
// 文脈（用例）なしに「正解はダイ」と決め打つと、タイを誤答扱いする事故が起きる。
// 用例ごとの文脈で読みを選ぶことで、この字は複数の設問（大学→ダイ、大変→タイ）を
// 生成しうる字になり、どちらの設問でも実際に使われる読みが正解になる
test("大 resolves to だい via 大学, not the context-free 'primary reading' bug", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "大",
      kunyomi: { ja: ["おお", "おお(いに)", "おお(きい)"], romaji: [] },
      onyomi: { ja: ["タイ", "ダイ"], romaji: [] },
      examples: [
        { word: "大学（だいがく）", meaning: "university" },
        { word: "大変な（たいへんな）", meaning: "terrible, very" },
      ],
    }),
  );

  expect(result?.reading).toBe("ダイ");
  expect(result?.example?.maskedReading).toBe("○○がく");
});

test("prefers the longest matching candidate to avoid false partial matches (四 -> よん, not よ)", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "四",
      kunyomi: { ja: ["よ", "よ(つ)", "よっ(つ)", "よん"], romaji: [] },
      onyomi: { ja: ["シ"], romaji: [] },
      examples: [{ word: "四回（よんかい）", meaning: "4 times" }],
    }),
  );

  expect(result?.reading).toBe("よん");
  expect(result?.readingType).toBe("kun");
});

test("skips a single-character example (no surrounding context to disambiguate) and tries the next one", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "山",
      kunyomi: { ja: ["やま"], romaji: [] },
      onyomi: { ja: ["サン"], romaji: [] },
      examples: [
        { word: "山（やま）", meaning: "mountain" },
        { word: "富士山（ふじさん）", meaning: "Mt. Fuji" },
      ],
    }),
  );

  expect(result?.reading).toBe("サン");
  expect(result?.example?.maskedReading).toBe("ふじ○○");
});

test("skips examples where the target kanji sits in the middle (boundary not determinable)", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "中",
      kunyomi: { ja: ["なか"], romaji: [] },
      onyomi: { ja: ["チュウ"], romaji: [] },
      examples: [
        // 「中」が語の真ん中にある用例（境界が一意に決まらないためスキップされる想定）
        { word: "年中組（ねんちゅうぐみ）", meaning: "" },
        { word: "中止（ちゅうし）", meaning: "cancellation" },
      ],
    }),
  );

  expect(result?.reading).toBe("チュウ");
  expect(result?.example?.word).toBe("中止（ちゅうし）");
});

test("returns null when no example lets the reading be cut out unambiguously", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "子",
      kunyomi: { ja: ["こ"], romaji: [] },
      onyomi: { ja: ["シ"], romaji: [] },
      examples: [{ word: "様子（ようす）", meaning: "state, appearance" }],
    }),
  );

  expect(result).toBeNull();
});

test("returns null when every reading only exists as an okurigana variant", () => {
  const result = selectPrimaryReading(
    entry({
      kunyomi: { ja: ["た(つ)"], romaji: [] },
      onyomi: { ja: [], romaji: [] },
      examples: [{ word: "田田（たた）", meaning: "" }],
    }),
  );

  expect(result).toBeNull();
});
