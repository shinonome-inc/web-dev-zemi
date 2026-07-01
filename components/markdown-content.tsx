import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";

// 本文中のリンクは外部サイト（Notion/スライド等）を想定し、常に新しいタブで開く。
// `node` はreact-markdownが渡すAST情報でDOM属性ではないため除外する。
const components: Components = {
  a: ({ node, href, children, ...props }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
};

export function MarkdownContent({ children }: { children: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </Markdown>
  );
}
