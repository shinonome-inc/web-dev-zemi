export default function HomePage() {
  return (
    <section className="hero">
      <h1 className="hero-title">はじめてのWEB開発ゼミ ポータル</h1>
      <p className="hero-lead">
        AI駆動開発で学ぶ10週間カリキュラムの学習ポータルです。
        週ごとのコンテンツを順番に進め、進捗を記録できます。
      </p>

      <div className="card-grid">
        <article className="card">
          <h2 className="card-title">カリキュラム</h2>
          <p className="card-text">
            1週目から順番に学習コンテンツを閲覧できます。（実装予定）
          </p>
        </article>
        <article className="card">
          <h2 className="card-title">進捗管理</h2>
          <p className="card-text">
            各項目の完了チェックで学習の進み具合を記録します。（実装予定）
          </p>
        </article>
        <article className="card">
          <h2 className="card-title">コミュニティ</h2>
          <p className="card-text">
            わからないことは Discord のスレッドで質問しましょう。（実装予定）
          </p>
        </article>
      </div>
    </section>
  );
}
