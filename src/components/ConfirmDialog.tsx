import { useEffect, useId, useRef, type MouseEvent } from "react";
import { AlertTriangle, Upload, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  detail?: string;
  confirmLabel: string;
  cancelLabel?: string;
  kind?: "danger" | "import";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel = "取消",
  kind = "danger",
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  const Icon = kind === "import" ? Upload : AlertTriangle;

  return (
    <div
      className="overlay dialog-overlay"
      role="presentation"
      onMouseDown={handleOverlayClick}
    >
      <div
        className={`dialog confirm-dialog ${kind === "danger" ? "is-danger" : ""}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          type="button"
          className="dialog-close"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>

        <span className={`dialog-icon ${kind}`}>
          <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
        </span>
        <h2 id={titleId}>{title}</h2>
        <p className="dialog-copy" id={descriptionId}>
          {description}
        </p>
        {detail ? <p className="dialog-detail">{detail}</p> : null}

        <div className="dialog-actions">
          <button
            type="button"
            className="button ghost"
            onClick={onClose}
            ref={cancelRef}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${kind === "danger" ? "danger" : "primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
