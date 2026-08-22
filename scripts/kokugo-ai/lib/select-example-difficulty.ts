import { chatCompletion } from "./sakura-ai-client";
import type { SelectedReading } from "./select-reading";

// 用例の「かんじ部分」だけの文字数（ふりがな・括弧を除く）。実測（学年1〜6・
// 1004字）では、候補が2件以上ある962字のうち847字が「最短候補どうしのタイ」
// で、その最短候補はほぼ必ず二字熟語だった。つまり大半のケースは「短い方を
// 選べば十分」で、AIに難易度を聞くまでもない
const baseWordOf = (word: string): string => word.split(/[（(]/)[0].trim();

// 二字熟語（3字以内）が候補にあれば、それだけで「一朝一夕」のような四字熟語より
// 十分やさしい。候補の中の最短どうしの難易度差は無視できる小ささとみなし、
// 用例配列に現れた順（＝APIの並び順）で先に見つかった方を機械的に採用する
const SIMPLE_ENOUGH_LENGTH = 3;

// AIに判定させるのは「どの候補も4字以上（＝短い代替がそもそも無い）」字だけ。
// 実測では962字中22字のみがこれに該当し、AI呼び出しをここまで絞れる
// （誤答生成: 1字あたり最大9リクエスト、build-distractors.ts と合わせても
// さくらのAI Engineの予算を大きくは圧迫しない）
const buildPrompt = (kanji: string, grade: number, candidates: SelectedReading[]): string => `あなたは小学${grade}年生向けの漢字よみクイズを作る教材編集者です。
次の漢字の出題に使う例文（熟語）の候補から、小学${grade}年生が読んでイメージしやすい、
いちばんやさしいものを1つ選んでください。

かんじ: "${kanji}"
候補:
${candidates.map((candidate, index) => `${index}. ${candidate.example.word}`).join("\n")}

条件:
- 四字熟語やことわざ、抽象的・比喩的な意味の熟語（例:「一朝一夕」）は避ける
- 日常生活でよく使う、具体的にイメージできる熟語を優先する
- どの候補も対象の字を含む用例として成立しているので、それ以外の観点（やさしさ）だけで選ぶ

出力は選んだ候補の番号のみを算用数字1文字で答えてください。説明文や記号は書かないでください。`;

const parseChoice = (content: string, max: number): number | null => {
  const match = content.trim().match(/\d+/);
  if (!match) return null;
  const index = Number(match[0]);
  return Number.isInteger(index) && index >= 0 && index < max ? index : null;
};

// いちばん短い（＝概ね二字熟語に近い）候補のインデックスを返す。タイのときは
// 用例配列に現れた順で先に見つかった方を採用する。AI呼び出しが失敗・パース
// 失敗したときの決め打ちにも流用する（build-distractors.tsのFALLBACK_POOLと
// 同じ思想: パイプラインは1件の失敗で止めず必ず完走させる）
const shortestIndex = (candidates: SelectedReading[]): number => {
  let bestIndex = 0;
  let bestLength = baseWordOf(candidates[0].example.word).length;
  for (let i = 1; i < candidates.length; i++) {
    const length = baseWordOf(candidates[i].example.word).length;
    if (length < bestLength) {
      bestIndex = i;
      bestLength = length;
    }
  }
  return bestIndex;
};

export const pickEasiestExample = async (
  kanji: string,
  grade: number,
  candidates: SelectedReading[],
): Promise<SelectedReading> => {
  if (candidates.length === 1) return candidates[0];

  const shortest = shortestIndex(candidates);
  const shortestLength = baseWordOf(candidates[shortest].example.word).length;
  // 短い（＝やさしい）候補が既にあるなら、それで十分。AIを呼ぶのは
  // 「どの候補も長い（＝短い代替が無い）」ときだけに絞る
  if (shortestLength <= SIMPLE_ENOUGH_LENGTH) return candidates[shortest];

  try {
    const content = await chatCompletion([
      { role: "user", content: buildPrompt(kanji, grade, candidates) },
    ]);
    const index = parseChoice(content, candidates.length);
    if (index !== null) return candidates[index];
  } catch {
    // フォールバックへ
  }
  return candidates[shortest];
};
