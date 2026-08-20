/**
 * kanji_questions の正解データ（kanji, correct_reading）とレベル分けの元になる
 * 小1漢字マスタを、自作API kyoiku-kanji-api から取得する。
 *
 * 方針（docs/architecture.md「国語（漢字のよみ）」参照）:
 *   - correct_reading は「訓読みがあれば訓読みの1つ目、無ければ音読みの1つ目
 *     （カタカナ→ひらがな変換）」という機械的な既定値。教科書がどちらを先に
 *     教えるかまでは配当表からは分からないため、違和感があれば移行先の
 *     マイグレーションを人間が個別に上書きする前提
 *   - レベル分けは画数（strokeCount）昇順で5字ずつ機械的に区切る
 *
 * このスクリプトはアプリ本体からは呼ばれない（マイグレーション作成時に一度だけ
 * 実行してJSONにスナップショットする用途。デプロイ時の外部API依存を増やさない）。
 */

const DEFAULT_API_BASE_URL = "https://api.kyoiku-kanji.st-man.com";
const KANJI_PER_LEVEL = 5;

export type KanjiMasterEntry = {
  kanji: string;
  grade: number;
  strokeCount: number;
  levelNumber: number;
  correctReading: string;
  /** correct_readingを含む、正しい読み方全部（誤答検証の突き合わせ用） */
  correctReadings: string[];
};

type KyoikuKanjiApiReading = { ja: string[]; romaji: string[] };
type KyoikuKanjiApiEntry = {
  kanji: string;
  strokeCount: number;
  grade: number;
  kunyomi: KyoikuKanjiApiReading;
  onyomi: KyoikuKanjiApiReading;
};
type KyoikuKanjiApiListResponse = { results: KyoikuKanjiApiEntry[] };

/** カタカナ→ひらがな変換（音読みはAPIがカタカナで返すため） */
const toHiragana = (katakana: string): string =>
  katakana.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

export const fetchGradeOneKanjiMaster = async (
  baseUrl: string = process.env.KYOIKU_KANJI_API_BASE_URL || DEFAULT_API_BASE_URL,
): Promise<KanjiMasterEntry[]> => {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/kanji?grade=1&limit=100`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`kyoiku-kanji-api呼び出し失敗: ${url} → HTTP ${res.status}`);
  }
  const data = (await res.json()) as KyoikuKanjiApiListResponse;

  const withReadings = data.results.map((entry) => {
    const onyomiHiragana = entry.onyomi.ja.map(toHiragana);
    const correctReadings = Array.from(new Set([...entry.kunyomi.ja, ...onyomiHiragana]));
    if (correctReadings.length === 0) {
      throw new Error(`「${entry.kanji}」に訓読み・音読みが1つもありません（APIデータ不備）`);
    }
    const correctReading = entry.kunyomi.ja[0] ?? onyomiHiragana[0];
    return {
      kanji: entry.kanji,
      grade: entry.grade,
      strokeCount: entry.strokeCount,
      correctReading,
      correctReadings,
    };
  });

  // 画数昇順。同数はkanjiの辞書順にして結果を決定的にする（再実行しても同じレベル分けになる）
  const sorted = [...withReadings].sort(
    (a, b) => a.strokeCount - b.strokeCount || a.kanji.localeCompare(b.kanji, "ja"),
  );

  return sorted.map((entry, index) => ({
    ...entry,
    levelNumber: Math.floor(index / KANJI_PER_LEVEL) + 1,
  }));
};

// 直接実行時は取得結果とレベル分けを確認できるよう出力する（AIを呼ばないのでkokugo:generate-distractors
// より軽く、レベル分けだけ先に確認したいときに使う）
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchGradeOneKanjiMaster()
    .then((master) => {
      console.log(`取得: ${master.length}字 / レベル数: ${master[master.length - 1]?.levelNumber ?? 0}`);
      for (const entry of master) {
        console.log(
          `Lv${entry.levelNumber} [${entry.strokeCount}画] ${entry.kanji} → ${entry.correctReading} (${entry.correctReadings.join("、")})`,
        );
      }
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
