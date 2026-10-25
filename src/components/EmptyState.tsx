import { ArrowDownRight, Feather } from "lucide-react";

interface EmptyStateProps {
  onStart: () => void;
}

export function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <span className="empty-stroke stroke-one" />
        <span className="empty-stroke stroke-two" />
        <span className="empty-stroke stroke-three" />
        <Feather size={22} strokeWidth={1.3} className="empty-feather" />
      </div>

      <p className="empty-kicker">THE FIRST LINE</p>
      <h2>这页纸，还在等第一行字。</h2>
      <p className="empty-copy">
        不必写得完整。记下此刻的一件小事，
        <br />
        今天就有了形状。
      </p>
      <button type="button" className="empty-action" onClick={onStart}>
        写下今天
        <ArrowDownRight size={17} strokeWidth={1.9} aria-hidden="true" />
      </button>
    </div>
  );
}
