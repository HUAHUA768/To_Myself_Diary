import type { MouseEvent } from "react";
import { Pencil, PenLine, Trash2 } from "lucide-react";
import type { NoteEntry } from "../types";
import {
  getDateParts,
  relativeDayLabel,
  formatFullDate,
} from "../lib/date";
import { countWords, formatNumber } from "../lib/text";
import { EntryEditor } from "./EntryEditor";
import { MarkdownView } from "./MarkdownView";

interface DateEntryProps {
  entry: NoteEntry;
  today: string;
  isEditing: boolean;
  isHighlighted: boolean;
  onStartEdit: () => void;
  onChange: (content: string) => void;
  onFinish: () => void;
  onDelete: () => void;
}

export function DateEntry({
  entry,
  today,
  isEditing,
  isHighlighted,
  onStartEdit,
  onChange,
  onFinish,
  onDelete,
}: DateEntryProps) {
  const parts = getDateParts(entry.date);
  const relative = relativeDayLabel(entry.date, today);
  const wordCount = countWords(entry.content);
  const headingId = `entry-heading-${entry.date}`;

  const handleBodyClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("a, button, input, textarea, label, summary, video, audio")
    ) {
      return;
    }

    if (window.getSelection()?.toString().trim()) return;
    onStartEdit();
  };

  return (
    <article
      className={[
        "date-entry",
        isEditing ? "is-editing" : "",
        isHighlighted ? "is-highlighted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id={`entry-${entry.date}`}
      aria-labelledby={headingId}
      data-date={entry.date}
    >
      <header className="entry-heading">
        <div className="date-cluster">
          <span className="date-day" aria-hidden="true">
            {String(parts.day).padStart(2, "0")}
          </span>
          <span className="date-stem" aria-hidden="true" />
          <div className="date-copy">
            <h2 className="date-line" id={headingId}>
              <span className="date-month">{parts.month}月</span>
              <span className="date-weekday">{parts.weekday}</span>
              {relative ? (
                <span className="date-relative">{relative}</span>
              ) : null}
            </h2>
            <p className="date-year">{parts.year}</p>
          </div>
        </div>

        <div className="entry-tools">
          {isEditing ? (
            <span className="editing-label">
              <PenLine size={13} strokeWidth={2} aria-hidden="true" />
              正在书写
            </span>
          ) : (
            <>
              <span className="entry-words">
                {formatNumber(wordCount)} 字
              </span>
              <button
                type="button"
                className="entry-icon-button"
                onClick={onStartEdit}
                aria-label={`编辑 ${formatFullDate(entry.date)} 的笔记`}
                title="编辑这一天"
              >
                <Pencil size={15} strokeWidth={1.9} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="entry-icon-button danger"
                onClick={onDelete}
                aria-label={`删除 ${formatFullDate(entry.date)} 的笔记`}
                title="删除这一天"
              >
                <Trash2 size={15} strokeWidth={1.9} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="entry-rule" aria-hidden="true">
        <span />
      </div>

      {isEditing ? (
        <EntryEditor
          date={entry.date}
          content={entry.content}
          onChange={onChange}
          onFinish={onFinish}
        />
      ) : (
        <div
          className="entry-body"
          onClick={handleBodyClick}
          title="点击开始编辑"
        >
          <span className="edit-affordance" aria-hidden="true">
            <Pencil size={13} strokeWidth={2} />
            编辑
          </span>
          <MarkdownView content={entry.content} />
        </div>
      )}
    </article>
  );
}
