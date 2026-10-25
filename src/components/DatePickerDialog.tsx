import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { CalendarPlus, X } from "lucide-react";
import {
  formatFullDate,
  isValidDateKey,
  parseDateKey,
  shiftDateKey,
} from "../lib/date";

interface DatePickerDialogProps {
  today: string;
  existingDates: Set<string>;
  onClose: () => void;
  onConfirm: (date: string) => void;
}

export function DatePickerDialog({
  today,
  existingDates,
  onClose,
  onConfirm,
}: DatePickerDialogProps) {
  const initialDate = shiftDateKey(today, -1);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const quickDates = [
    { label: "昨天", date: shiftDateKey(today, -1) },
    { label: "前天", date: shiftDateKey(today, -2) },
    { label: "一周前", date: shiftDateKey(today, -7) },
  ];

  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const selectedIsValid =
    isValidDateKey(selectedDate) &&
    (parseDateKey(selectedDate)?.getTime() ?? Infinity) <=
      (parseDateKey(today)?.getTime() ?? 0);
  const alreadyExists = selectedIsValid && existingDates.has(selectedDate);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedIsValid) {
      setError("请选择一个今天或更早的日期。");
      return;
    }
    setError("");
    onConfirm(selectedDate);
  };

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div
      className="overlay dialog-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <form
        className="dialog date-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="date-dialog-title"
        onSubmit={handleSubmit}
      >
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <span className="dialog-icon">
          <CalendarPlus size={21} strokeWidth={1.6} aria-hidden="true" />
        </span>
        <p className="dialog-kicker">LOOKING BACK</p>
        <h2 id="date-dialog-title">回到某一天</h2>
        <p className="dialog-copy">
          把当时没写下的那几行补上。一次只补一天，这一天会在时间线上回到自己的位置。
        </p>

        <label className="date-field">
          <span>补记日期</span>
          <input
            ref={inputRef}
            type="date"
            value={selectedDate}
            max={today}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setError("");
            }}
            aria-describedby={error ? "date-field-error" : undefined}
          />
        </label>

        <div className="quick-dates" aria-label="快捷日期">
          {quickDates.map((item) => (
            <button
              type="button"
              key={item.label}
              className={selectedDate === item.date ? "is-active" : ""}
              onClick={() => {
                setSelectedDate(item.date);
                setError("");
              }}
              aria-pressed={selectedDate === item.date}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="date-selection-note">
          {selectedIsValid ? (
            <>
              <span>{formatFullDate(selectedDate)}</span>
              <span>
                {alreadyExists
                  ? "这一天已有内容，会在原处打开。"
                  : "这一天还是空白，可以从现在补起。"}
              </span>
            </>
          ) : (
            <span>请选择一个有效的过去日期。</span>
          )}
        </div>

        {error ? (
          <p className="form-error" id="date-field-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="dialog-actions">
          <button type="button" className="button ghost" onClick={onClose}>
            取消
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={!selectedIsValid}
          >
            {alreadyExists ? "打开这一天" : "开始补记"}
          </button>
        </div>
      </form>
    </div>
  );
}
