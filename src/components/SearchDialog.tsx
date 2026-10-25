import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { CalendarDays, CornerDownLeft, Search, X } from "lucide-react";
import type { NoteEntry } from "../types";
import {
  formatFullDate,
  getDateParts,
  relativeDayLabel,
} from "../lib/date";
import { getSearchSnippet, toPlainText } from "../lib/text";

interface SearchDialogProps {
  entries: NoteEntry[];
  today: string;
  onClose: () => void;
  onJump: (date: string) => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lowerText = text.toLocaleLowerCase();
  const lowerQuery = query.toLocaleLowerCase();
  const parts: Array<{ text: string; match: boolean }> = [];
  let cursor = 0;
  let index = lowerText.indexOf(lowerQuery);

  while (index !== -1) {
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), match: false });
    }
    parts.push({ text: text.slice(index, index + query.length), match: true });
    cursor = index + query.length;
    index = lowerText.indexOf(lowerQuery, cursor);
  }

  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), match: false });
  }

  return (
    <>
      {parts.map((part, index) =>
        part.match ? <mark key={index}>{part.text}</mark> : part.text,
      )}
    </>
  );
}

export function SearchDialog({
  entries,
  today,
  onClose,
  onJump,
}: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();

  const results = useMemo(() => {
    if (!trimmedQuery) return entries;
    const needle = trimmedQuery.toLocaleLowerCase();

    return entries.filter((entry) => {
      const dateText =
        `${entry.date} ${formatFullDate(entry.date)} ${toPlainText(entry.content)}`.toLocaleLowerCase();
      return dateText.includes(needle);
    });
  }, [entries, trimmedQuery]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [trimmedQuery]);

  useEffect(() => {
    if (activeIndex >= results.length) {
      setActiveIndex(Math.max(0, results.length - 1));
    }
  }, [activeIndex, results.length]);

  useEffect(() => {
    const activeElement = listRef.current?.querySelector(
      `[data-result-index="${activeIndex}"]`,
    );
    activeElement?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0 ? 0 : (current + 1) % results.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0
          ? 0
          : (current - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      onJump(results[activeIndex].date);
    }
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="overlay search-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <div
        className="search-shell"
        role="dialog"
        aria-modal="true"
        aria-label="搜索笔记"
        onKeyDown={handleKeyDown}
      >
        <div className="search-input-row">
          <Search size={19} strokeWidth={1.8} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索写过的字，或找某一天…"
            aria-label="搜索笔记内容或日期"
            autoComplete="off"
          />
          <button
            type="button"
            className="search-close"
            onClick={onClose}
            aria-label="关闭搜索"
          >
            <X size={18} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>

        <div className="search-list-heading">
          <span>
            {trimmedQuery
              ? `搜索结果 · ${results.length} 条`
              : `日期索引 · ${entries.length} 天`}
          </span>
          {trimmedQuery ? (
            <span className="search-query-label">“{trimmedQuery}”</span>
          ) : (
            <span className="search-query-label">按日期翻回某一天</span>
          )}
        </div>

        <div className="search-results" ref={listRef}>
          {results.length === 0 ? (
            <div className="search-empty">
              <CalendarDays
                size={26}
                strokeWidth={1.3}
                aria-hidden="true"
              />
              <p>
                {entries.length === 0
                  ? "这一页还没有写入任何一天。"
                  : `没有找到与“${trimmedQuery}”有关的记录。`}
              </p>
              <span>
                {entries.length === 0
                  ? "写下今天，再回来看看。"
                  : "试试更短的关键词，或者一个日期。"}
              </span>
            </div>
          ) : (
            results.map((entry, index) => {
              const parts = getDateParts(entry.date);
              const relative = relativeDayLabel(entry.date, today);
              const preview = trimmedQuery
                ? getSearchSnippet(entry.content, trimmedQuery)
                : toPlainText(entry.content).slice(0, 86);

              return (
                <button
                  type="button"
                  key={entry.date}
                  className={`search-result ${index === activeIndex ? "is-active" : ""}`}
                  onClick={() => onJump(entry.date)}
                  onMouseEnter={() => setActiveIndex(index)}
                  data-result-index={index}
                >
                  <span className="search-result-date" aria-hidden="true">
                    <strong>{String(parts.day).padStart(2, "0")}</strong>
                    <span>{parts.month}月</span>
                  </span>
                  <span className="search-result-copy">
                    <span className="search-result-meta">
                      <span>{parts.year}</span>
                      <span>{parts.weekday}</span>
                      {relative ? (
                        <em className="search-relative">{relative}</em>
                      ) : null}
                    </span>
                    <span className="search-result-snippet">
                      <HighlightedText
                        text={preview || "这一天只有空白。"}
                        query={trimmedQuery}
                      />
                    </span>
                  </span>
                  <CornerDownLeft
                    size={15}
                    strokeWidth={1.7}
                    className="search-enter-icon"
                    aria-hidden="true"
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="search-footer">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> 选择
          </span>
          <span>
            <kbd>Enter</kbd> 跳转
          </span>
          <span>
            <kbd>Esc</kbd> 关闭
          </span>
        </div>
      </div>
    </div>
  );
}
