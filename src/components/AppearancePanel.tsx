import {
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from "react";
import {
  Check,
  Download,
  FileJson,
  FileText,
  Image as ImageIcon,
  Loader2,
  Moon,
  Palette,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type {
  AppearanceSettings,
  BackgroundImage,
  BackgroundType,
  ThemePreset,
} from "../types";
import { THEME_PRESETS } from "../lib/appearance";
import { formatNumber } from "../lib/text";

interface AppearancePanelProps {
  appearance: AppearanceSettings;
  image: BackgroundImage | null;
  imageBusy: boolean;
  entryCount: number;
  onClose: () => void;
  onChange: (patch: Partial<AppearanceSettings>) => void;
  onSelectPreset: (preset: ThemePreset) => void;
  onUploadImage: (file: File) => void;
  onRemoveImage: () => void;
  onExportMarkdown: () => void;
  onExportJson: () => void;
  onImportFile: (file: File) => void;
}

interface RangeControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: RangeControlProps) {
  return (
    <label className="range-control">
      <span className="range-heading">
        <span>{label}</span>
        <output>{display}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={label}
      />
    </label>
  );
}

const CUSTOM_TABS: Array<{
  type: Extract<BackgroundType, "solid" | "gradient" | "image">;
  label: string;
}> = [
  { type: "solid", label: "纯色" },
  { type: "gradient", label: "渐变" },
  { type: "image", label: "图片" },
];

export function AppearancePanel({
  appearance,
  image,
  imageBusy,
  entryCount,
  onClose,
  onChange,
  onSelectPreset,
  onUploadImage,
  onRemoveImage,
  onExportMarkdown,
  onExportJson,
  onImportFile,
}: AppearancePanelProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleImageFile = (file: File | undefined) => {
    if (!file) return;
    onUploadImage(file);
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    handleImageFile(event.dataTransfer.files?.[0]);
  };

  const changeCustomType = (
    type: Extract<BackgroundType, "solid" | "gradient" | "image">,
  ) => {
    onChange({ backgroundType: type });
  };

  return (
    <div
      className="overlay panel-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <aside
        className="appearance-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-title"
        tabIndex={-1}
      >
        <header className="panel-header">
          <div>
            <p className="panel-kicker">MAKE IT YOURS</p>
            <h2 id="appearance-title">布置这一页</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="panel-close"
            onClick={onClose}
            aria-label="关闭布置面板"
          >
            <X size={19} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </header>

        <div className="panel-body">
          <section className="panel-section">
            <div className="panel-section-heading">
              <h3>阅读光景</h3>
              <span>深浅随你</span>
            </div>
            <div className="segmented-control" aria-label="阅读模式">
              <button
                type="button"
                className={appearance.mode === "light" ? "is-active" : ""}
                onClick={() => onChange({ mode: "light" })}
                aria-pressed={appearance.mode === "light"}
              >
                <Sun size={15} strokeWidth={1.8} aria-hidden="true" />
                浅色
              </button>
              <button
                type="button"
                className={appearance.mode === "dark" ? "is-active" : ""}
                onClick={() => onChange({ mode: "dark" })}
                aria-pressed={appearance.mode === "dark"}
              >
                <Moon size={15} strokeWidth={1.8} aria-hidden="true" />
                深色
              </button>
            </div>
          </section>

          <section className="panel-section">
            <div className="panel-section-heading">
              <h3>日期顺序</h3>
              <span>这一篇怎么翻</span>
            </div>
            <div className="segmented-control" aria-label="日期顺序">
              <button
                type="button"
                className={appearance.sortOrder === "newest" ? "is-active" : ""}
                onClick={() => onChange({ sortOrder: "newest" })}
                aria-pressed={appearance.sortOrder === "newest"}
              >
                最新在前
              </button>
              <button
                type="button"
                className={appearance.sortOrder === "oldest" ? "is-active" : ""}
                onClick={() => onChange({ sortOrder: "oldest" })}
                aria-pressed={appearance.sortOrder === "oldest"}
              >
                最早在前
              </button>
            </div>
          </section>

          <section className="panel-section">
            <div className="panel-section-heading">
              <h3>内置背景</h3>
              <span>一键换一种天气</span>
            </div>
            <div className="theme-grid">
              {THEME_PRESETS.map((preset) => {
                const selected =
                  appearance.backgroundType === "preset" &&
                  appearance.presetId === preset.id;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    className={`theme-card ${selected ? "is-selected" : ""}`}
                    style={{ background: preset.background }}
                    onClick={() => onSelectPreset(preset)}
                    aria-label={`使用${preset.name}背景，${preset.note}`}
                    aria-pressed={selected}
                  >
                    <span className="theme-card-shade" aria-hidden="true" />
                    <span className="theme-card-copy">
                      <strong>{preset.name}</strong>
                      <small>{preset.note}</small>
                    </span>
                    {selected ? (
                      <span className="theme-card-check" aria-hidden="true">
                        <Check size={13} strokeWidth={2.4} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel-section">
            <div className="panel-section-heading">
              <h3>自己布置背景</h3>
              <span>颜色、光与照片</span>
            </div>

            <div className="custom-tabs" role="group" aria-label="自定义背景类型">
              {CUSTOM_TABS.map((tab) => (
                <button
                  type="button"
                  key={tab.type}
                  className={
                    appearance.backgroundType === tab.type ? "is-active" : ""
                  }
                  onClick={() => changeCustomType(tab.type)}
                  aria-pressed={appearance.backgroundType === tab.type}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {appearance.backgroundType === "solid" ? (
              <div className="custom-controls">
                <div className="color-row">
                  <label className="color-field">
                    <span>底色</span>
                    <span className="color-picker-shell">
                      <input
                        type="color"
                        value={appearance.solidColor}
                        onChange={(event) =>
                          onChange({ solidColor: event.target.value })
                        }
                        aria-label="选择背景颜色"
                      />
                      <code>{appearance.solidColor.toUpperCase()}</code>
                    </span>
                  </label>
                </div>
                <RangeControl
                  label="背景明暗"
                  value={appearance.backgroundBrightness}
                  min={0.5}
                  max={1.3}
                  step={0.01}
                  display={`${Math.round(appearance.backgroundBrightness * 100)}%`}
                  onChange={(value) =>
                    onChange({ backgroundBrightness: value })
                  }
                />
              </div>
            ) : null}

            {appearance.backgroundType === "gradient" ? (
              <div className="custom-controls">
                <div
                  className="gradient-preview"
                  style={{
                    background: `linear-gradient(${appearance.gradientAngle}deg, ${appearance.gradientFrom}, ${appearance.gradientTo})`,
                  }}
                  aria-hidden="true"
                />
                <div className="color-row two-colors">
                  <label className="color-field">
                    <span>起点</span>
                    <span className="color-picker-shell">
                      <input
                        type="color"
                        value={appearance.gradientFrom}
                        onChange={(event) =>
                          onChange({ gradientFrom: event.target.value })
                        }
                        aria-label="选择渐变起点颜色"
                      />
                      <code>{appearance.gradientFrom.toUpperCase()}</code>
                    </span>
                  </label>
                  <label className="color-field">
                    <span>终点</span>
                    <span className="color-picker-shell">
                      <input
                        type="color"
                        value={appearance.gradientTo}
                        onChange={(event) =>
                          onChange({ gradientTo: event.target.value })
                        }
                        aria-label="选择渐变终点颜色"
                      />
                      <code>{appearance.gradientTo.toUpperCase()}</code>
                    </span>
                  </label>
                </div>
                <RangeControl
                  label="渐变角度"
                  value={appearance.gradientAngle}
                  min={0}
                  max={360}
                  step={1}
                  display={`${appearance.gradientAngle}°`}
                  onChange={(value) => onChange({ gradientAngle: value })}
                />
                <RangeControl
                  label="背景明暗"
                  value={appearance.backgroundBrightness}
                  min={0.5}
                  max={1.3}
                  step={0.01}
                  display={`${Math.round(appearance.backgroundBrightness * 100)}%`}
                  onChange={(value) =>
                    onChange({ backgroundBrightness: value })
                  }
                />
              </div>
            ) : null}

            {appearance.backgroundType === "image" ? (
              <div className="custom-controls">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(event) => {
                    handleImageFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />

                {image ? (
                  <div className="image-preview">
                    <img src={image.dataUrl} alt="当前自定义背景预览" />
                    <div className="image-preview-info">
                      <span>{image.name}</span>
                      <div>
                        <button
                          type="button"
                          className="button tiny"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={imageBusy}
                        >
                          更换
                        </button>
                        <button
                          type="button"
                          className="button tiny ghost-danger"
                          onClick={onRemoveImage}
                          disabled={imageBusy}
                        >
                          <Trash2
                            size={14}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          移除
                        </button>
                      </div>
                    </div>
                    {imageBusy ? (
                      <span className="image-busy-overlay">
                        <Loader2
                          size={22}
                          className="is-spinning"
                          aria-hidden="true"
                        />
                        正在处理
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`upload-dropzone ${isDragging ? "is-dragging" : ""}`}
                    onClick={() => imageInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    disabled={imageBusy}
                  >
                    {imageBusy ? (
                      <Loader2
                        size={23}
                        className="is-spinning"
                        aria-hidden="true"
                      />
                    ) : (
                      <ImageIcon size={23} strokeWidth={1.4} aria-hidden="true" />
                    )}
                    <span>
                      {imageBusy ? "正在处理图片…" : "上传一张照片"}
                    </span>
                    <small>点击选择，或把图片拖到这里 · 最大 20MB</small>
                  </button>
                )}

                <RangeControl
                  label="图片不透明度"
                  value={appearance.imageOpacity}
                  min={0.2}
                  max={1}
                  step={0.01}
                  display={`${Math.round(appearance.imageOpacity * 100)}%`}
                  onChange={(value) => onChange({ imageOpacity: value })}
                />
                <RangeControl
                  label="图片模糊"
                  value={appearance.imageBlur}
                  min={0}
                  max={24}
                  step={1}
                  display={`${appearance.imageBlur}px`}
                  onChange={(value) => onChange({ imageBlur: value })}
                />
                <RangeControl
                  label="图片暗度"
                  value={appearance.imageDim}
                  min={0}
                  max={0.75}
                  step={0.01}
                  display={`${Math.round(appearance.imageDim * 100)}%`}
                  onChange={(value) => onChange({ imageDim: value })}
                />
                <p className="control-note">
                  背景照片只保存在当前浏览器；文字页会自动加上柔光层，保持可读。
                </p>
              </div>
            ) : null}
          </section>

          <section className="panel-section data-section">
            <div className="panel-section-heading">
              <h3>数据与备份</h3>
              <span>{formatNumber(entryCount)} 天在本机</span>
            </div>

            <div className="data-actions">
              <button
                type="button"
                className="data-action"
                onClick={onExportMarkdown}
                disabled={entryCount === 0}
              >
                <span className="data-action-icon">
                  <FileText size={18} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="data-action-copy">
                  <strong>导出 Markdown</strong>
                  <small>按日期排好的单篇长文</small>
                </span>
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="data-action"
                onClick={onExportJson}
                disabled={entryCount === 0}
              >
                <span className="data-action-icon">
                  <FileJson size={18} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="data-action-copy">
                  <strong>导出完整备份</strong>
                  <small>含笔记、外观与背景照片</small>
                </span>
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="data-action"
                onClick={() => importInputRef.current?.click()}
              >
                <span className="data-action-icon">
                  <Upload size={18} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <span className="data-action-copy">
                  <strong>导入备份</strong>
                  <small>支持 .json 与 .md 文件</small>
                </span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                hidden
                accept=".json,.md,.markdown,application/json,text/markdown"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) onImportFile(file);
                }}
              />
            </div>

            <div className="privacy-note">
              <span className="privacy-icon" aria-hidden="true">
                <Palette size={15} strokeWidth={1.7} />
              </span>
              <p>
                笔记与背景都只留在这台设备的浏览器里，不会上传。
                清理浏览器数据前，记得先导出一份备份。
              </p>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
