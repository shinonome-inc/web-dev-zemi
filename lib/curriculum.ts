import fs from "node:fs";
import path from "node:path";

const CURRICULUM_DIR = path.join(process.cwd(), "curriculum");

/** 学習順（READMEのカリキュラム順に一致。中間課題は5週目と6週目の間） */
const ORDER: { slug: string; label: string }[] = [
  { slug: "01-ai-driven-dev-basics", label: "1週目" },
  { slug: "02-requirements-and-docs-driven", label: "2週目" },
  { slug: "03-using-external-knowledge", label: "3週目" },
  { slug: "04-web-basics-with-ai", label: "4週目" },
  { slug: "05-framework-intro-nextjs", label: "5週目" },
  { slug: "midterm-chatbot-assignment", label: "中間課題" },
  { slug: "06-database-integration", label: "6週目" },
  { slug: "07-personal-project", label: "7週目" },
  { slug: "08-team-development-basics", label: "8週目" },
  { slug: "09-deployment-and-cloud", label: "9週目" },
  { slug: "10-final-project", label: "10週目" },
];

export type CurriculumMeta = {
  slug: string;
  label: string;
  title: string;
  order: number;
};

export type CurriculumContent = CurriculumMeta & { content: string };

function readRaw(slug: string): string | null {
  const file = path.join(CURRICULUM_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}

/** 先頭の `# 見出し` をタイトルとして取り出す。無ければラベルで代替。 */
function extractTitle(raw: string, fallback: string): string {
  const match = raw.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : fallback;
}

/** 学習順に並んだ全カリキュラムのメタ情報を返す（ファイルが存在するもののみ）。 */
export function getCurriculumList(): CurriculumMeta[] {
  return ORDER.flatMap((entry, index) => {
    const raw = readRaw(entry.slug);
    if (raw === null) return [];
    return [
      {
        slug: entry.slug,
        label: entry.label,
        title: extractTitle(raw, entry.label),
        order: index,
      },
    ];
  });
}

/** 指定スラッグのカリキュラム本文とメタ情報を返す。無ければ null。 */
export function getCurriculumContent(slug: string): CurriculumContent | null {
  const raw = readRaw(slug);
  if (raw === null) return null;
  const meta = getCurriculumList().find((item) => item.slug === slug);
  if (!meta) return null;
  return { ...meta, content: raw };
}
