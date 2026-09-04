import type { Metadata } from "next";
import { openGraphDefaults } from "@/lib/site";

const title = "プライバシーポリシー";
const description =
  "キッズドリルゲームの個人情報の取り扱いについて説明します。氏名やメールアドレスなど、お子さまを特定できる情報は取得していません。";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    ...openGraphDefaults,
    url: "/privacy",
  },
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-[clamp(1rem,1.4vh+0.6rem,1.25rem)] font-bold text-brand">{title}</h2>
    <div className="flex flex-col gap-2 text-[clamp(0.8125rem,1.1vh+0.4rem,0.9375rem)] leading-relaxed text-foreground/80">
      {children}
    </div>
  </section>
);

// 保護者・検索経由の訪問者が読む文章のため、通常の漢字混じり文でよい
// （docs/design.md「文言（漢字の扱い）」の例外。src/components/top-page-content.tsxと同じ扱い）
const PrivacyPage = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-[clamp(1.25rem,3vh,2rem)] px-6 py-[clamp(1rem,3vh,2rem)]">
        <h1 className="text-[clamp(1.375rem,2.4vh+1rem,1.75rem)] font-bold text-foreground">
          プライバシーポリシー
        </h1>

        <p className="text-[clamp(0.8125rem,1.1vh+0.4rem,0.9375rem)] leading-relaxed text-foreground/80">
          キッズドリルゲーム（以下「本サービス」）は、お子さまが安心して利用できるよう、氏名・メールアドレス・住所などの個人情報を一切取得しません。本ページでは、本サービスが取り扱う情報の内容と方針について説明します。
        </p>

        <Section title="運営者について">
          <p>
            本サービスは個人（GitHub: st-man-hori）が開発・運営しています。運営組織としての住所・電話番号等は設けていません。
          </p>
        </Section>

        <Section title="登録時に取得する情報">
          <p>
            利用登録は氏名やメールアドレスの入力を必要とせず、システムが自動発行するID（数字6桁）とひみつのばんごう（PIN、数字6桁）のみで行います。ニックネームも本人の入力によらず自動生成されるもので、実名とは無関係です。PINは平文では保存せず、ハッシュ化して保存しています。
          </p>
          <p>
            保護者の同意手続きを挟まずに登録が完結する設計ですが、これは手間を省くためではなく、そもそも氏名・連絡先などの個人情報を取得しないためです。取得する情報がIDやニックネームなど本人を特定できないものに限られるからこそ、この設計にしています。
          </p>
        </Section>

        <Section title="利用中に記録する情報">
          <ul className="list-disc space-y-1 pl-5">
            <li>学年、練習の進み具合（正答数・レベル）</li>
            <li>タイムアタックのスコアと記録日時</li>
            <li>ポイント残高、着せ替えアイテムの所持・装備状況</li>
            <li>顔のパーツ（肌の色・目・口）の選択状態（プリセットから選ぶのみで、写真等のアップロードは行いません）</li>
          </ul>
          <p>
            これらはいずれも上記のIDに紐づく記録であり、現実のお子さまを特定できる情報ではありません。
          </p>
        </Section>

        <Section title="Cookieとアクセス解析">
          <p>
            ログイン状態を保つために、認証用のセッションCookieを利用しています。これは本サービスの利用に必要な機能のためだけに使用し、広告や行動追跡の目的では使用しません。
          </p>
          <p>
            アクセス解析にはVercel Web Analyticsを使用しています。Cookieを使わず訪問者を個人として識別・追跡しない方式のものを採用しており、ログインIDやニックネームなど本サービス側で識別できる情報を解析イベントとして送信することもありません。
          </p>
        </Section>

        <Section title="サーバーのアクセスログ">
          <p>
            本サービスはVercel上でホスティングしており、一般的なWebサービスと同様、ホスティング基盤側でIPアドレスやUser-Agentを含むアクセスログが一定期間保持される場合があります。これは不正アクセスの検知など運用上必要な範囲での保持であり、本サービス側で個人を特定する目的では利用しません。
          </p>
        </Section>

        <Section title="第三者への提供">
          <p>
            取得した情報を広告目的で第三者に提供・販売することはありません。本サービスはVercel（ホスティング）・Neon（データベース）などのインフラ事業者上で稼働していますが、これらはサービス運用のための委託先であり、目的外の利用は行いません。
          </p>
        </Section>

        <Section title="データの保存期間・削除について">
          <p>
            現時点では、利用者自身がアカウントを削除する機能や、削除依頼を受け付ける窓口は設けていません。
          </p>
        </Section>

        <Section title="オープンソースについて">
          <p>
            本サービスのソースコードはGitHubで公開しています。公開されているのはアプリケーションのコードのみで、利用者の登録情報や記録がリポジトリに含まれることはありません。
          </p>
        </Section>

        <Section title="本ポリシーの改定について">
          <p>
            本ポリシーの内容を変更する場合は、本ページ上で告知します。
          </p>
        </Section>

        <p className="text-[0.75rem] text-foreground/50">制定日: 2026年9月4日</p>
      </main>
    </div>
  );
};

export default PrivacyPage;
