import type {
  AppearanceSettings,
  BackgroundImage,
  JsonBackup,
  NoteDocument,
  ParsedImport,
} from "../types";
import { sanitizeAppearance } from "./appearance";
import {
  createEmptyDocument,
  normalizeDocument,
  parseMarkdownBackup,
} from "./document";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function buildBackupJson(
  notebook: NoteDocument,
  appearance: AppearanceSettings,
  backgroundImage: BackgroundImage | null,
): string {
  const payload: JsonBackup = {
    format: "to-myself-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    notebook,
    appearance,
    backgroundImage,
  };

  return JSON.stringify(payload, null, 2);
}

function parseBackgroundImage(
  value: unknown,
): BackgroundImage | null {
  const source = asRecord(value);
  if (!source) return null;

  if (
    typeof source.dataUrl !== "string" ||
    !source.dataUrl.startsWith("data:image/") ||
    source.dataUrl.length > 24_000_000
  ) {
    return null;
  }

  return {
    dataUrl: source.dataUrl,
    name:
      typeof source.name === "string" && source.name.trim()
        ? source.name.trim().slice(0, 140)
        : "自定义背景",
  };
}

export function parseBackupFile(
  filename: string,
  text: string,
): ParsedImport {
  const cleanText = text.replace(/^\uFEFF/, "");
  const isJson =
    /\.json$/i.test(filename) ||
    cleanText.trimStart().startsWith("{") ||
    cleanText.trimStart().startsWith("[");

  if (!isJson) {
    return {
      kind: "markdown",
      notebook: parseMarkdownBackup(cleanText),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanText);
  } catch {
    throw new Error("JSON 文件无法解析，可能已经损坏。");
  }

  const root = asRecord(parsed);
  if (!root) {
    throw new Error("不是有效的笔记备份文件。");
  }

  const notebookSource = root.notebook ?? root;
  const notebook = normalizeDocument(notebookSource);

  if (notebook.entries.length === 0) {
    throw new Error("这份备份中没有可导入的笔记内容。");
  }

  let appearance: AppearanceSettings | undefined;
  if (root.appearance && typeof root.appearance === "object") {
    appearance = sanitizeAppearance(root.appearance);
  }

  let backgroundImage: BackgroundImage | null | undefined;
  if (Object.prototype.hasOwnProperty.call(root, "backgroundImage")) {
    backgroundImage = parseBackgroundImage(root.backgroundImage);
  }

  return {
    kind: "json",
    notebook: notebook.entries.length
      ? notebook
      : createEmptyDocument(),
    appearance,
    backgroundImage,
  };
}
