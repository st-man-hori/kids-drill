import { randomInt } from "node:crypto";

const LOGIN_ID_LENGTH = 6;
const PIN_LENGTH = 6;

// docs/game-design.md の表示用ニックネーム生成方式（形容詞＋名詞＋数字3桁）。
// い形容詞はそのまま、な形容詞は「な」まで含めて名詞に直結できる形で保持する。
const ADJECTIVES = [
  "やさしい",
  "つよい",
  "はやい",
  "かわいい",
  "かしこい",
  "あかるい",
  "たのしい",
  "すばやい",
  "たくましい",
  "まぶしい",
  "すごい",
  "かっこいい",
  "おおきい",
  "ちいさい",
  "あたたかい",
  "すずしい",
  "まるい",
  "ながい",
  "みじかい",
  "するどい",
  "げんきな",
  "ゆかいな",
  "おおきな",
  "ちいさな",
  "ゆうかんな",
  "にぎやかな",
  "おだやかな",
  "しずかな",
  "すなおな",
  "まっすぐな",
  "じょうぶな",
  "きれいな",
  "りっぱな",
  "しんせつな",
  "ほがらかな",
  "じゆうな",
  "とくべつな",
  "ゆたかな",
  "なめらかな",
  "あんぜんな",
] as const;

const ANIMALS = [
  "トラ",
  "ライオン",
  "ゾウ",
  "キリン",
  "パンダ",
  "コアラ",
  "ウサギ",
  "リス",
  "クマ",
  "シカ",
  "キツネ",
  "タヌキ",
  "ネコ",
  "イヌ",
  "ウマ",
  "ヒツジ",
  "ヤギ",
  "ブタ",
  "ペンギン",
  "フクロウ",
  "ワシ",
  "タカ",
  "ツバメ",
  "イルカ",
  "クジラ",
  "サメ",
  "カメ",
  "カエル",
  "トカゲ",
  "ヘビ",
  "チョウ",
  "テントウムシ",
  "カブトムシ",
  "クワガタ",
  "ハチ",
  "アリ",
  "カニ",
  "タコ",
  "イカ",
  "サル",
] as const;

const generateNumericCode = (length: number): string =>
  randomInt(0, 10 ** length).toString().padStart(length, "0");

export const generateLoginId = (): string => generateNumericCode(LOGIN_ID_LENGTH);

export const generatePin = (): string => generateNumericCode(PIN_LENGTH);

export const generateNickname = (): string => {
  const adjective = ADJECTIVES[randomInt(0, ADJECTIVES.length)];
  const animal = ANIMALS[randomInt(0, ANIMALS.length)];
  const number = randomInt(100, 1000);
  return `${adjective}${animal}${number}`;
};
