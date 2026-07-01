import Link from "next/link";
import { requireUser } from "@/lib/auth-guard";
import { getCurriculumList } from "@/lib/curriculum";

export const metadata = {
  title: "カリキュラム | はじめてのWEB開発ゼミ ポータル",
};

export default async function CurriculumIndexPage() {
  await requireUser();
  const items = getCurriculumList();

  return (
    <section className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">カリキュラム</h1>
        <p className="text-base-content/70">
          1週目から順番に進めましょう。各ページの最後にチェックリストがあります。
        </p>
      </div>

      <ul className="grid gap-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/curriculum/${item.slug}`}
              className="card flex-row items-center gap-4 border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary"
            >
              <span className="badge badge-primary badge-outline shrink-0">
                {item.label}
              </span>
              <span className="font-medium">{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
