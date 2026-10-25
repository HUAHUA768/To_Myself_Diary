import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import type { ToastMessage } from "../types";

interface ToastProps {
  toast: ToastMessage;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 4200);
    return () => window.clearTimeout(timer);
  }, [toast.id, onClose]);

  const Icon = toast.tone === "error" ? AlertCircle : CheckCircle2;

  return (
    <div
      className={`toast ${toast.tone === "error" ? "is-error" : ""}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
      <span>{toast.message}</span>
      <button type="button" onClick={onClose} aria-label="关闭提示">
        <X size={15} strokeWidth={1.9} aria-hidden="true" />
      </button>
    </div>
  );
}
