const features = [
  {
    title: "カリキュラム",
    text: "1週目から順番に学習コンテンツを閲覧できます。",
  },
  {
    title: "進捗管理",
    text: "各項目の完了チェックで学習の進み具合を記録します。",
  },
  {
    title: "コミュニティ",
    text: "わからないことは Discord のスレッドで質問しましょう。",
  },
] as const;

export default function HomePage() {
  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          はじめてのWEB開発ゼミ ポータル
        </h1>
        <p className="max-w-2xl text-base-content/70">
          AI駆動開発で学ぶ10週間カリキュラムの学習ポータルです。
          週ごとのコンテンツを順番に進め、進捗を記録できます。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <article key={f.title} className="card border border-base-300 bg-base-100">
            <div className="card-body gap-2">
              <h2 className="card-title text-base">{f.title}</h2>
              <p className="text-sm text-base-content/70">{f.text}</p>
              <span className="badge badge-ghost badge-sm mt-1">実装予定</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
