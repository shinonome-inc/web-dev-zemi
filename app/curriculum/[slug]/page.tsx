import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getCurriculumContent, getCurriculumList } from "@/lib/curriculum";

export function generateStaticParams() {
  return getCurriculumList().map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCurriculumContent(slug);
  return {
    title: item
      ? `${item.title} | はじめてのWEB開発ゼミ ポータル`
      : "カリキュラム",
  };
}

export default async function CurriculumDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getCurriculumContent(slug);
  if (!item) notFound();

  const list = getCurriculumList();
  const prev = list[item.order - 1];
  const next = list[item.order + 1];

  return (
    <article className="space-y-8">
      <div className="text-sm">
        <Link href="/curriculum" className="link link-hover text-base-content/60">
          ← カリキュラム一覧
        </Link>
      </div>

      <div
        className="prose max-w-none prose-headings:scroll-mt-20 prose-a:text-primary"
        data-curriculum-slug={item.slug}
      >
        <Markdown remarkPlugins={[remarkGfm]}>{item.content}</Markdown>
      </div>

      <nav className="flex justify-between gap-4 border-t border-base-300 pt-6">
        {prev ? (
          <Link href={`/curriculum/${prev.slug}`} className="btn btn-ghost btn-sm">
            ← {prev.label}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/curriculum/${next.slug}`} className="btn btn-ghost btn-sm">
            {next.label} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
