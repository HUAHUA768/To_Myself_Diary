import type { NoteDocument, NoteEntry } from "../types";
import { getDateParts, isValidDateKey } from "./date";
import { countWords, formatNumber } from "./text";

export const NOTE_TITLE = "写给自己";

/**
 * Windows 上保存的 .md 使用 CRLF 换行，浏览器里的文本框使用 LF。
 * 统一成 LF，避免同一篇日记在两种系统之间来回导入后混入 \r。
 */
function normalizeContent(value: string): string {
  return value.replace(/\r\n?/g, "\n");
}

export function createEmptyDocument(now = new Date()): NoteDocument {
  const timestamp = now.toISOString();
  return {
    version: 1,
    title: NOTE_TITLE,
    entries: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createEntry(
  date: string,
  content = "",
  now = new Date(),
): NoteEntry {
  const timestamp = now.toISOString();
  return {
    date,
    content,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function safeTimestamp(value: unknown, fallback: string): string {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? value
    : fallback;
}

export function normalizeDocument(value: unknown): NoteDocument {
  const source = asRecord(value);
  if (!source) {
    throw new Error("这不是一份有效的笔记备份。");
  }

  const rawEntries = Array.isArray(source.entries) ? source.entries : [];
  const now = new Date().toISOString();
  const entryMap = new Map<string, NoteEntry>();

  for (const rawEntry of rawEntries) {
    const entry = asRecord(rawEntry);
    if (!entry || typeof entry.date !== "string") continue;

    const date = entry.date.trim();
    if (!isValidDateKey(date)) continue;
    if (typeof entry.content !== "string" || !entry.content.trim()) continue;

    const content = normalizeContent(entry.content).trim();
    const createdAt = safeTimestamp(entry.createdAt, now);
    const updatedAt = safeTimestamp(entry.updatedAt, createdAt);
    const existing = entryMap.get(date);

    if (existing) {
      existing.content = `${existing.content.trimEnd()}\n\n${content}`;
      existing.createdAt =
        Date.parse(existing.createdAt) <= Date.parse(createdAt)
          ? existing.createdAt
          : createdAt;
      existing.updatedAt =
        Date.parse(existing.updatedAt) >= Date.parse(updatedAt)
          ? existing.updatedAt
          : updatedAt;
    } else {
      entryMap.set(date, {
        date,
        content,
        createdAt,
        updatedAt,
      });
    }
  }

  const entries = [...entryMap.values()].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const createdAt = safeTimestamp(source.createdAt, now);
  const updatedAt = safeTimestamp(source.updatedAt, now);

  return {
    version: 1,
    title:
      typeof source.title === "string" && source.title.trim()
        ? source.title.trim().slice(0, 80)
        : NOTE_TITLE,
    entries,
    createdAt,
    updatedAt,
  };
}

export function notebookToMarkdown(
  notebook: NoteDocument,
  exportedAt = new Date(),
): string {
  const entries = [...notebook.entries].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const totalWords = entries.reduce(
    (sum, entry) => sum + countWords(entry.content),
    0,
  );
  const intro = [
    "# 写给自己",
    "",
    "> 只有一篇的私人笔记，按日期续写。",
    `> 导出于 ${exportedAt.getFullYear()}年${exportedAt.getMonth() + 1}月${exportedAt.getDate()}日 · 共 ${entries.length} 天 · ${formatNumber(
      totalWords,
    )} 字`,
    "",
    "---",
  ].join("\n");

  const sections = entries.map((entry) => {
    const parts = getDateParts(entry.date);
    const dateLabel = `${parts.year}年${parts.month}月${parts.day}日 · ${parts.weekday}`;

    return [
      `<!-- to-myself:${entry.date} -->`,
      `## ${dateLabel}`,
      "",
      normalizeContent(entry.content).trim(),
    ].join("\n");
  });

  return `${intro}\n\n${sections.join("\n\n---\n\n")}\n`;
}

function parseMarkdownSections(markdown: string): Array<{
  date: string;
  content: string;
}> {
  const markerPattern = /<!--\s*to-myself:(\d{4}-\d{2}-\d{2})\s*-->/g;
  const markers = [...markdown.matchAll(markerPattern)];

  if (markers.length > 0) {
    return markers
      .map((marker, index) => {
        const start = (marker.index ?? 0) + marker[0].length;
        const end =
          index + 1 < markers.length
            ? (markers[index + 1].index ?? markdown.length)
            : markdown.length;
        let body = markdown.slice(start, end).trim();
        body = body.replace(/^##[^\n]*\n+/, "").trim();
        body = body.replace(/\n*---\s*$/, "").trim();

        return {
          date: marker[1],
          content: body,
        };
      })
      .filter(
        (section) =>
          isValidDateKey(section.date) && section.content.trim().length > 0,
      );
  }

  const headingPattern = /^##\s+(\d{4}-\d{2}-\d{2})\b[^\n]*$/gm;
  const headings = [...markdown.matchAll(headingPattern)];

  return headings
    .map((heading, index) => {
      const start = (heading.index ?? 0) + heading[0].length;
      const end =
        index + 1 < headings.length
          ? (headings[index + 1].index ?? markdown.length)
          : markdown.length;
      let content = markdown.slice(start, end).trim();
      content = content.replace(/\n*---\s*$/, "").trim();

      return {
        date: heading[1],
        content,
      };
    })
    .filter((section) => section.content.trim().length > 0);
}

export function parseMarkdownBackup(markdown: string): NoteDocument {
  const sections = parseMarkdownSections(
    normalizeContent(markdown.replace(/^\uFEFF/, "")),
  );

  if (sections.length === 0) {
    throw new Error(
      "没有找到可识别的日期分块。请导入由本应用导出的 Markdown 备份。",
    );
  }

  const now = new Date().toISOString();
  return normalizeDocument({
    version: 1,
    title: NOTE_TITLE,
    entries: sections.map((section) => ({
      date: section.date,
      content: section.content,
      createdAt: now,
      updatedAt: now,
    })),
    createdAt: now,
    updatedAt: now,
  });
}

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
