import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

// ルート直下に置くことで、個別に持たないページ全部のデフォルトOG画像になる
// （Next.jsのファイル規約。より深い階層に同名ファイルを置けば上書きできる）

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAGLINE = "楽しく学べる 小学生の学習ドリル";

// M PLUS Rounded 1c（docs/design.md指定のフォント）をsatori用にArrayBufferで
// 取得する。next/fontはこの用途には使えない（satoriは生のフォントデータを要求する）ため、
// Google Fonts CSSを取得してsrc URLを抜き出す方式を取る。
// UAを古いブラウザに偽装しているのはwoff2ではなくttfを返させるため
// （satoriがwoff2に対応していないバージョンがあるための定番の回避策）
const loadBrandFont = async (text: string) => {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    "M PLUS Rounded 1c"
  )}:wght@800&text=${encodeURIComponent(text)}`;
  const css = await fetch(cssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
    },
  }).then((res) => res.text());

  const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!fontUrl) {
    throw new Error("opengraph-image: フォントURLの取得に失敗しました");
  }

  const fontResponse = await fetch(fontUrl);
  return fontResponse.arrayBuffer();
};

const OpengraphImage = async () => {
  const fontData = await loadBrandFont(`${SITE_NAME}${TAGLINE}`);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          // docs/design.mdのベースカラー（明るいクリーム）
          background: "#fff9f0",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 800,
            // docs/design.mdのメインブランドカラー
            color: "#ff8a5b",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 42,
            fontWeight: 800,
            color: "#3d3229",
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "M PLUS Rounded 1c",
          data: fontData,
          weight: 800,
          style: "normal",
        },
      ],
    }
  );
};

export default OpengraphImage;
