const CJK_PATTERN = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, (block) =>
      block.replace(/^```[^\n]*\n?/, "").replace(/```$/, ""),
    )
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+\[[ xX]\]\s+/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_~|]/g, " ");
}

export function countWords(markdown: string): number {
  if (!markdown.trim()) return 0;

  const plain = stripMarkdown(markdown);
  const cjkCount = plain.match(CJK_PATTERN)?.length ?? 0;
  const withoutCjk = plain.replace(CJK_PATTERN, " ");
  const latinWordCount =
    withoutCjk.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g)?.length ?? 0;

  return cjkCount + latinWordCount;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export function toPlainText(markdown: string): string {
  return stripMarkdown(markdown)
    .replace(/\s+/g, " ")
    .trim();
}

export function getSearchSnippet(
  content: string,
  query: string,
  radius = 48,
): string {
  const plain = toPlainText(content);
  if (!query) return plain.slice(0, radius * 2);

  const index = plain.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (index < 0) return plain.slice(0, radius * 2);

  const start = Math.max(0, index - radius);
  const end = Math.min(plain.length, index + query.length + radius);

  return `${start > 0 ? "…" : ""}${plain.slice(start, end)}${
    end < plain.length ? "…" : ""
  }`;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
