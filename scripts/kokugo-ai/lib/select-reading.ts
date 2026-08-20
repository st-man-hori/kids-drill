import type { KyoikuKanjiEntry } from "./kyoiku-kanji-client";

export type SelectedReading = {
  reading: string; // 元の表記のまま（音読みはカタカナ、訓読みはひらがな）
  readingType: "on" | "kun";
};

// 「（つ）」のような送り仮名注記を含む表記（例:「や(つ)」）は、単独の字の読みとしては
// 出題しない。「やっ」のような活用の途中形になってしまい、小1が単体で習う読みとズレるため
const bareReadings = (readings: string[]): string[] =>
  readings.filter((reading) => !reading.includes("("));

const katakanaToHiragana = (value: string): string =>
  value.replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));

// 「この漢字の読み方は？」という設問の正解を1つに決める。学年配当表は音読み・
// 訓読みを複数持つ字が多く、機械的に「先頭の訓読み」等を選ぶと例えば「八」が
// 「や」になり、日常の感覚（はち）とズレる。そこでAPIが代表的な使い方として
// 先頭に置いている最初の用例の読み仮名と前方一致する候補を「その字の代表的な
// 読み」とみなす（「八月（はちがつ）」→「ハチ」が一致）
export const selectPrimaryReading = (entry: KyoikuKanjiEntry): SelectedReading | null => {
  const candidates: SelectedReading[] = [
    ...bareReadings(entry.onyomi.ja).map((reading) => ({ reading, readingType: "on" as const })),
    ...bareReadings(entry.kunyomi.ja).map((reading) => ({
      reading,
      readingType: "kun" as const,
    })),
  ];

  if (candidates.length === 0) return null;

  const firstExample = entry.examples[0];
  const furigana = firstExample?.word.match(/[（(]([^）)]+)[）)]/)?.[1];

  if (furigana) {
    // 最長一致を優先する（例:「よ」が「よん」より先に部分一致してしまうのを防ぐ）
    const matched = [...candidates]
      .sort((a, b) => b.reading.length - a.reading.length)
      .find((candidate) => furigana.startsWith(katakanaToHiragana(candidate.reading)));
    if (matched) return matched;
  }

  // 用例と一致しなかった場合は音読み優先（無ければ先頭の訓読み）にフォールバックする
  return candidates.find((c) => c.readingType === "on") ?? candidates[0];
};
