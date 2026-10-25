import {
  CalendarPlus,
  Moon,
  Search,
  SlidersHorizontal,
  Sun,
} from "lucide-react";
import type { SaveState, ThemeMode } from "../types";

interface TopBarProps {
  mode: ThemeMode;
  saveState: SaveState;
  lastSavedAt: Date | null;
  onToggleMode: () => void;
  onOpenSearch: () => void;
  onOpenAppearance: () => void;
  onOpenDatePicker: () => void;
}

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "本地笔记",
  saving: "保存中",
  saved: "已保存",
  error: "未保存",
};

function timeLabel(date: Date | null): string | undefined {
  if (!date) return undefined;
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function TopBar({
  mode,
  saveState,
  lastSavedAt,
  onToggleMode,
  onOpenSearch,
  onOpenAppearance,
  onOpenDatePicker,
}: TopBarProps) {
  const savedTime = timeLabel(lastSavedAt);
  const nextModeLabel = mode === "dark" ? "切换为浅色" : "切换为深色";

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <button
            type="button"
            className="brand"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="回到页面顶部"
          >
            <span className="brand-seal" aria-hidden="true">
              自
            </span>
            <span className="brand-copy">
              <span className="brand-name">写给自己</span>
              <span className="brand-en">TO MYSELF</span>
            </span>
          </button>

          <span className="topbar-separator" aria-hidden="true" />

          <span
            className={`save-status is-${saveState}`}
            title={
              saveState === "error"
                ? "内容未能写入浏览器本地存储，请先导出备份"
                : savedTime
                  ? `最近保存于 ${savedTime}`
                  : "内容自动保存在当前浏览器"
            }
            aria-live="polite"
          >
            <span className="save-dot" aria-hidden="true" />
            <span className="save-label">{SAVE_LABELS[saveState]}</span>
            {saveState === "saved" && savedTime ? (
              <span className="save-time">{savedTime}</span>
            ) : null}
          </span>
        </div>

        <nav className="topbar-actions" aria-label="笔记工具">
          <button
            type="button"
            className="search-trigger"
            onClick={onOpenSearch}
            aria-label={`搜索笔记，快捷键 ${isMac ? "Command" : "Control"} K`}
          >
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <span className="search-trigger-label">搜索笔记</span>
            <kbd>{isMac ? "⌘" : "Ctrl"} K</kbd>
          </button>

          <button
            type="button"
            className="topbar-action"
            onClick={onOpenDatePicker}
            aria-label="补记过去的一天"
            title="补记过去的一天"
          >
            <CalendarPlus size={18} strokeWidth={1.7} aria-hidden="true" />
            <span className="action-label">补记</span>
          </button>

          <button
            type="button"
            className="topbar-action icon-only"
            onClick={onToggleMode}
            aria-label={nextModeLabel}
            title={nextModeLabel}
          >
            {mode === "dark" ? (
              <Sun size={18} strokeWidth={1.7} aria-hidden="true" />
            ) : (
              <Moon size={18} strokeWidth={1.7} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className="topbar-action"
            onClick={onOpenAppearance}
            aria-label="布置页面与数据备份"
            title="布置页面"
          >
            <SlidersHorizontal
              size={18}
              strokeWidth={1.7}
              aria-hidden="true"
            />
            <span className="action-label">布置</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
