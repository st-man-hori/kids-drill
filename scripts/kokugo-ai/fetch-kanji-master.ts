/**
 * kanji_questions の正解データ（kanji, correct_reading, example_word, reading_template）と
 * レベル分けの元になる小1漢字マスタを、自作API kyoiku-kanji-api から取得する。
 *
 * 方針（docs/architecture.md「国語（漢字のよみ）」参照）:
 *   - 単独の辞書的な読みではなく、実際の熟語（kyoiku-kanji-apiのexamples）の中での
 *     読みを出題する。「一」なら「いち」単体ではなく「一番（いちばん）」の○○ばんの
 *     ○○を埋めさせる、という形
 *   - 対象漢字がその熟語の1文字目なら「読み全体が漢字自身の既知の読みで始まるか」、
 *     2文字目なら「終わるか」を機械的に判定し、一致した部分をcorrect_reading、残りを
 *     ○○の外側に出す固定表示（reading_template）にする。連濁・促音便（例:
 *     一杯＝いち+はい→いっぱい）で音が変わる熟語は一致しないため自動的に除外される
 *   - 候補が複数ある場合、**もう片方の漢字の学年が低いものを優先**する。examplesの並び順を
 *     そのまま採用すると「出納（すいとう）」「玉座（ぎょくざ）」のような、小学1年生には
 *     早い熟語が選ばれることがあったため（もう片方の漢字が納＝小6・座＝小6など高学年配当）。
 *     学年が同じ候補同士はexamples内の元の並び順を尊重する
 *   - レベル分けは画数（strokeCount）昇順で5字ずつ機械的に区切る
 *
 * このスクリプトはアプリ本体からは呼ばれない（マイグレーション作成時に一度だけ
 * 実行してJSONにスナップショットする用途。デプロイ時の外部API依存を増やさない）。
 */

const DEFAULT_API_BASE_URL = "https://api.kyoiku-kanji.st-man.com";
const KANJI_PER_LEVEL = 5;
const BLANK = "○○";

export type KanjiMasterEntry = {
  kanji: string;
  grade: number;
  strokeCount: number;
  levelNumber: number;
  /** 採用した熟語の中でのこの漢字の読み（例: "一"に対して"いち"） */
  correctReading: string;
  /** correct_readingを含む、この漢字の正しい読み方全部（誤答検証の突き合わせ用） */
  correctReadings: string[];
  /** correct_readingの穴埋め元になった熟語（例: "一番"） */
  exampleWord: string;
  /** exampleWordの読みを○○で穴埋めした表示用文字列（例: "○○ばん"） */
  readingTemplate: string;
};

type KyoikuKanjiApiReading = { ja: string[]; romaji: string[] };
type KyoikuKanjiApiExample = { word: string; meaning: string };
type KyoikuKanjiApiEntry = {
  kanji: string;
  strokeCount: number;
  grade: number;
  kunyomi: KyoikuKanjiApiReading;
  onyomi: KyoikuKanjiApiReading;
  examples: KyoikuKanjiApiExample[];
};
type KyoikuKanjiApiListResponse = { results: KyoikuKanjiApiEntry[] };

type DecomposedExample = {
  exampleWord: string;
  correctReading: string;
  readingTemplate: string;
};

/** カタカナ→ひらがな変換（音読みはAPIがカタカナで返すため） */
const toHiragana = (katakana: string): string =>
  katakana.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

const HIRAGANA_ONLY = /^[ぁ-んー]+$/;

/**
 * 学年ヒューリスティックだけでは「日常語らしさ」を判定しきれず、専門語・古語・
 * 大人向けの熟語が選ばれてしまったケースの人手による上書き（examplesを全件目視して
 * 選定）。例:
 *   - 「子音」は相方の学年こそ低い（子＝小1）が言語学用語で小学1年生には馴染みが薄い
 *     → 「音楽」（相方の楽は小2だが、はるかに日常語）
 *   - 「水虫」（athlete's foot）「貝柱」（貝の筋肉）のような、学年は低くても
 *     子ども向けの話題として適さない/馴染みが薄い語
 * 値はexamplesに実在する熟語の表記。読みの分解自体はfindDecomposableExampleが
 * 機械的に行う（手で読みを書き起こさない）。
 */
const MANUAL_EXAMPLE_OVERRIDES: Readonly<Record<string, string>> = {
  貝: "貝殻", // 貝柱（かいばしら）は専門的すぎるため
  音: "音楽", // 子音（しいん）は言語学用語のため
  女: "女性", // 女人（にょにん）は古語のため
  手: "手紙", // 手話も良いが、より基礎的な語を優先
  中: "中国", // 中年（ちゅうねん）は大人の年齢区分のため
  虫: "昆虫", // 水虫（athlete's foot）は子ども向けの話題として不適
  年: "来年", // 中年（ちゅうねん）は大人の年齢区分のため
  名: "名前", // 一名（いちめい）は事務的な数え方のため
  町: "下町", // 町長・町名は行政用語のため
  糸: "毛糸", // 糸口（いとぐち）は慣用句で抽象的なため
};

/**
 * "一番（いちばん）" のような表記から熟語本体と読みを分離する。
 * "十七（じゅうしち/じゅうなな）" のように読みが複数併記されているものは、どちらが
 * 対象漢字の読みに対応するか機械的に決め打ちできないため対象外にする（null）。
 */
const parseExampleWord = (word: string): { surface: string; reading: string } | null => {
  const match = word.match(/^(.+?)（(.+?)）$/);
  if (!match) return null;
  if (match[2].includes("/") || match[2].includes("／")) return null;
  return { surface: match[1], reading: match[2] };
};

/**
 * 熟語examplesの中から、対象漢字の読みを機械的に切り出せる候補をすべて集め、
 * 最も日常語らしいものを1つ選ぶ。優先順位は以下（`priority`が小さいほど優先）。
 *
 * 1. 「出る（でる）」のような漢字1字＋送り仮名の形（priority -1）。新出漢字の導入時に
 *    そのまま教わる基本形であり、対象漢字の学年内で完結するため最も日常語らしいと判断できる
 * 2. 2字熟語（priority = もう片方の漢字の学年）。学年が低いほど日常語である可能性が高い、
 *    という代理指標。「出納（すいとう、納＝小6）」より「出発（しゅっぱつ、発＝小3）」を
 *    優先するのはこのため。ただし学年は語の平易さそのものではないため万能ではない
 *    （例: 「子音」は学年だけ見ると低いが小学1年生には馴染みの薄い専門語）。完璧な
 *    自動選定は難しく、違和感があれば人間が個別に上書きする前提
 *
 * 見つからなければnull（連濁などで読みが変化する熟語しか無い場合に起こりうる）。
 */
const findDecomposableExample = (
  kanji: string,
  ownReadings: readonly string[],
  examples: readonly KyoikuKanjiApiExample[],
  gradeByKanji: ReadonlyMap<string, number>,
  // 指定時は、この表記の熟語（MANUAL_EXAMPLE_OVERRIDES由来）だけを候補にする。
  // 読みの分解自体は機械的に行うので、手で読みを書き起こす必要はない
  preferredSurface?: string,
): DecomposedExample | null => {
  // 長い読みを先に試す（短い読みが別の読みの前方一致になるケースの誤判定を避ける）
  const readingsByLengthDesc = [...ownReadings].sort((a, b) => b.length - a.length);

  const candidates: (DecomposedExample & { priority: number; exampleIndex: number })[] = [];

  const pool = preferredSurface
    ? examples.filter((example) => parseExampleWord(example.word)?.surface === preferredSurface)
    : examples;

  pool.forEach((example, exampleIndex) => {
    const parsed = parseExampleWord(example.word);
    if (!parsed) return;
    const chars = [...parsed.surface];

    // 漢字1字＋送り仮名（例: "出る"）。対象漢字が先頭で、残りがすべてひらがな
    const isOkuriganaForm =
      chars.length >= 2 && chars[0] === kanji && chars.slice(1).every((c) => HIRAGANA_ONLY.test(c));
    // 2字熟語（例: "一番"）。対象漢字ともう1字の漢字のみで構成される
    const compoundPosition = chars.length === 2 ? chars.indexOf(kanji) : -1;

    if (!isOkuriganaForm && compoundPosition === -1) return;

    for (const reading of readingsByLengthDesc) {
      if (!parsed.reading.startsWith(reading)) continue;
      if (isOkuriganaForm) {
        candidates.push({
          exampleWord: parsed.surface,
          correctReading: reading,
          readingTemplate: `${BLANK}${parsed.reading.slice(reading.length)}`,
          priority: -1,
          exampleIndex,
        });
        break;
      }
      if (compoundPosition === 0) {
        const otherGrade = gradeByKanji.get(chars[1]) ?? Number.POSITIVE_INFINITY;
        candidates.push({
          exampleWord: parsed.surface,
          correctReading: reading,
          readingTemplate: `${BLANK}${parsed.reading.slice(reading.length)}`,
          priority: otherGrade,
          exampleIndex,
        });
        break;
      }
    }
    if (!isOkuriganaForm && compoundPosition === 1) {
      for (const reading of readingsByLengthDesc) {
        if (!parsed.reading.endsWith(reading)) continue;
        const otherGrade = gradeByKanji.get(chars[0]) ?? Number.POSITIVE_INFINITY;
        candidates.push({
          exampleWord: parsed.surface,
          correctReading: reading,
          readingTemplate: `${parsed.reading.slice(0, parsed.reading.length - reading.length)}${BLANK}`,
          priority: otherGrade,
          exampleIndex,
        });
        break;
      }
    }
  });

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => a.priority - b.priority || a.exampleIndex - b.exampleIndex);
  return candidates[0];
};

export const fetchGradeOneKanjiMaster = async (
  baseUrl: string = process.env.KYOIKU_KANJI_API_BASE_URL || DEFAULT_API_BASE_URL,
): Promise<KanjiMasterEntry[]> => {
  // 熟語のもう片方の漢字の学年を引くため、教育漢字1026字全体を1回で取得する
  // （grade指定なし＝デフォルトで全件。kyoiku-kanji-apiは全1026字固定のリファレンス
  // データなのでページングは不要）
  const url = `${baseUrl.replace(/\/$/, "")}/v1/kanji`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`kyoiku-kanji-api呼び出し失敗: ${url} → HTTP ${res.status}`);
  }
  const data = (await res.json()) as KyoikuKanjiApiListResponse;

  const gradeByKanji = new Map(data.results.map((entry) => [entry.kanji, entry.grade]));
  const gradeOne = data.results.filter((entry) => entry.grade === 1);

  const withReadings = gradeOne.map((entry) => {
    const onyomiHiragana = entry.onyomi.ja.map(toHiragana);
    const correctReadings = Array.from(new Set([...entry.kunyomi.ja, ...onyomiHiragana]));
    if (correctReadings.length === 0) {
      throw new Error(`「${entry.kanji}」に訓読み・音読みが1つもありません（APIデータ不備）`);
    }

    const decomposed = findDecomposableExample(
      entry.kanji,
      correctReadings,
      entry.examples,
      gradeByKanji,
      MANUAL_EXAMPLE_OVERRIDES[entry.kanji],
    );
    if (!decomposed) {
      throw new Error(
        `「${entry.kanji}」の熟語から読みを機械的に切り出せる例が見つかりませんでした。` +
          `examplesを確認し、必要ならこのスクリプトの判定条件を見直してください。`,
      );
    }

    return {
      kanji: entry.kanji,
      grade: entry.grade,
      strokeCount: entry.strokeCount,
      correctReading: decomposed.correctReading,
      correctReadings,
      exampleWord: decomposed.exampleWord,
      readingTemplate: decomposed.readingTemplate,
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
          `Lv${entry.levelNumber} [${entry.strokeCount}画] ${entry.kanji} → ${entry.exampleWord} ${entry.readingTemplate} (${entry.correctReading})`,
        );
      }
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    });
}
