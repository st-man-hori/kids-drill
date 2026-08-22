import type { KyoikuKanjiEntry } from "./kyoiku-kanji-client";

export type SelectedReadingExample = {
  word: string; // 用例そのまま（例:「大学（だいがく）」）
  fullReading: string; // 用例のふりがな全体（例:「だいがく」）
  maskedReading: string; // 対象の字が担う部分だけを○で伏せたもの（例:「○○がく」）
};

export type SelectedReading = {
  reading: string; // 元の表記のまま（音読みはカタカナ、訓読みはひらがな）
  readingType: "on" | "kun";
  example: SelectedReadingExample;
};

// 「（つ）」のような送り仮名注記を含む表記（例:「や(つ)」）は、単独の字の読みとしては
// 出題しない。「やっ」のような活用の途中形になってしまい、小1が単体で習う読みとズレるため
const bareReadings = (readings: string[]): string[] =>
  readings.filter((reading) => !reading.includes("("));

const katakanaToHiragana = (value: string): string =>
  value.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

const parseExampleWord = (word: string): { base: string; furigana: string } | null => {
  const match = word.match(/^(.*?)[（(]([^）)]+)[）)]/);
  if (!match) return null;
  return { base: match[1], furigana: match[2] };
};

// 学年配当表は音読み・訓読みを複数持つ字が多い（例:「大」は タイ/ダイ どちらも
// 正しい）。「この字単体の読みは？」という設問はそもそも答えが一意に決まらず、
// AIが生成した誤答が実は別の場面で正しい読みだった、という事故が起きる
// （「大」の設問で正解=ダイ、誤答=タイとしたが、大変(たいへん)ではタイが正しい）。
//
// これを避けるため、用例（実際にその読みで使われる熟語）を文脈として出題する。
// 対象の字が熟語の先頭または末尾にあり、ふりがな全体の前方一致・後方一致で
// 対象の字ぶんの読みを切り出せる用例だけを採用する（中間位置は境界が
// 一意に決まらないため対象外）。
//
// 用例は教育漢字APIが返す順の中で条件を満たすものを「すべて」集めて返す
// （以前は最初の1件で打ち切っていたが、複数の用例候補があるときにどれを
// 出題に使うかは呼び出し側がAIで難易度判定できるようにするため。
// select-example-difficulty.ts参照）。1件も見つからなければ空配列を返し、
// 呼び出し側はその字の出題を諦める
export const selectReadingCandidates = (entry: KyoikuKanjiEntry): SelectedReading[] => {
  const candidates: { reading: string; readingType: "on" | "kun" }[] = [
    ...bareReadings(entry.onyomi.ja).map((reading) => ({ reading, readingType: "on" as const })),
    ...bareReadings(entry.kunyomi.ja).map((reading) => ({
      reading,
      readingType: "kun" as const,
    })),
  ];
  if (candidates.length === 0) return [];

  const sortedCandidates = [...candidates].sort((a, b) => b.reading.length - a.reading.length);
  const results: SelectedReading[] = [];

  for (const example of entry.examples) {
    const parsed = parseExampleWord(example.word);
    if (!parsed) continue;
    const { base, furigana } = parsed;
    if (base.length < 2) continue; // 対象単独の用例は文脈にならない

    const targetIndex = base.indexOf(entry.kanji);
    if (targetIndex === -1) continue;
    const isPrefix = targetIndex === 0;
    const isSuffix = targetIndex === base.length - 1;
    if (!isPrefix && !isSuffix) continue; // 中間位置は境界が一意に決まらない

    for (const candidate of sortedCandidates) {
      const hiraganaReading = katakanaToHiragana(candidate.reading);
      if (hiraganaReading.length === 0 || hiraganaReading.length >= furigana.length) continue;

      if (isPrefix && furigana.startsWith(hiraganaReading)) {
        const rest = furigana.slice(hiraganaReading.length);
        results.push({
          reading: candidate.reading,
          readingType: candidate.readingType,
          example: {
            word: example.word,
            fullReading: furigana,
            maskedReading: `${"○".repeat(hiraganaReading.length)}${rest}`,
          },
        });
        break; // この用例に対しては（最長一致の）1候補だけを採用し、次の用例へ
      }
      if (isSuffix && furigana.endsWith(hiraganaReading)) {
        const head = furigana.slice(0, furigana.length - hiraganaReading.length);
        results.push({
          reading: candidate.reading,
          readingType: candidate.readingType,
          example: {
            word: example.word,
            fullReading: furigana,
            maskedReading: `${head}${"○".repeat(hiraganaReading.length)}`,
          },
        });
        break;
      }
    }
  }

  return results;
};

// 後方互換・単純なケース用: 最初に見つかった候補だけでよい呼び出し側向け
// （テスト、および候補選定にAIを使わない用途）
export const selectPrimaryReading = (entry: KyoikuKanjiEntry): SelectedReading | null =>
  selectReadingCandidates(entry)[0] ?? null;
