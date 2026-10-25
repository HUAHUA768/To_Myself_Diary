import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { PenLine } from "lucide-react";
import type {
  AppearanceSettings,
  BackgroundImage,
  NoteDocument,
  NoteEntry,
  ParsedImport,
  SaveState,
  ThemePreset,
  ToastMessage,
} from "./types";
import {
  getAccent,
} from "./lib/appearance";
import {
  formatFullDate,
  formatMonthDay,
  shiftDateKey,
  todayKey,
} from "./lib/date";
import {
  buildBackupJson,
  parseBackupFile,
} from "./lib/backup";
import {
  createEmptyDocument,
  createEntry,
  downloadTextFile,
  normalizeDocument,
  notebookToMarkdown,
} from "./lib/document";
import { prepareBackgroundImage } from "./lib/image";
import {
  loadAppearance,
  loadBackgroundImage,
  loadNotebook,
  removeBackgroundImage,
  saveAppearance,
  saveBackgroundImage,
  saveNotebook,
} from "./lib/storage";
import { countWords, formatNumber } from "./lib/text";
import { Background } from "./components/Background";
import { TopBar } from "./components/TopBar";
import { JournalCover } from "./components/JournalCover";
import { DateEntry } from "./components/DateEntry";
import { EmptyState } from "./components/EmptyState";
import { SearchDialog } from "./components/SearchDialog";
import { AppearancePanel } from "./components/AppearancePanel";
import { DatePickerDialog } from "./components/DatePickerDialog";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { Toast } from "./components/Toast";

interface PendingImport {
  parsed: ParsedImport;
  filename: string;
}

function useToday(): string {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    const update = () => setToday(todayKey());
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return today;
}

function computeStreak(entries: NoteEntry[], today: string): number {
  const dates = new Set(entries.map((entry) => entry.date));
  if (dates.size === 0) return 0;

  let cursor = dates.has(today) ? today : shiftDateKey(today, -1);
  let streak = 0;
  const maximum = dates.size + 1;

  while (dates.has(cursor) && streak < maximum) {
    streak += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  return streak;
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "刚才的操作没有完成，请再试一次。";
}

export default function App() {
  const [notebook, setNotebook] = useState<NoteDocument | null>(null);
  const notebookRef = useRef<NoteDocument | null>(null);
  const [ready, setReady] = useState(false);
  const [appearance, setAppearance] = useState<AppearanceSettings>(
    loadAppearance,
  );
  const [backgroundImage, setBackgroundImage] =
    useState<BackgroundImage | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const editingDateRef = useRef<string | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [deleteDate, setDeleteDate] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(
    null,
  );
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const toastIdRef = useRef(0);
  const saveSeqRef = useRef(0);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveErrorShownRef = useRef(false);
  const today = useToday();

  const showToast = useCallback(
    (message: string, tone: ToastMessage["tone"] = "default") => {
      toastIdRef.current += 1;
      setToast({ id: toastIdRef.current, message, tone });
    },
    [],
  );

  const closeToast = useCallback(() => setToast(null), []);

  const updateNotebook = useCallback(
    (updater: (current: NoteDocument) => NoteDocument) => {
      const current = notebookRef.current;
      if (!current) return;
      const next = updater(current);
      notebookRef.current = next;
      setNotebook(next);
    },
    [],
  );

  const finishEditing = useCallback(() => {
    const date = editingDateRef.current;
    if (!date) return;

    editingDateRef.current = null;
    setEditingDate(null);

    const current = notebookRef.current;
    if (!current) return;
    const entry = current.entries.find((item) => item.date === date);
    if (!entry || entry.content.trim()) return;

    const now = new Date().toISOString();
    const next: NoteDocument = {
      ...current,
      updatedAt: now,
      entries: current.entries.filter((item) => item.date !== date),
    };
    notebookRef.current = next;
    setNotebook(next);
    showToast("空白的一天已收起");
  }, [showToast]);

  const startEditing = useCallback((date: string) => {
    const current = notebookRef.current;
    if (!current) return;

    const existing = current.entries.find((entry) => entry.date === date);
    if (!existing) {
      const now = new Date();
      const next: NoteDocument = {
        ...current,
        updatedAt: now.toISOString(),
        entries: [...current.entries, createEntry(date, "", now)],
      };
      notebookRef.current = next;
      setNotebook(next);
    }

    editingDateRef.current = date;
    setEditingDate(date);
  }, []);

  const updateEntryContent = useCallback(
    (date: string, content: string) => {
      const now = new Date().toISOString();
      updateNotebook((current) => ({
        ...current,
        updatedAt: now,
        entries: current.entries.map((entry) =>
          entry.date === date
            ? { ...entry, content, updatedAt: now }
            : entry,
        ),
      }));
    },
    [updateNotebook],
  );

  const openSearch = useCallback(() => {
    finishEditing();
    setSearchOpen(true);
  }, [finishEditing]);

  const openAppearance = useCallback(() => {
    finishEditing();
    setAppearanceOpen(true);
  }, [finishEditing]);

  const openDatePicker = useCallback(() => {
    finishEditing();
    setDatePickerOpen(true);
  }, [finishEditing]);

  const updateAppearance = useCallback(
    (patch: Partial<AppearanceSettings>) => {
      setAppearance((current) => ({ ...current, ...patch }));
    },
    [],
  );

  const selectPreset = useCallback((preset: ThemePreset) => {
    setAppearance((current) => ({
      ...current,
      backgroundType: "preset",
      presetId: preset.id,
      mode: preset.mode,
    }));
  }, []);

  const toggleMode = useCallback(() => {
    finishEditing();
    setAppearance((current) => ({
      ...current,
      mode: current.mode === "dark" ? "light" : "dark",
    }));
  }, [finishEditing]);

  const handleWriteToday = useCallback(() => {
    finishEditing();
    startEditing(today);
  }, [finishEditing, startEditing, today]);

  const handleDateConfirm = useCallback(
    (date: string) => {
      setDatePickerOpen(false);
      startEditing(date);
    },
    [startEditing],
  );

  const handleJumpToDate = useCallback((date: string) => {
    setSearchOpen(false);
    setHighlightedDate(date);
  }, []);

  const saveNow = useCallback(async () => {
    const current = notebookRef.current;
    if (!current) return;

    const seq = ++saveSeqRef.current;
    setSaveState("saving");

    try {
      const operation = saveChainRef.current
        .catch(() => undefined)
        .then(() => saveNotebook(current));
      saveChainRef.current = operation;
      await operation;

      if (seq === saveSeqRef.current) {
        setSaveState("saved");
        setLastSavedAt(new Date());
      }
      showToast("已保存到本地", "success");
    } catch (error) {
      if (seq === saveSeqRef.current) setSaveState("error");
      showToast(`保存失败：${errorMessage(error)}`, "error");
    }
  }, [showToast]);

  const handleUploadImage = useCallback(
    async (file: File) => {
      setImageBusy(true);
      try {
        const processed = await prepareBackgroundImage(file);
        setBackgroundImage(processed);
        updateAppearance({ backgroundType: "image" });

        try {
          await saveBackgroundImage(processed);
          showToast("新的背景已经铺好", "success");
        } catch {
          showToast("背景已应用，但浏览器未能将它保存下来", "error");
        }
      } catch (error) {
        showToast(errorMessage(error), "error");
      } finally {
        setImageBusy(false);
      }
    },
    [showToast, updateAppearance],
  );

  const handleRemoveImage = useCallback(async () => {
    setImageBusy(true);
    try {
      await removeBackgroundImage();
      setBackgroundImage(null);
      if (appearance.backgroundType === "image") {
        updateAppearance({ backgroundType: "gradient" });
      }
      showToast("背景照片已移除");
    } catch (error) {
      showToast(`移除失败：${errorMessage(error)}`, "error");
    } finally {
      setImageBusy(false);
    }
  }, [appearance.backgroundType, showToast, updateAppearance]);

  const handleExportMarkdown = useCallback(() => {
    const current = notebookRef.current;
    if (!current) return;

    const entries = current.entries.filter((entry) => entry.content.trim());
    if (entries.length === 0) {
      showToast("还没有可以导出的内容", "error");
      return;
    }

    const markdown = notebookToMarkdown({ ...current, entries });
    downloadTextFile(`写给自己-${today}.md`, markdown, "text/markdown");
    showToast("Markdown 笔记已导出", "success");
  }, [showToast, today]);

  const handleExportJson = useCallback(() => {
    const current = notebookRef.current;
    if (!current) return;

    const entries = current.entries.filter((entry) => entry.content.trim());
    if (entries.length === 0) {
      showToast("还没有可以备份的内容", "error");
      return;
    }

    const backup = buildBackupJson(
      { ...current, entries },
      appearance,
      backgroundImage,
    );
    downloadTextFile(
      `写给自己-完整备份-${today}.json`,
      backup,
      "application/json",
    );
    showToast("完整备份已导出", "success");
  }, [appearance, backgroundImage, showToast, today]);

  const handleImportFile = useCallback(
    async (file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        showToast("备份文件不能超过 25MB", "error");
        return;
      }

      try {
        const text = await file.text();
        const parsed = parseBackupFile(file.name, text);
        setPendingImport({ parsed, filename: file.name });
        setAppearanceOpen(false);
      } catch (error) {
        showToast(errorMessage(error), "error");
      }
    },
    [showToast],
  );

  const applyImport = useCallback(() => {
    if (!pendingImport) return;

    const { parsed } = pendingImport;
    setPendingImport(null);
    finishEditing();

    const now = new Date().toISOString();
    const importedNotebook: NoteDocument = {
      ...parsed.notebook,
      updatedAt: now,
    };

    notebookRef.current = importedNotebook;
    setNotebook(importedNotebook);
    editingDateRef.current = null;
    setEditingDate(null);
    setHighlightedDate(null);
    setSearchOpen(false);
    setDatePickerOpen(false);
    setDeleteDate(null);
    setSaveState("saving");

    if (parsed.kind === "json" && parsed.appearance) {
      setAppearance(parsed.appearance);
    }

    if (
      parsed.kind === "json" &&
      parsed.backgroundImage !== undefined
    ) {
      setBackgroundImage(parsed.backgroundImage);
    }

    void (async () => {
      let imageFailed = false;

      try {
        await saveNotebook(importedNotebook);

        if (
          parsed.kind === "json" &&
          parsed.backgroundImage !== undefined
        ) {
          try {
            if (parsed.backgroundImage) {
              await saveBackgroundImage(parsed.backgroundImage);
            } else {
              await removeBackgroundImage();
            }
          } catch {
            imageFailed = true;
          }
        }

        setSaveState("saved");
        setLastSavedAt(new Date());
        window.scrollTo({ top: 0, behavior: "smooth" });
        showToast(
          imageFailed
            ? "笔记已导入，但背景照片未能保存"
            : `已导入 ${normalizeDocument(importedNotebook).entries.length} 天记录`,
          imageFailed ? "error" : "success",
        );
      } catch (error) {
        setSaveState("error");
        showToast(`导入后保存失败：${errorMessage(error)}`, "error");
      }
    })();
  }, [finishEditing, pendingImport, showToast]);

  const confirmDelete = useCallback(() => {
    if (!deleteDate) return;
    const current = notebookRef.current;
    if (!current) return;

    const now = new Date().toISOString();
    const next: NoteDocument = {
      ...current,
      updatedAt: now,
      entries: current.entries.filter((entry) => entry.date !== deleteDate),
    };
    notebookRef.current = next;
    setNotebook(next);

    if (editingDateRef.current === deleteDate) {
      editingDateRef.current = null;
      setEditingDate(null);
    }

    const label = formatMonthDay(deleteDate);
    setDeleteDate(null);
    showToast(`${label}的记录已删除`);
  }, [deleteDate, showToast]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const [docResult, imageResult] = await Promise.allSettled([
        loadNotebook(),
        loadBackgroundImage(),
      ]);

      if (cancelled) return;

      let loadedDoc: NoteDocument | null = null;
      if (docResult.status === "fulfilled") {
        loadedDoc = docResult.value;
      }

      const initialDoc = loadedDoc ?? createEmptyDocument();
      notebookRef.current = initialDoc;
      setNotebook(initialDoc);

      if (imageResult.status === "fulfilled") {
        setBackgroundImage(imageResult.value);
      }

      setReady(true);

      if (loadedDoc) {
        setSaveState("saved");
        const savedAt = new Date(loadedDoc.updatedAt);
        setLastSavedAt(
          Number.isNaN(savedAt.getTime()) ? new Date() : savedAt,
        );
      } else {
        setSaveState("idle");
      }

      if (docResult.status === "rejected") {
        setSaveState("error");
        showToast("读取本地笔记失败，请先导出一份备份再刷新页面", "error");
      } else if (imageResult.status === "rejected") {
        showToast("背景照片读取失败，页面其余内容不受影响", "error");
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [showToast]);

  useEffect(() => {
    saveAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    document.body.dataset.theme = appearance.mode;
    document.documentElement.style.colorScheme = appearance.mode;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        appearance.mode === "dark" ? "#171411" : "#f4eddf",
      );
    }
  }, [appearance.mode]);

  useEffect(() => {
    if (!ready || !notebook) return;

    const snapshot = notebook;
    const seq = ++saveSeqRef.current;
    setSaveState("saving");

    const timeout = window.setTimeout(() => {
      const operation = saveChainRef.current
        .catch(() => undefined)
        .then(() => saveNotebook(snapshot));
      saveChainRef.current = operation;

      operation
        .then(() => {
          if (seq !== saveSeqRef.current) return;
          setSaveState("saved");
          setLastSavedAt(new Date());
          saveErrorShownRef.current = false;
        })
        .catch(() => {
          if (seq !== saveSeqRef.current) return;
          setSaveState("error");
          if (!saveErrorShownRef.current) {
            saveErrorShownRef.current = true;
            showToast(
              "内容没有成功保存到浏览器，请打开“布置”先导出一份备份",
              "error",
            );
          }
        });
    }, 560);

    return () => window.clearTimeout(timeout);
  }, [notebook, ready, showToast]);

  useEffect(() => {
    if (!ready) return;

    const flush = () => {
      const current = notebookRef.current;
      if (current) void saveNotebook(current);
    };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [ready]);

  useEffect(() => {
    if (!editingDate) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById(`entry-${editingDate}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 110);
    return () => window.clearTimeout(timer);
  }, [editingDate]);

  useEffect(() => {
    if (!highlightedDate) return;

    const scrollTimer = window.setTimeout(() => {
      document
        .getElementById(`entry-${highlightedDate}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    const clearTimer = window.setTimeout(
      () => setHighlightedDate(null),
      2800,
    );

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightedDate]);

  const overlayOpen =
    searchOpen ||
    appearanceOpen ||
    datePickerOpen ||
    deleteDate !== null ||
    pendingImport !== null;

  useEffect(() => {
    if (!overlayOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlayOpen]);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".topbar, .page, .write-fab, .toast",
      ),
    );
    targets.forEach((element) => {
      element.inert = overlayOpen;
    });
    return () => {
      targets.forEach((element) => {
        element.inert = false;
      });
    };
  }, [overlayOpen]);

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) return;

      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveNow();
        return;
      }

      if (event.key.toLowerCase() !== "k" || overlayOpen) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      openSearch();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch, overlayOpen, saveNow]);

  const contentEntries = useMemo(
    () =>
      (notebook?.entries ?? []).filter((entry) => entry.content.trim().length),
    [notebook],
  );

  const sortedEntries = useMemo(() => {
    return [...(notebook?.entries ?? [])].sort((a, b) =>
      appearance.sortOrder === "newest"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date),
    );
  }, [appearance.sortOrder, notebook]);

  const displayEntries = useMemo(
    () =>
      sortedEntries.filter(
        (entry) => entry.content.trim().length > 0 || entry.date === editingDate,
      ),
    [editingDate, sortedEntries],
  );

  const searchEntries = useMemo(
    () => sortedEntries.filter((entry) => entry.content.trim().length > 0),
    [sortedEntries],
  );

  const existingDates = useMemo(
    () => new Set(contentEntries.map((entry) => entry.date)),
    [contentEntries],
  );

  const totalDays = contentEntries.length;
  const totalWords = useMemo(
    () =>
      contentEntries.reduce(
        (sum, entry) => sum + countWords(entry.content),
        0,
      ),
    [contentEntries],
  );
  const streak = useMemo(
    () => computeStreak(contentEntries, today),
    [contentEntries, today],
  );
  const hasTodayEntry = contentEntries.some((entry) => entry.date === today);
  const accent = getAccent(appearance);
  const appStyle = { "--accent": accent } as CSSProperties;

  const importDetails = useMemo(() => {
    if (!pendingImport) return null;
    const entries = pendingImport.parsed.notebook.entries;
    const words = entries.reduce(
      (sum, entry) => sum + countWords(entry.content),
      0,
    );
    return {
      days: entries.length,
      words,
      kind: pendingImport.parsed.kind,
      filename: pendingImport.filename,
    };
  }, [pendingImport]);

  if (!ready || !notebook) {
    return (
      <div
        className="app loading-app"
        data-theme={appearance.mode}
        style={appStyle}
      >
        <Background appearance={appearance} image={backgroundImage} />
        <div className="loading-screen" role="status" aria-live="polite">
          <span className="loading-seal" aria-hidden="true">
            自
          </span>
          <p>正在展开这一页</p>
          <span className="loading-line" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="app"
      data-theme={appearance.mode}
      data-background={appearance.backgroundType}
      style={appStyle}
    >
      <Background appearance={appearance} image={backgroundImage} />

      <TopBar
        mode={appearance.mode}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        onToggleMode={toggleMode}
        onOpenSearch={openSearch}
        onOpenAppearance={openAppearance}
        onOpenDatePicker={openDatePicker}
      />

      <main className="page">
        <div className="notebook">
          <JournalCover
            today={today}
            totalDays={totalDays}
            totalWords={totalWords}
            streak={streak}
          />

          <div className="journal-entries">
            {displayEntries.length > 0 ? (
              displayEntries.map((entry) => (
                <DateEntry
                  key={entry.date}
                  entry={entry}
                  today={today}
                  isEditing={editingDate === entry.date}
                  isHighlighted={highlightedDate === entry.date}
                  onStartEdit={() => startEditing(entry.date)}
                  onChange={(content) =>
                    updateEntryContent(entry.date, content)
                  }
                  onFinish={finishEditing}
                  onDelete={() => setDeleteDate(entry.date)}
                />
              ))
            ) : (
              <EmptyState onStart={handleWriteToday} />
            )}
          </div>

          <footer className="journal-footer">
            <div className="journal-footer-mark" aria-hidden="true">
              <span />
              <i>✦</i>
              <span />
            </div>
            <p className="journal-footer-stats">
              {totalDays > 0
                ? `这一页收录了 ${totalDays} 天，${formatNumber(totalWords)} 字`
                : "这一页，从今天开始"}
            </p>
            <p className="journal-footer-note">
              TO MYSELF · 仅保存在此浏览器 · {formatFullDate(today)}
            </p>
          </footer>
        </div>
      </main>

      {editingDate ? null : (
        <button
          type="button"
          className="write-fab"
          onClick={handleWriteToday}
          aria-label={hasTodayEntry ? "续写今天" : "写下今天"}
        >
          <PenLine size={18} strokeWidth={1.9} aria-hidden="true" />
          <span>{hasTodayEntry ? "续写今天" : "写今天"}</span>
        </button>
      )}

      {searchOpen ? (
        <SearchDialog
          entries={searchEntries}
          today={today}
          onClose={() => setSearchOpen(false)}
          onJump={handleJumpToDate}
        />
      ) : null}

      {appearanceOpen ? (
        <AppearancePanel
          appearance={appearance}
          image={backgroundImage}
          imageBusy={imageBusy}
          entryCount={totalDays}
          onClose={() => setAppearanceOpen(false)}
          onChange={updateAppearance}
          onSelectPreset={selectPreset}
          onUploadImage={handleUploadImage}
          onRemoveImage={() => void handleRemoveImage()}
          onExportMarkdown={handleExportMarkdown}
          onExportJson={handleExportJson}
          onImportFile={(file) => void handleImportFile(file)}
        />
      ) : null}

      {datePickerOpen ? (
        <DatePickerDialog
          today={today}
          existingDates={existingDates}
          onClose={() => setDatePickerOpen(false)}
          onConfirm={handleDateConfirm}
        />
      ) : null}

      {pendingImport && importDetails ? (
        <ConfirmDialog
          kind="import"
          title="导入这份备份？"
          description={
            importDetails.kind === "json"
              ? `这会用备份中的 ${importDetails.days} 天记录替换当前整篇笔记，并一并恢复当时的外观与背景设置。`
              : `这会用备份中的 ${importDetails.days} 天记录替换当前整篇笔记；外观设置与背景照片保持不变。`
          }
          detail={`${importDetails.filename} · ${formatNumber(importDetails.words)} 字`}
          confirmLabel="导入并替换"
          cancelLabel="先不导入"
          onClose={() => setPendingImport(null)}
          onConfirm={applyImport}
        />
      ) : null}

      {deleteDate ? (
        <ConfirmDialog
          kind="danger"
          title="删掉这一天的记录？"
          description={`${formatFullDate(deleteDate)} 的内容会从这一篇里移除，且无法恢复。`}
          detail="其他日期的记录不会受影响。"
          confirmLabel="删除这一天"
          onClose={() => setDeleteDate(null)}
          onConfirm={confirmDelete}
        />
      ) : null}

      {toast ? <Toast toast={toast} onClose={closeToast} /> : null}
    </div>
  );
}
