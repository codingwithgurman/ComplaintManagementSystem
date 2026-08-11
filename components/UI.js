"use client";

import { STATUSES, statusPillClass, priorityClass, formatDate } from "@/lib/data";

export function StatusPill({ status }) {
  return <span className={`pill ${statusPillClass(status)}`}>{status}</span>;
}

export function PriorityTag({ priority }) {
  return <span className={`priority ${priorityClass(priority)}`}>{priority}</span>;
}

// Boarding-pass style progress tracker. Three steps now that
// there's no separate staff "Assigned" stage — admin moves a
// complaint straight from Pending to In Progress to Resolved.
export function Tracker({ status, createdAt, updatedAt }) {
  const currentIdx = STATUSES.indexOf(status);
  return (
    <div className="tracker">
      {STATUSES.map((step, i) => {
        const state = i < currentIdx ? "done" : i === currentIdx ? "current" : "";
        const icon = i < currentIdx ? "\u2713" : i + 1;
        const dateLabel = i === 0 ? formatDate(createdAt) : i <= currentIdx ? formatDate(updatedAt) : "—";
        return (
          <div className={`tracker-step ${state}`} key={step}>
            <div className="line"></div>
            <div className="dot">{icon}</div>
            <div className="label">{step}</div>
            <div className="sub">{i <= currentIdx ? dateLabel : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}

export function EmptyState({ glyph = "\u{1F4CB}", children }) {
  return (
    <div className="empty-state">
      <div className="glyph">{glyph}</div>
      {children}
    </div>
  );
}
