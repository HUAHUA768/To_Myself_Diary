import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
} from "react";
import {
  Bold,
  Check,
  Code2,
  Heading2,
  Italic,
  Link2,
  List,
  ListChecks,
  Quote,
} from "lucide-react";

interface EntryEditorProps {
  date: string;
  content: string;
  onChange: (content: string) => void;
  onFinish: () => void;
}

type FormatAction =
  | "bold"
  | "italic"
  | "heading"
  | "quote"
  | "bullet"
  | "task"
  | "code"
  | "link";

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

function linePrefixAction(
  value: string,
  start: number,
  end: number,
  prefix: string,
  matcher: RegExp,
): { nextValue: string; selectionStart: number; selectionEnd: number } {
  const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
  const endProbe = end > start ? end : start;
  const nextNewline = value.indexOf("\n", endProbe);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const originalBlock = value.slice(lineStart, lineEnd);
  const lines = originalBlock.split("\n");
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  const allPrefixed =
    nonEmptyLines.length > 0 &&
    nonEmptyLines.every((line) => matcher.test(line));

  let nextLines: string[];
  if (allPrefixed) {
    nextLines = lines.map((line) =>
      matcher.test(line) ? line.replace(matcher, "") : line,
    );
  } else if (nonEmptyLines.length === 0) {
    nextLines = [prefix];
  } else {
    nextLines = lines.map((line) =>
      line.trim().length > 0 ? `${prefix}${line}` : line,
    );
  }

  const nextBlock = nextLines.join("\n");
  const nextValue =
    value.slice(0, lineStart) + nextBlock + value.slice(lineEnd);
  const nextStart =
    start === end ? lineStart + nextBlock.length : lineStart;
  const nextEnd =
    start === end ? lineStart + nextBlock.length : lineStart + nextBlock.length;

  return {
    nextValue,
    selectionStart: nextStart,
    selectionEnd: nextEnd,
  };
}

function wrapAction(
  value: string,
  start: number,
  end: number,
  left: string,
  right: string,
  placeholder: string,
): { nextValue: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);
  const inner = selected || placeholder;
  const hasWrapper =
    value.slice(Math.max(0, start - left.length), start) === left &&
    value.slice(end, end + right.length) === right;

  if (hasWrapper) {
    const nextValue =
      value.slice(0, start - left.length) +
      selected +
      value.slice(end + right.length);
    return {
      nextValue,
      selectionStart: start - left.length,
      selectionEnd: start - left.length + selected.length,
    };
  }

  const nextValue = `${value.slice(0, start)}${left}${inner}${right}${value.slice(end)}`;
  return {
    nextValue,
    selectionStart: start + left.length,
    selectionEnd: start + left.length + inner.length,
  };
}

export function EntryEditor({
  date,
  content,
  onChange,
  onFinish,
}: EntryEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.focus();
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, []);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 220)}px`;
  }, [content]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      if (rootRef.current?.contains(event.target as Node)) return;
      onFinish();
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("pointerdown", handlePointerDown, true);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [onFinish]);

  const applyResult = (result: {
    nextValue: string;
    selectionStart: number;
    selectionEnd: number;
  }) => {
    onChange(result.nextValue);
    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const applyFormat = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const value = textarea.value;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    switch (action) {
      case "bold":
        applyResult(wrapAction(value, start, end, "**", "**", "加粗文字"));
        break;
      case "italic":
        applyResult(wrapAction(value, start, end, "*", "*", "斜体文字"));
        break;
      case "code":
        applyResult(wrapAction(value, start, end, "`", "`", "代码"));
        break;
      case "heading":
        applyResult(
          linePrefixAction(value, start, end, "## ", /^#{1,6}\s+/),
        );
        break;
      case "quote":
        applyResult(linePrefixAction(value, start, end, "> ", /^>\s?/));
        break;
      case "bullet":
        applyResult(linePrefixAction(value, start, end, "- ", /^[-*+]\s+/));
        break;
      case "task":
        applyResult(
          linePrefixAction(
            value,
            start,
            end,
            "- [ ] ",
            /^[-*+]\s+\[[ xX]\]\s+/,
          ),
        );
        break;
      case "link": {
        const selected = value.slice(start, end);
        if (selected) {
          const url = "https://";
          const nextValue = `${value.slice(0, start)}[${selected}](${url})${value.slice(end)}`;
          const urlStart = start + selected.length + 3;
          applyResult({
            nextValue,
            selectionStart: urlStart,
            selectionEnd: urlStart + url.length,
          });
        } else {
          const label = "链接文字";
          const url = "https://";
          const nextValue = `${value.slice(0, start)}[${label}](${url})${value.slice(end)}`;
          applyResult({
            nextValue,
            selectionStart: start + 1,
            selectionEnd: start + 1 + label.length,
          });
        }
        break;
      }
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;

    const modifier = event.metaKey || event.ctrlKey;

    if (event.key === "Escape") {
      event.preventDefault();
      onFinish();
      return;
    }

    if (modifier && event.key === "Enter") {
      event.preventDefault();
      onFinish();
      return;
    }

    if (modifier && !event.shiftKey && !event.altKey) {
      const key = event.key.toLowerCase();
      if (key === "b" || key === "i" || key === "k") {
        event.preventDefault();
        applyFormat(key === "b" ? "bold" : key === "i" ? "italic" : "link");
      }
    }
  };

  const toolbarActions: Array<{
    action: FormatAction;
    label: string;
    icon: typeof Bold;
    shortcut?: string;
  }> = [
    { action: "bold", label: "加粗", icon: Bold, shortcut: "B" },
    { action: "italic", label: "斜体", icon: Italic, shortcut: "I" },
    { action: "heading", label: "小标题", icon: Heading2 },
    { action: "quote", label: "引用", icon: Quote },
    { action: "bullet", label: "列表", icon: List },
    { action: "task", label: "待办", icon: ListChecks },
    { action: "code", label: "行内代码", icon: Code2 },
    { action: "link", label: "链接", icon: Link2, shortcut: "K" },
  ];

  return (
    <div className="entry-editor" ref={rootRef}>
      <div
        className="editor-toolbar"
        role="toolbar"
        aria-label="Markdown 格式工具"
      >
        {toolbarActions.map((item, index) => {
          const Icon = item.icon;
          const needsSeparator = index === 3 || index === 6;
          return (
            <span className="toolbar-slot" key={item.action}>
              {needsSeparator ? (
                <span className="toolbar-separator" aria-hidden="true" />
              ) : null}
              <button
                type="button"
                className="toolbar-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => applyFormat(item.action)}
                aria-label={item.label}
                title={`${item.label}${item.shortcut ? ` · ${isMac ? "⌘" : "Ctrl"} ${item.shortcut}` : ""}`}
              >
                <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </span>
          );
        })}
        <span className="toolbar-hint">Markdown</span>
      </div>

      <label className="visually-hidden" htmlFor={`editor-${date}`}>
        编辑这一天的笔记
      </label>
      <textarea
        ref={textareaRef}
        id={`editor-${date}`}
        className="entry-textarea"
        value={content}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          "写下这一天。\n\n支持 Markdown：**加粗**、- 列表、> 引用、- [ ] 待办……"
        }
        spellCheck={false}
      />

      <div className="editor-footer">
        <span className="editor-note">
          <span className="editor-live-dot" aria-hidden="true" />
          自动保存 · 离开后排版
        </span>
        <span className="editor-shortcuts">
          <kbd>{isMac ? "⌘" : "Ctrl"}</kbd>
          <span>+</span>
          <kbd>Enter</kbd>
          <span>完成</span>
        </span>
        <button
          type="button"
          className="editor-done"
          onClick={onFinish}
          onMouseDown={(event) => event.preventDefault()}
        >
          <Check size={15} strokeWidth={2.2} aria-hidden="true" />
          完成
        </button>
      </div>
    </div>
  );
}
