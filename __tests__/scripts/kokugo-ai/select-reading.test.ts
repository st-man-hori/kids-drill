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

test("picks the reading matching the first example's furigana (八 -> ハチ, not the kun-reading や)", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "八",
      kunyomi: { ja: ["や", "や(つ)", "やっ(つ)", "よう"], romaji: [] },
      onyomi: { ja: ["ハチ"], romaji: [] },
      examples: [{ word: "八月（はちがつ）", meaning: "August" }],
    }),
  );

  expect(result).toEqual({ reading: "ハチ", readingType: "on" });
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

  expect(result).toEqual({ reading: "よん", readingType: "kun" });
});

test("falls back to onyomi when no reading matches the example", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "山",
      kunyomi: { ja: ["やま"], romaji: [] },
      onyomi: { ja: ["サン"], romaji: [] },
      examples: [{ word: "富士山（ふじさん）", meaning: "Mt. Fuji" }],
    }),
  );

  // 「ふじさん」はどちらとも前方一致しないので、音読み優先のフォールバックになる
  expect(result).toEqual({ reading: "サン", readingType: "on" });
});

test("falls back to the first kunyomi when there is no onyomi at all", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "々",
      kunyomi: { ja: ["のま"], romaji: [] },
      onyomi: { ja: [], romaji: [] },
      examples: [],
    }),
  );

  expect(result).toEqual({ reading: "のま", readingType: "kun" });
});

test("returns null when every reading only exists as an okurigana variant", () => {
  const result = selectPrimaryReading(
    entry({
      kunyomi: { ja: ["た(つ)"], romaji: [] },
      onyomi: { ja: [], romaji: [] },
    }),
  );

  expect(result).toBeNull();
});

test("skips okurigana-annotated readings when matching against the example", () => {
  const result = selectPrimaryReading(
    entry({
      kanji: "九",
      kunyomi: { ja: ["ここの", "ここの(つ)"], romaji: [] },
      onyomi: { ja: ["キュウ", "ク"], romaji: [] },
      examples: [{ word: "九州（きゅうしゅう）", meaning: "Kyuushuu" }],
    }),
  );

  expect(result).toEqual({ reading: "キュウ", readingType: "on" });
});
