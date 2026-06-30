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

export type ChecklistItem = { id: string; text: string };
export type CurriculumParts = CurriculumMeta & {
  /** チェックリスト直前までの本文 */
  before: string;
  /** 進捗項目（GFMタスクリスト）。IDは `<slug>:c<連番>` */
  items: ChecklistItem[];
  /** チェックリスト以降の本文 */
  after: string;
};

const TASK_ITEM = /^- \[[ xX]\]\s+(.*)$/;

/**
 * 本文を「チェックリスト前 / チェックリスト項目 / チェックリスト後」に分割して返す。
 * 進捗はこの項目単位で保存する（各ファイルのタスクリストは1ブロックのみを想定）。
 */
export function getCurriculumParts(slug: string): CurriculumParts | null {
  const raw = readRaw(slug);
  if (raw === null) return null;
  const meta = getCurriculumList().find((item) => item.slug === slug);
  if (!meta) return null;

  const lines = raw.split("\n");
  const start = lines.findIndex((line) => TASK_ITEM.test(line));
  if (start === -1) {
    return { ...meta, before: raw, items: [], after: "" };
  }

  let end = start;
  while (end + 1 < lines.length && TASK_ITEM.test(lines[end + 1])) end++;

  const items = lines.slice(start, end + 1).map((line, index) => ({
    id: `${slug}:c${index}`,
    text: (line.match(TASK_ITEM)?.[1] ?? "").trim(),
  }));

  return {
    ...meta,
    before: lines.slice(0, start).join("\n"),
    items,
    after: lines.slice(end + 1).join("\n"),
  };
}
