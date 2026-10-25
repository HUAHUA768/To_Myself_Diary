const WEEKDAYS = [
  "星期日",
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
] as const;

const MONTHS = [
  "一月",
  "二月",
  "三月",
  "四月",
  "五月",
  "六月",
  "七月",
  "八月",
  "九月",
  "十月",
  "十一月",
  "十二月",
] as const;

export interface DateParts {
  year: number;
  month: number;
  day: number;
  weekday: string;
  monthName: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(dateKey: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isValidDateKey(dateKey: string): boolean {
  return parseDateKey(dateKey) !== null;
}

export function getDateParts(dateKey: string): DateParts {
  const date = parseDateKey(dateKey);
  if (!date) {
    return {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      weekday: "",
      monthName: "",
    };
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: WEEKDAYS[date.getDay()] ?? "",
    monthName: MONTHS[date.getMonth()] ?? "",
  };
}

export function formatMonthDay(dateKey: string): string {
  const parts = getDateParts(dateKey);
  return `${parts.month}月${parts.day}日`;
}

export function formatFullDate(dateKey: string): string {
  const parts = getDateParts(dateKey);
  return `${parts.year}年${parts.month}月${parts.day}日 · ${parts.weekday}`;
}

export function formatExportDate(dateKey: string): string {
  const parts = getDateParts(dateKey);
  return `${parts.year}年${parts.month}月${parts.day}日 · ${parts.weekday}`;
}

export function formatNumericDate(dateKey: string): string {
  const parts = getDateParts(dateKey);
  return `${parts.year}/${parts.month}/${parts.day}`;
}

export function shiftDateKey(dateKey: string, offsetDays: number): string {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + offsetDays);
  return toDateKey(date);
}

export function relativeDayLabel(dateKey: string, today = todayKey()): string {
  if (dateKey === today) return "今天";
  if (dateKey === shiftDateKey(today, -1)) return "昨天";
  if (dateKey === shiftDateKey(today, -2)) return "前天";
  return "";
}

export function compareDateKeys(a: string, b: string): number {
  return a.localeCompare(b);
}
