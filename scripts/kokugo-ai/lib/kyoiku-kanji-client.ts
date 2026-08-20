// api.kyoiku-kanji.st-man.com のクライアント。認証不要の公開API。
// レスポンス型は実レスポンス（`curl .../v1/kanji?grade=1`で確認済み）に合わせている

export type KyoikuKanjiReading = {
  ja: string[];
  romaji: string[];
};

export type KyoikuKanjiExample = {
  word: string; // 例:「一年生（いちねんせい）」
  meaning: string;
};

export type KyoikuKanjiEntry = {
  kanji: string;
  strokeCount: number;
  meaning: string;
  grade: number;
  kunyomi: KyoikuKanjiReading;
  onyomi: KyoikuKanjiReading;
  examples: KyoikuKanjiExample[];
};

type KyoikuKanjiResponse = {
  total: number;
  limit: number;
  offset: number;
  results: KyoikuKanjiEntry[];
};

const BASE_URL = "https://api.kyoiku-kanji.st-man.com/v1";

// limitを大きめに固定して1ページで取り切る（小1で80件程度。ページングを
// 実装するほどの件数ではないため、超過時はエラーにして気づけるようにする）
export const fetchKanjiByGrade = async (grade: number): Promise<KyoikuKanjiEntry[]> => {
  const url = `${BASE_URL}/kanji?grade=${grade}&limit=2000`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`kyoiku-kanji API ${res.status} ${res.statusText} (${url})`);
  }
  const data = (await res.json()) as KyoikuKanjiResponse;
  if (data.results.length < data.total) {
    throw new Error(
      `kyoiku-kanji API: got ${data.results.length}/${data.total} results — pagination not implemented`,
    );
  }
  return data.results;
};
