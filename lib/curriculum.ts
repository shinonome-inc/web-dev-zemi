import fs from "node:fs";
import path from "node:path";

const CURRICULUM_DIR = path.join(process.cwd(), "curriculum");

/** 学習順（READMEのカリキュラム順に一致。準備編は1週目より前、中間課題は5週目と6週目の間） */
const ORDER: { slug: string; label: string }[] = [
  { slug: "00-prep", label: "準備編" },
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
  // slug はURLやServer Action経由の信頼できない入力になり得るため、
  // 許可リスト（ORDER）と照合してからファイルパスに使う（traversal防止）
  if (!ORDER.some((entry) => entry.slug === slug)) return null;
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

export type CurriculumWeekItems = CurriculumMeta & { items: ChecklistItem[] };

/** 全週の進捗項目（マニフェスト）を学習順に返す。集計・詳細表示に使う。 */
export function getCurriculumManifest(): CurriculumWeekItems[] {
  return getCurriculumList().flatMap((meta) => {
    const parts = getCurriculumParts(meta.slug);
    return parts ? [{ ...meta, items: parts.items }] : [];
  });
}

/** 全週合計の進捗項目数（進捗率の分母）。 */
export function getTotalItemCount(): number {
  return getCurriculumManifest().reduce((sum, w) => sum + w.items.length, 0);
}

/**
 * itemId が weekSlug 内に実在する進捗項目かを検証する。
 * item.id は `<slug>:c<連番>` 形式のため、weekSlug との整合もこれで担保される。
 * 存在しないIDの挿入による進捗率偽装・不要行の増殖を防ぐ。
 */
export function isValidProgressItem(itemId: string, weekSlug: string): boolean {
  const parts = getCurriculumParts(weekSlug);
  if (!parts) return false;
  return parts.items.some((item) => item.id === itemId);
}
