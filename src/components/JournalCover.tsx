import { formatFullDate } from "../lib/date";
import { formatNumber } from "../lib/text";

interface JournalCoverProps {
  today: string;
  totalDays: number;
  totalWords: number;
  streak: number;
}

export function JournalCover({
  today,
  totalDays,
  totalWords,
  streak,
}: JournalCoverProps) {
  return (
    <header className="journal-cover">
      <p className="cover-kicker">
        <span aria-hidden="true" />
        私人笔记 · 只此一篇
        <span aria-hidden="true" />
      </p>

      <h1 className="cover-title">写给自己</h1>
      <p className="cover-subtitle">把日子写成一封没有结尾的信。</p>

      <div className="cover-meta">
        <time dateTime={today}>{formatFullDate(today)}</time>
        <span className="cover-meta-dot" aria-hidden="true" />
        {totalDays > 0 ? (
          <>
            <span>
              已写 {totalDays} 天 · {formatNumber(totalWords)} 字
            </span>
            {streak > 1 ? (
              <>
                <span className="cover-meta-dot" aria-hidden="true" />
                <span>连续 {streak} 天</span>
              </>
            ) : null}
          </>
        ) : (
          <span>第一行，随时可以开始</span>
        )}
      </div>

      <div className="cover-ornament" aria-hidden="true">
        <span />
        <i />
        <span />
      </div>
    </header>
  );
}
